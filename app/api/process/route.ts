import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/lib/types';
import { getBlacklist, getContacts, updateContact } from '@/lib/google/sheets';
import { verifyEmail } from '@/lib/api/disify';
import { enrichLeadData, generateEmail, EnrichmentData } from '@/lib/api/gemini';
import { sendEmail } from '@/lib/google/gmail';

// Simple in-memory rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute
const userRequests = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = userRequests.get(userId);

  // Clean up expired entries
  if (userLimit && now > userLimit.resetTime) {
    userRequests.delete(userId);
  }

  if (!userLimit) {
    userRequests.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

type LogStatus = 'success' | 'error' | 'warning';

interface ProcessingConfig {
  startRow?: number;
  endRow?: number;
  delayBetweenEmails?: number; // in seconds
  testMode?: boolean;
  updateScheduling?: boolean;
}

const BATCH_SIZE = 3; // Process 3 contacts per batch
const VERCEL_TIMEOUT = 85000; // 85 seconds to be safe

async function logProcessing(supabase: ReturnType<typeof createServerClient<Database>>, userId: string, stage: string, status: LogStatus, message: string, metadata?: any) {
  try {
    const dbStatus = status === 'warning' ? 'error' : status;
    
    console.log(`[${stage}] ${status}: ${message}`, metadata);
    await supabase.from('processing_logs').insert({
      user_id: userId,
      stage,
      status: dbStatus,
      message,
      metadata: {
        ...metadata,
        level: status,
      },
    });
  } catch (error) {
    console.error('Failed to log processing:', error);
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processBatch(
  contacts: any[],
  settings: any,
  config: ProcessingConfig,
  supabase: any,
  userId: string,
  startIndex: number,
  batchStartTime: number
): Promise<{ success: number; failure: number; emails: any[] }> {
  let successCount = 0;
  let failureCount = 0;
  let generatedEmails: Array<{ to: string, subject: string, body: string, enrichmentData: EnrichmentData }> = [];

  for (let i = 0; i < contacts.length; i++) {
    // Check if we're approaching the timeout
    const timeElapsed = Date.now() - batchStartTime;
    if (timeElapsed > VERCEL_TIMEOUT) {
      break;
    }

    const contact = contacts[i];
    const currentIndex = startIndex + i;

    try {
      console.log('Processing contact:', contact.email);
      
      if (!contact.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        await logProcessing(supabase, userId, 'verification', 'error', 'Invalid email address', { 
          contact,
          error: !contact.email ? 'Missing email' : 'Invalid email format'
        });
        failureCount++;
        continue;
      }

      console.log('Verifying email:', contact.email);
      const isValid = await verifyEmail(contact.email);
      
      if (!isValid) {
        await logProcessing(supabase, userId, 'verification', 'warning', `Email verification failed: ${contact.email}`, {
          email: contact.email,
          verificationResult: isValid
        });
      }

      console.log('Enriching data for:', contact.email);
      let enrichmentData: EnrichmentData;
      try {
        enrichmentData = await enrichLeadData({
          ...contact,
          geminiApiKey: settings.gemini_api_key ?? "",
          temperature: settings.temperature || 0.7,
          topK: settings.top_k || 40,
          topP: settings.top_p || 0.95,
          useGoogleSearch: settings.use_google_search || false,
          enrichmentPrompt: settings.enrichment_prompt || undefined
        });
      } catch (error) {
        console.error('Failed to enrich data:', error);
        enrichmentData = {
          companyInfo: "Informace o společnosti nejsou k dispozici.",
          positionInfo: "Detaily o pozici nejsou k dispozici.",
          industryTrends: "Aktuální trendy v oboru nejsou k dispozici.",
          commonInterests: "Společné zájmy nelze určit.",
          potentialPainPoints: "Možné problémy nelze identifikovat.",
          relevantNews: "Žádné relevantní novinky nejsou k dispozici."
        };
      }
      
      console.log('Generating email for:', contact.email);
      let email;
      try {
        email = await generateEmail(
          contact, 
          enrichmentData,
          {
            ...contact,
            geminiApiKey: settings.gemini_api_key ?? "",
            temperature: settings.temperature || 0.7,
            topK: settings.top_k || 40,
            topP: settings.top_p || 0.95,
            emailPrompt: settings.email_prompt || undefined,
            senderEmail: settings.impersonated_email ?? ""
          }
        );
      } catch (error) {
        console.error('Failed to generate email:', error);
        email = {
          subject: `Introduction from ${settings.impersonated_email}`,
          body: `Dear ${contact.firstName},\n\nI hope this email finds you well. I noticed your role as ${contact.position} at ${contact.company} and wanted to connect.\n\nBest regards,\n${settings.impersonated_email}`
        };
      }

      if (!config.testMode) {
        // Calculate scheduled time with delay
        const scheduledTime = new Date(Date.now() + (currentIndex * (config.delayBetweenEmails ?? 30) * 1000));
        
        // Always update scheduling information
        await updateContact(
          settings.contacts_sheet_id ?? "",
          contact.email,
          {
            scheduledFor: scheduledTime.toISOString(),
            status: 'pending'
          }
        );

        console.log('Sending email to:', contact.email, 'as:', settings.impersonated_email);
        await sendEmail(contact.email, email.subject, email.body, settings.impersonated_email ?? "");
        
        // Update status to sent
        await updateContact(
          settings.contacts_sheet_id ?? "",
          contact.email,
          {
            status: 'sent'
          }
        );
        
        await supabase.from('lead_history').insert({
          user_id: userId,
          email: contact.email,
          status: 'success',
          details: {
            enrichment_data: enrichmentData,
            email_subject: email.subject,
            sent_as: settings.impersonated_email,
            scheduled_for: scheduledTime.toISOString()
          }
        });

        await supabase.from('email_history').insert({
          user_id: userId,
          email: contact.email,
          subject: email.subject,
          status: 'sent',
          scheduled_for: scheduledTime.toISOString()
        });
      } else {
        // Store generated email for test mode
        generatedEmails.push({
          to: contact.email,
          subject: email.subject,
          body: email.body,
          enrichmentData
        });
      }

      successCount++;
      await logProcessing(supabase, userId, 'email', 'success', 
        config.testMode ? `Test email generated for ${contact.email}` : `Email sent to ${contact.email} as ${settings.impersonated_email}`
      );
      console.log('Successfully processed:', contact.email);
    } catch (error) {
      console.error('Failed to process contact:', contact.email, error);
      failureCount++;
      
      await updateContact(
        settings.contacts_sheet_id ?? "",
        contact.email,
        {
          status: 'failed'
        }
      );
      
      await logProcessing(supabase, userId, 'email', 'error', `Failed to process contact: ${contact.email}`, { 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return { success: successCount, failure: failureCount, emails: generatedEmails };
}

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerSupabaseClient(cookieStore);
  let userId: string;

  try {
    const config: ProcessingConfig = await request.json();
    const testMode = config.testMode ?? false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    userId = user.id;
    console.log('Processing for user:', userId);

    // Check rate limit
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' }, 
        { status: 429 }
      );
    }

    // Get settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError) {
      console.error('Settings error:', settingsError);
      return NextResponse.json({ error: 'Failed to load settings', details: settingsError }, { status: 500 });
    }

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    // Validate required settings
    const requiredSettings = {
      'Blacklist Sheet ID': settings.blacklist_sheet_id,
      'Contacts Sheet ID': settings.contacts_sheet_id,
      'Gemini API Key': settings.gemini_api_key,
      'Impersonated Email': settings.impersonated_email,
    };

    const missingSettings = Object.entries(requiredSettings)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingSettings.length > 0) {
      return NextResponse.json({ 
        error: 'Missing required settings', 
        missing: missingSettings 
      }, { status: 400 });
    }

    console.log('Starting blacklist processing...');
    try {
      const blacklist = await getBlacklist(settings.blacklist_sheet_id ?? "");
      await logProcessing(supabase, userId, 'blacklist', 'success', `Loaded ${blacklist.length} blacklisted emails`);
      console.log('Blacklist loaded:', blacklist.length, 'emails');

      console.log('Loading contacts...');
      const contacts = await getContacts(settings.contacts_sheet_id ?? "");
      if (!contacts || !Array.isArray(contacts)) {
        throw new Error('Failed to load contacts: Invalid response format');
      }

      console.log('Contacts loaded:', contacts.length);
      let filteredContacts = contacts.filter(
        contact => contact.email && !blacklist.includes(contact.email.toLowerCase().trim())
      );
      
      // Apply row range filtering if specified
      if (config.startRow !== undefined || config.endRow !== undefined) {
        const start = config.startRow ?? 0;
        const end = config.endRow ?? filteredContacts.length;
        filteredContacts = filteredContacts.slice(start, end);
      }
      
      await logProcessing(supabase, userId, 'blacklist', 'success', `Filtered ${contacts.length - filteredContacts.length} blacklisted contacts`);
      console.log('Filtered contacts:', filteredContacts.length);

      // Process contacts in batches
      let totalSuccess = 0;
      let totalFailure = 0;
      let allGeneratedEmails: Array<{ to: string, subject: string, body: string, enrichmentData: EnrichmentData }> = [];

      for (let i = 0; i < filteredContacts.length; i += BATCH_SIZE) {
        const batchContacts = filteredContacts.slice(i, i + BATCH_SIZE);
        const batchStartTime = Date.now();
        
        const { success, failure, emails } = await processBatch(
          batchContacts,
          settings,
          config,
          supabase,
          userId,
          i,
          batchStartTime
        );

        totalSuccess += success;
        totalFailure += failure;
        allGeneratedEmails = allGeneratedEmails.concat(emails);

        // Update progress in database
        await supabase
          .from('dashboard_stats')
          .upsert({
            user_id: userId,
            total_leads: contacts.length,
            processed_leads: totalSuccess + totalFailure,
            success_rate: totalSuccess > 0 ? (totalSuccess / (totalSuccess + totalFailure)) * 100 : 0,
            last_processed: new Date().toISOString(),
            blacklist_count: blacklist.length,
            contacts_count: contacts.length,
            emails_sent: totalSuccess,
          }, {
            onConflict: 'user_id'
          });
      }

      if (!testMode) {
        await supabase
          .from('settings')
          .update({ updated_at: new Date().toISOString() })
          .eq('user_id', userId);
      }

      console.log('Processing completed successfully');
      return NextResponse.json({ 
        success: true,
        stats: {
          total: contacts.length,
          processed: totalSuccess + totalFailure,
          success: totalSuccess,
          failure: totalFailure,
          rowRange: config.startRow !== undefined || config.endRow !== undefined ? {
            start: config.startRow ?? 0,
            end: config.endRow ?? contacts.length
          } : undefined
        },
        testResults: testMode ? {
          emails: allGeneratedEmails,
          delayBetweenEmails: config.delayBetweenEmails
        } : undefined
      });
    } catch (error) {
      console.error('Blacklist/contacts error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Processing failed:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Processing failed',
        details: error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}
