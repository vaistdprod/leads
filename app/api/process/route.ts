import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/lib/types';
import { getBlacklist, getContacts } from '@/lib/google/sheets';
import { verifyEmail } from '@/lib/api/disify';
import { enrichLeadData, generateEmail } from '@/lib/api/gemini';
import { sendEmail } from '@/lib/google/gmail';

type LogStatus = 'success' | 'error' | 'warning';

interface ProcessingConfig {
  startRow?: number;
  endRow?: number;
  delayBetweenEmails?: number; // in seconds
  testMode?: boolean;
  updateScheduling?: boolean;
}

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

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerSupabaseClient(cookieStore);
  let userId: string;

  try {
    const config: ProcessingConfig = await request.json();
    const testMode = config.testMode ?? false;
    const delayBetweenEmails = (config.delayBetweenEmails ?? 30) * 1000; // Convert to milliseconds

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    userId = user.id;
    console.log('Processing for user:', userId);

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

      let successCount = 0;
      let failureCount = 0;
      let generatedEmails: Array<{ to: string, subject: string, body: string, enrichmentData: any }> = [];

      for (const [index, contact] of filteredContacts.entries()) {
        try {
          console.log('Processing contact:', contact.email);
          
          if (!contact.email) {
            await logProcessing(supabase, userId, 'verification', 'error', 'Missing email address', { contact });
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
          const enrichmentData = await enrichLeadData({
            ...contact,
            geminiApiKey: settings.gemini_api_key ?? "",
            temperature: settings.temperature || 0.7,
            topK: settings.top_k || 40,
            topP: settings.top_p || 0.95,
            useGoogleSearch: settings.use_google_search || false,
            enrichmentPrompt: settings.enrichment_prompt
          });
          
          console.log('Generating email for:', contact.email);
          const email = await generateEmail(
            contact, 
            enrichmentData,
            {
              geminiApiKey: settings.gemini_api_key ?? "",
              temperature: settings.temperature || 0.7,
              topK: settings.top_k || 40,
              topP: settings.top_p || 0.95,
              emailPrompt: settings.email_prompt ?? undefined,
              senderEmail: settings.impersonated_email ?? ""
            }
          );

          if (!testMode) {
            // Calculate scheduled time with delay
            const scheduledTime = new Date(Date.now() + (index * delayBetweenEmails));
            
            if (config.updateScheduling) {
              // Update scheduling information in sheets
              const response = await fetch(`/api/sheets/contacts?sheetId=${settings.contacts_sheet_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: contact.email,
                  scheduledFor: scheduledTime.toISOString(),
                  status: 'pending'
                })
              });
              
              if (!response.ok) {
                console.warn('Failed to update scheduling info:', await response.text());
              }
            }

            console.log('Sending email to:', contact.email, 'as:', settings.impersonated_email);
            await sendEmail(contact.email, email.subject, email.body, settings.impersonated_email ?? "");
            
            // Update status to sent
            if (config.updateScheduling) {
              await fetch(`/api/sheets/contacts?sheetId=${settings.contacts_sheet_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: contact.email,
                  status: 'sent'
                })
              });
            }
            
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

            // Add delay between emails
            if (index < filteredContacts.length - 1) {
              await delay(delayBetweenEmails);
            }
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
            testMode ? `Test email generated for ${contact.email}` : `Email sent to ${contact.email} as ${settings.impersonated_email}`
          );
          console.log('Successfully processed:', contact.email);
        } catch (error) {
          console.error('Failed to process contact:', contact.email, error);
          failureCount++;
          
          // Check for API key error
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('API key expired') || errorMessage.includes('API_KEY_INVALID')) {
            return NextResponse.json({ 
              error: errorMessage,
              details: 'Please update your Gemini API key in the AI settings.'
            }, { status: 400 });
          }
          
          if (config.updateScheduling) {
            // Update status to failed
            await fetch(`/api/sheets/contacts?sheetId=${settings.contacts_sheet_id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: contact.email,
                status: 'failed'
              })
            });
          }
          
          await logProcessing(supabase, userId, 'email', 'error', `Failed to process contact: ${contact.email}`, { 
            error: errorMessage
          });
        }
      }

      if (!testMode) {
        console.log('Updating dashboard stats...');
        await supabase
          .from('dashboard_stats')
          .upsert({
            user_id: userId,
            total_leads: contacts.length,
            processed_leads: successCount + failureCount,
            success_rate: successCount > 0 ? (successCount / (successCount + failureCount)) * 100 : 0,
            last_processed: new Date().toISOString(),
            blacklist_count: blacklist.length,
            contacts_count: contacts.length,
            emails_sent: successCount,
          }, {
            onConflict: 'user_id'
          });

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
          processed: successCount + failureCount,
          success: successCount,
          failure: failureCount,
          rowRange: config.startRow !== undefined || config.endRow !== undefined ? {
            start: config.startRow ?? 0,
            end: config.endRow ?? contacts.length
          } : undefined
        },
        testResults: testMode ? {
          emails: generatedEmails,
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
