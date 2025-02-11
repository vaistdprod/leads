import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getBlacklist, getContacts } from '@/lib/google/sheets';
import { verifyEmail } from '@/lib/api/disify';
import { enrichLeadData, generateEmail } from '@/lib/api/gemini';
import { sendEmail } from '@/lib/google/gmail';

async function logProcessing(stage: string, status: 'success' | 'error', message: string, metadata?: any) {
  await supabase.from('processing_logs').insert({
    stage,
    status,
    message,
    metadata,
  });
}

export async function POST() {
  try {
    // Get settings
    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .single();

    if (!settings) {
      throw new Error('Settings not found');
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
    for (const contact of filteredContacts) {
      try {
        // Verify email
        const isValid = await verifyEmail(contact.email);
        if (!isValid) {
          await logProcessing('verification', 'error', `Invalid email: ${contact.email}`);
          continue;
        }

        // Enrich data
        const enrichmentData = await enrichLeadData(contact);
        
        // Generate email
        const email = await generateEmail(contact, enrichmentData);
        
        // Send email
        await sendEmail(contact.email, email.subject, email.body);
        
        // Update lead status
        await supabase
          .from('leads')
          .upsert({
            email: contact.email,
            first_name: contact.firstName,
            last_name: contact.lastName,
            company: contact.company,
            position: contact.position,
            phone: contact.phone,
            enrichment_data: enrichmentData,
            email_status: 'valid',
            email_sent: true,
            email_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        await logProcessing('email', 'success', `Email sent to ${contact.email}`);
      } catch (error) {
        await logProcessing('email', 'error', `Failed to process contact: ${contact.email}`, { error: String(error) });
      }
    }

    // Update last execution time
    await supabase
      .from('settings')
      .update({ last_execution_at: new Date().toISOString() })
      .eq('id', settings.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Processing failed:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
