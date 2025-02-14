import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getBlacklist, getContacts } from '@/lib/google/sheets';
import { verifyEmail } from '@/lib/api/disify';
import { enrichLeadData, generateEmail } from '@/lib/api/gemini';
import { sendEmail } from '@/lib/google/gmail';

async function logProcessing(supabase: any, userId: string, stage: string, status: 'success' | 'error', message: string, metadata?: any) {
  try {
    await supabase.from('processing_logs').insert({
      user_id: userId,
      stage,
      status,
      message,
      metadata,
    });
  } catch (error) {
    console.error('Failed to log processing:', error);
  }
}

export async function POST() {
  const cookieStore = cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  try {
    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) throw authError;
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError) {
      return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
    }

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    if (!settings.blacklist_sheet_id || !settings.contacts_sheet_id) {
      return NextResponse.json({ error: 'Sheet IDs not configured' }, { status: 400 });
    }

    if (!settings.gemini_api_key) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 400 });
    }

    // 1. Load and process blacklist
    const blacklist = await getBlacklist(settings.blacklist_sheet_id);
    await logProcessing(supabase, userId, 'blacklist', 'success', `Loaded ${blacklist.length} blacklisted emails`);

    // 2. Load and filter contacts
    const contacts = await getContacts(settings.contacts_sheet_id);
    if (!contacts || !Array.isArray(contacts)) {
      return NextResponse.json({ error: 'Failed to load contacts' }, { status: 500 });
    }

    const filteredContacts = contacts.filter(
      contact => contact.email && !blacklist.includes(contact.email.toLowerCase().trim())
    );
    await logProcessing(supabase, userId, 'blacklist', 'success', `Filtered ${contacts.length - filteredContacts.length} blacklisted contacts`);

    // 3. Process each contact
    let successCount = 0;
    let failureCount = 0;

    for (const contact of filteredContacts) {
      try {
        // Skip if no email
        if (!contact.email) {
          await logProcessing(supabase, userId, 'verification', 'error', 'Missing email address', { contact });
          failureCount++;
          continue;
        }

        // Verify email
        const isValid = await verifyEmail(contact.email);
        if (!isValid) {
          await logProcessing(supabase, userId, 'verification', 'error', `Invalid email: ${contact.email}`);
          failureCount++;
          continue;
        }

        // Enrich data
        const enrichmentData = await enrichLeadData({
          ...contact,
          geminiApiKey: settings.gemini_api_key,
          temperature: settings.temperature,
          topK: settings.top_k,
          topP: settings.top_p,
          useGoogleSearch: settings.use_google_search,
          enrichmentPrompt: settings.enrichment_prompt
        });
        
        // Generate email
        const email = await generateEmail(
          contact, 
          enrichmentData,
          {
            geminiApiKey: settings.gemini_api_key,
            temperature: settings.temperature,
            topK: settings.top_k,
            topP: settings.top_p,
            emailPrompt: settings.email_prompt
          }
        );
        
        // Send email
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
      } catch (error) {
        failureCount++;
        await logProcessing(supabase, userId, 'email', 'error', `Failed to process contact: ${contact.email}`, { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    // Update dashboard stats
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
      .update({ last_execution_at: new Date().toISOString() })
      .eq('user_id', userId);

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