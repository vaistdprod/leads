import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getGoogleAuthClient } from '@/lib/google/googleAuth';

export async function GET() {
  try {
    const auth = await getGoogleAuthClient();
    const admin = google.admin({ version: 'directory_v1', auth });

    // Get domain from the delegated user email
    const domain = process.env.GOOGLE_DELEGATED_USER?.split('@')[1];
    
    if (!domain) {
      throw new Error('Could not determine domain from delegated user');
    }

    const response = await admin.users.list({
      domain,
      orderBy: 'email',
      projection: 'basic',
      viewType: 'domain_public',
    });

    const users = response.data.users?.map(user => ({
      email: user.primaryEmail,
      name: user.name?.fullName || user.primaryEmail?.split('@')[0],
    })) || [];

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Failed to fetch domain users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domain users' },
      { status: 500 }
    );
  }
}