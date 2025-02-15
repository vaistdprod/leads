import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getBlacklist, getContacts } from '@/lib/google/sheets';
import { verifyEmail } from '@/lib/api/disify';
import { enrichLeadData, generateEmail } from '@/lib/api/gemini';
import { sendEmail } from '@/lib/google/gmail';

type LogStatus = 'success' | 'error' | 'warning';

async function logProcessing(supabase: any, userId: string, stage: string, status: LogStatus, message: string, metadata?: any) {
  try {
    // Map 'warning' to 'error' for database compatibility while preserving the warning in metadata
    const dbStatus = status === 'warning' ? 'error' : status;
    
    console.log(`[${stage}] ${status}: ${message}`, metadata);
    await supabase.from('processing_logs').insert({
      user_id: userId,
      stage,
      status: dbStatus,
      message,
      metadata: {
        ...metadata,
        level: status, // Store original status level in metadata
      },
    });
  } catch (error) {
    console.error('Failed to log processing:', error);
  }
}

export async function POST() {
  const cookieStore = cookies();
  const supabase = createServerSupabaseClient(cookieStore);
  let userId: string;

  try {
    // Get authenticated user
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
    // 1. Load and process blacklist
    try {
      const blacklist = await getBlacklist(settings.blacklist_sheet_id ?? "");
      await logProcessing(supabase, userId, 'blacklist', 'success', `Loaded ${blacklist.length} blacklisted emails`);
      console.log('Blacklist loaded:', blacklist.length, 'emails');

      // 2. Load and filter contacts
      console.log('Loading contacts...');
      const contacts = await getContacts(settings.contacts_sheet_id ?? "");
      if (!contacts || !Array.isArray(contacts)) {
        throw new Error('Failed to load contacts: Invalid response format');
      }

      console.log('Contacts loaded:', contacts.length);
      const filteredContacts = contacts.filter(
        contact => contact.email && !blacklist.includes(contact.email.toLowerCase().trim())
      );
      
      await logProcessing(supabase, userId, 'blacklist', 'success', `Filtered ${contacts.length - filteredContacts.length} blacklisted contacts`);
      console.log('Filtered contacts:', filteredContacts.length);

      // 3. Process each contact
      let successCount = 0;
      let failureCount = 0;

      for (const contact of filteredContacts) {
        try {
          console.log('Processing contact:', contact.email);
          
          // Skip if no email
          if (!contact.email) {
            await logProcessing(supabase, userId, 'verification', 'error', 'Missing email address', { contact });
            failureCount++;
            continue;
          }

          // Verify email
          console.log('Verifying email:', contact.email);
          const isValid = await verifyEmail(contact.email);
          
          // Continue with processing even if email verification fails
          if (!isValid) {
            await logProcessing(supabase, userId, 'verification', 'warning', `Email verification failed: ${contact.email}`, {
              email: contact.email,
              verificationResult: isValid
            });
          }

          // Enrich data
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
          
          // Generate email
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
              senderEmail: process.env.GOOGLE_DELEGATED_USER
            }
          );
          
          // Send email
          console.log('Sending email to:', contact.email);
          await sendEmail(contact.email, email.subject, email.body);
          
          // Log success
          await supabase.from('lead_history').insert({
            user_id: userId,
            email: contact.email,
            status: 'success',
            details: {
              enrichment_data: enrichmentData,
              email_subject: email.subject
            }
          });

          await supabase.from('email_history').insert({
            user_id: userId,
            email: contact.email,
            subject: email.subject,
            status: 'sent'
          });

          successCount++;
          await logProcessing(supabase, userId, 'email', 'success', `Email sent to ${contact.email}`);
          console.log('Successfully processed:', contact.email);
        } catch (error) {
          console.error('Failed to process contact:', contact.email, error);
          failureCount++;
          await logProcessing(supabase, userId, 'email', 'error', `Failed to process contact: ${contact.email}`, { 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      }

      // Update dashboard stats
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

      // Update last execution time
      await supabase
        .from('settings')
        .update({ updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      console.log('Processing completed successfully');
      return NextResponse.json({ 
        success: true,
        stats: {
          total: contacts.length,
          processed: successCount + failureCount,
          success: successCount,
          failure: failureCount
        }
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