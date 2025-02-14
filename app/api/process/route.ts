import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getBlacklist, getContacts } from '@/lib/google/sheets';
import { verifyEmail } from '@/lib/api/disify';
import { enrichLeadData, generateEmail } from '@/lib/api/gemini';
import { sendEmail } from '@/lib/google/gmail';

async function logProcessing(stage: string, status: 'success' | 'error', message: string, metadata?: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    await supabase.from('processing_logs').insert({
      user_id: user.id,
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
  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError) {
      throw new Error('Failed to load settings');
    }

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    if (!settings.blacklist_sheet_id || !settings.contacts_sheet_id) {
      return NextResponse.json({ error: 'Sheet IDs not configured' }, { status: 400 });
    }

    // 1. Load and process blacklist
    const blacklist = await getBlacklist(settings.blacklist_sheet_id);
    await logProcessing('blacklist', 'success', `Loaded ${blacklist.length} blacklisted emails`);

    // 2. Load and filter contacts
    const contacts = await getContacts(settings.contacts_sheet_id);
    const filteredContacts = contacts.filter(
      contact => !blacklist.includes(contact.email?.toLowerCase().trim())
    );
    await logProcessing('blacklist', 'success', `Filtered ${contacts.length - filteredContacts.length} blacklisted contacts`);

    // 3. Process each contact
    let successCount = 0;
    let failureCount = 0;

    for (const contact of filteredContacts) {
      try {
        // Skip if no email
        if (!contact.email) {
          await logProcessing('verification', 'error', 'Missing email address', { contact });
          failureCount++;
          continue;
        }

        // Verify email
        const isValid = await verifyEmail(contact.email);
        if (!isValid) {
          await logProcessing('verification', 'error', `Invalid email: ${contact.email}`);
          failureCount++;
          continue;
        }

        // Enrich data
        const enrichmentData = await enrichLeadData(contact);
        
        // Generate email
        const email = await generateEmail(contact, enrichmentData);
        
        // Send email
        await sendEmail(contact.email, email.subject, email.body);
        
        // Log success
        await supabase.from('lead_history').insert({
          user_id: user.id,
          email: contact.email,
          status: 'success',
          details: {
            enrichment_data: enrichmentData,
            email_subject: email.subject
          }
        });

        await supabase.from('email_history').insert({
          user_id: user.id,
          email: contact.email,
          subject: email.subject,
          status: 'sent'
        });

        successCount++;
        await logProcessing('email', 'success', `Email sent to ${contact.email}`);
      } catch (error) {
        failureCount++;
        await logProcessing('email', 'error', `Failed to process contact: ${contact.email}`, { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    // Update dashboard stats
    await supabase
      .from('dashboard_stats')
      .upsert({
        user_id: user.id,
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
      .eq('user_id', user.id);

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
      { error: error instanceof Error ? error.message : 'Processing failed' }, 
      { status: 500 }
    );
  }
}