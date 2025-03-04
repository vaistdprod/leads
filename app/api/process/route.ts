import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/types';
import { getBlacklist, getContacts, updateContacts } from '@/lib/google/sheets';
import { verifyEmail } from '@/lib/api/disify';
import { enrichLeadData, generateEmail, EnrichmentData } from '@/lib/api/gemini';
import { sendEmail } from '@/lib/google/gmail';
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

const VERCEL_TIMEOUT = 800000; // 800 seconds
const DEFAULT_DELAY = 30; // 30 seconds between emails by default
const MAX_EMAILS_PER_BATCH = 15; // Process max 15 emails per batch
const PROCESSING_TIME_PER_EMAIL = 20000; // 20 seconds per email for processing

type LogStatus = 'success' | 'error' | 'warning';

interface ProcessingConfig {
  startRow?: number;
  endRow?: number;
  delayBetweenEmails?: number;
  testMode?: boolean;
  updateScheduling?: boolean;
  shouldAbort?: boolean;
}

async function logProcessing(supabase: ReturnType<typeof createServerClient<Database>>, userId: string, stage: string, status: LogStatus, message: string) {
  try {
    console.log(`[${stage}] ${status}: ${message}`);
    await supabase.from('processing_logs').insert({
      user_id: userId,
      stage,
      status: status === 'warning' ? 'error' : status,
      message,
      metadata: { level: status },
    });
  } catch (error) {
    console.error('Failed to log processing:', error);
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processBlacklist(contacts: any[], blacklist: string[], sheetId: string) {
  // Normalize blacklist emails and create a Set for faster lookups
  const normalizedBlacklist = new Set(blacklist.map(email => email.toLowerCase().trim()));
  
  // Process each contact
  const processedContacts = [];
  const blacklistedContacts = [];
  const statusUpdates = [];

  for (const contact of contacts) {
    if (!contact.email) continue;
    
    const normalizedEmail = contact.email.toLowerCase().trim();
    if (normalizedBlacklist.has(normalizedEmail)) {
      statusUpdates.push({ email: contact.email, updates: { status: 'blacklist' } });
      blacklistedContacts.push(contact);
    } else {
      processedContacts.push(contact);
    }
  }

  // Batch update all blacklisted contacts at once
  if (statusUpdates.length > 0) {
    try {
      await updateContacts(sheetId, statusUpdates);
    } catch (error) {
      console.error('Failed to update blacklisted contacts:', error);
    }
  }

  console.log(`Blacklist check: ${blacklistedContacts.length} contacts marked as blacklisted`);
  
  return processedContacts;
}

interface StatusUpdate {
  email: string;
  updates: { status: string };
}

async function extractWebsite(company: string): Promise<string | null> {
  // Simple heuristic to extract domain from company name
  // Remove special characters and spaces, add .com
  const domain = company
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
  return domain ? `https://www.${domain}.com` : null;
}

async function getPageSpeedMetrics(url: string, supabase: any): Promise<any> {
  try {
    const response = await fetch('/api/seo/pagespeed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      console.error('Failed to get PageSpeed metrics:', await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting PageSpeed metrics:', error);
    return null;
  }
}

async function processBatch(
  contacts: any[],
  settings: any,
  config: ProcessingConfig,
  supabase: any,
  userId: string,
  batchStartTime: number
): Promise<{ success: number; failure: number; emails: any[] }> {
  let successCount = 0;
  let failureCount = 0;
  let generatedEmails: Array<{ to: string, subject: string, body: string, enrichmentData: EnrichmentData }> = [];
  let statusUpdates: StatusUpdate[] = [];

  for (let i = 0; i < contacts.length; i++) {
    // Check for abort signal
    if (config.shouldAbort) {
      await logProcessing(supabase, userId, 'processing', 'warning', 'Processing aborted by user');
      // Update any pending statuses before breaking
      if (statusUpdates.length > 0 && !config.testMode) {
        try {
          await updateContacts(settings.contacts_sheet_id ?? "", statusUpdates);
        } catch (error) {
          console.error('Failed to update contact statuses during abort:', error);
        }
      }
      break;
    }

    // Check remaining time
    const timeElapsed = Date.now() - batchStartTime;
    const remainingTime = VERCEL_TIMEOUT - timeElapsed;
    const remainingEmails = contacts.length - i;
    const estimatedTimeNeeded = remainingEmails * PROCESSING_TIME_PER_EMAIL;

    if (remainingTime < estimatedTimeNeeded) {
      console.log('Approaching timeout, stopping batch');
      break;
    }

    const contact = contacts[i];

    try {
      // Only skip contacts that were marked as blacklisted in this run
      if (contact.status === 'blacklist') {
        continue;
      }

      // Validate email
      if (!contact.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        await logProcessing(supabase, userId, 'verification', 'error', `Invalid email: ${contact.email}`);
        failureCount++;
        continue;
      }

      // Verify email
      const isValid = await verifyEmail(contact.email);
      if (!isValid) {
        await logProcessing(supabase, userId, 'verification', 'warning', `Verification failed: ${contact.email}`);
      }

      // Extract and analyze website
      const website = await extractWebsite(contact.company);
      let pageSpeedMetrics = null;
      
      if (website) {
        pageSpeedMetrics = await getPageSpeedMetrics(website, supabase);
        // Wait for rate limit if we got metrics
        if (pageSpeedMetrics) {
          await delay(60000); // Wait 1 minute between PageSpeed API calls
        }
      }

      // Generate email content
      let enrichmentData: EnrichmentData;
      try {
        enrichmentData = await enrichLeadData({
          ...contact,
          website,
          pageSpeedMetrics,
          geminiApiKey: settings.gemini_api_key ?? "",
          temperature: settings.temperature || 0.7,
          topK: settings.top_k || 40,
          topP: settings.top_p || 0.95,
          useGoogleSearch: settings.use_google_search || false,
          enrichmentPrompt: settings.enrichment_prompt || undefined
        });
      } catch (error) {
        enrichmentData = {
          companyInfo: "Informace o společnosti nejsou k dispozici.",
          positionInfo: "Detaily o pozici nejsou k dispozici.",
          industryTrends: "Aktuální trendy v oboru nejsou k dispozici.",
          commonInterests: "Společné zájmy nelze určit.",
          potentialPainPoints: "Možné problémy nelze identifikovat.",
          relevantNews: "Žádné relevantní novinky nejsou k dispozici."
        };
      }

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
        email = {
          subject: `Introduction from ${settings.impersonated_email}`,
          body: `Dear ${contact.firstName},\n\nI hope this email finds you well. I noticed your role as ${contact.position} at ${contact.company} and wanted to connect.\n\nBest regards,\n${settings.impersonated_email}`
        };
      }

      if (!config.testMode) {
        // Collect pending status update
        statusUpdates.push({ email: contact.email, updates: { status: 'pending' } });

        // Wait between emails
        if (i > 0) {
          await delay((config.delayBetweenEmails ?? DEFAULT_DELAY) * 1000);
        }

        // Check for abort again before sending
        if (config.shouldAbort) {
          await logProcessing(supabase, userId, 'processing', 'warning', 'Processing aborted before sending email');
          break;
        }

        // Send email
        await sendEmail(contact.email, email.subject, email.body, settings.impersonated_email ?? "");
        
        // Update status to sent
        statusUpdates.push({ email: contact.email, updates: { status: 'sent' } });
        
        // Record history
        await supabase.from('lead_history').insert({
          user_id: userId,
          email: contact.email,
          status: 'success',
          details: {
            enrichment_data: enrichmentData,
            email_subject: email.subject,
            sent_as: settings.impersonated_email
          }
        });

        await supabase.from('email_history').insert({
          user_id: userId,
          email: contact.email,
          subject: email.subject,
          status: 'sent'
        });

        await logProcessing(supabase, userId, 'email', 'success', `Email sent to ${contact.email}`);
      } else {
        generatedEmails.push({
          to: contact.email,
          subject: email.subject,
          body: email.body,
          enrichmentData
        });
        await logProcessing(supabase, userId, 'email', 'success', `Test email generated for ${contact.email}`);
      }

      successCount++;
    } catch (error) {
      failureCount++;
      statusUpdates.push({ email: contact.email, updates: { status: 'failed' } });
      await logProcessing(supabase, userId, 'email', 'error', `Failed to process ${contact.email}`);
    }
  }

  // Batch update all status changes at once
  if (statusUpdates.length > 0 && !config.testMode) {
    try {
      await updateContacts(settings.contacts_sheet_id ?? "", statusUpdates);
    } catch (error) {
      console.error('Failed to batch update contact statuses:', error);
    }
  }

  return { success: successCount, failure: failureCount, emails: generatedEmails };
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => {
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
        set: (name, value, options) => {
          try {
            cookieStore.set({ name, value, ...options } as ResponseCookie);
          } catch (error) {
            console.error('Error setting cookie:', error);
          }
        },
        remove: (name, options) => {
          try {
            cookieStore.delete(name);
          } catch (error) {
            console.error('Error removing cookie:', error);
          }
        },
      },
    }
  );
  let userId: string;

  try {
    const config: ProcessingConfig = await request.json();
    const testMode = config.testMode ?? false;

    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    userId = user.id;

    // Get settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
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
      return NextResponse.json({ error: 'Missing settings', missing: missingSettings }, { status: 400 });
    }

    try {
      // Check if already aborted
      if (config.shouldAbort) {
        await logProcessing(supabase, userId, 'processing', 'warning', 'Processing aborted before start');
        return NextResponse.json({ 
          success: true,
          aborted: true,
          stats: {
            total: 0,
            processed: 0,
            success: 0,
            failure: 0,
            currentBatch: {
              start: 0,
              end: 0
            }
          }
        });
      }

      // Load blacklist
      const blacklist = await getBlacklist(settings.blacklist_sheet_id ?? "");
      await logProcessing(supabase, userId, 'blacklist', 'success', `Loaded ${blacklist.length} blacklisted emails`);

      // Load contacts
      const columnMappings = settings.column_mappings ?? {
        name: 'název',
        email: 'email',
        company: 'společnost',
        position: 'pozice',
        scheduledFor: 'scheduledfor',
        status: 'status'
      };
      const contacts = await getContacts(settings.contacts_sheet_id ?? "", columnMappings);
      if (!contacts || !Array.isArray(contacts)) {
        throw new Error('Failed to load contacts');
      }

      // Process blacklist first
      const filteredContacts = await processBlacklist(contacts, blacklist, settings.contacts_sheet_id ?? "");
      const blacklistedCount = contacts.length - filteredContacts.length;
      await logProcessing(
        supabase, 
        userId, 
        'blacklist', 
        'success', 
        `Found ${blacklist.length} blacklisted emails, marked ${blacklistedCount} contacts as blacklisted`
      );

      // Check abort after blacklist processing
      if (config.shouldAbort) {
        await logProcessing(supabase, userId, 'processing', 'warning', 'Processing aborted after blacklist check');
        return NextResponse.json({ 
          success: true,
          aborted: true,
          stats: {
            total: contacts.length,
            processed: 0,
            success: 0,
            failure: 0,
            currentBatch: {
              start: 0,
              end: 0
            }
          }
        });
      }

      // Apply row range filtering
      let processableContacts = filteredContacts;
      if (config.startRow !== undefined || config.endRow !== undefined) {
        const start = config.startRow ?? 0;
        const end = config.endRow ?? processableContacts.length;
        processableContacts = processableContacts.slice(start, end);
      }

      // Update scheduledFor for this batch
      if (config.updateScheduling) {
        const now = new Date();
        // Add 1 hour for GMT+1
        now.setHours(now.getHours() + 1);
        const schedulingUpdates = processableContacts.map(contact => ({
          email: contact.email,
          updates: { scheduledFor: now.toISOString() }
        }));
        
        try {
          await updateContacts(settings.contacts_sheet_id ?? "", schedulingUpdates);
          await logProcessing(
            supabase,
            userId,
            'scheduling',
            'success',
            `Updated scheduledFor for ${schedulingUpdates.length} contacts`
          );
        } catch (error) {
          console.error('Failed to update scheduling:', error);
          await logProcessing(
            supabase,
            userId,
            'scheduling',
            'error',
            `Failed to update scheduledFor: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Check abort after scheduling
      if (config.shouldAbort) {
        await logProcessing(supabase, userId, 'processing', 'warning', 'Processing aborted after scheduling');
        return NextResponse.json({ 
          success: true,
          aborted: true,
          stats: {
            total: contacts.length,
            processed: 0,
            success: 0,
            failure: 0,
            currentBatch: {
              start: 0,
              end: 0
            }
          }
        });
      }

      // Process batch
      const startRow = config.startRow ?? 0;
      const batchContacts = processableContacts.slice(0, MAX_EMAILS_PER_BATCH);
      const batchStartTime = Date.now();
      
      const { success, failure, emails } = await processBatch(
        batchContacts,
        settings,
        config,
        supabase,
        userId,
        batchStartTime
      );

      // Check if processing was aborted
      if (config.shouldAbort) {
        await logProcessing(supabase, userId, 'processing', 'warning', 'Processing aborted after batch');
        return NextResponse.json({ 
          success: true,
          aborted: true,
          stats: {
            total: contacts.length,
            processed: startRow + success + failure,
            success,
            failure,
            currentBatch: {
              start: startRow,
              end: startRow + success + failure
            }
          }
        });
      }

      // Update stats
      await supabase
        .from('dashboard_stats')
        .upsert({
          user_id: userId,
          total_leads: contacts.length,
          processed_leads: startRow + success + failure,
          success_rate: success > 0 ? (success / (success + failure)) * 100 : 0,
          last_processed: new Date().toISOString(),
          blacklist_count: blacklist.length,
          contacts_count: contacts.length,
          emails_sent: success,
        }, {
          onConflict: 'user_id'
        });

      // Calculate next batch
      const nextStartRow = startRow + MAX_EMAILS_PER_BATCH;
      const hasMoreContacts = nextStartRow < processableContacts.length;

      if (!testMode) {
        await supabase
          .from('settings')
          .update({ updated_at: new Date().toISOString() })
          .eq('user_id', userId);
      }

      return NextResponse.json({ 
        success: true,
        stats: {
          total: contacts.length,
          processed: startRow + success + failure,
          success,
          failure,
          currentBatch: {
            start: startRow,
            end: startRow + MAX_EMAILS_PER_BATCH
          }
        },
        nextBatch: hasMoreContacts ? {
          startRow: nextStartRow,
          remainingContacts: processableContacts.length - nextStartRow
        } : null,
        testResults: testMode ? {
          emails,
          delayBetweenEmails: config.delayBetweenEmails
        } : undefined
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Processing failed',
        details: error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}
