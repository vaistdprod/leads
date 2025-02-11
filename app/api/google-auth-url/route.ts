import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google/auth';

export async function GET() {
  try {
    const authUrl = getAuthUrl();
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Failed to get Google auth URL:', error);
    return NextResponse.json({ error: 'Failed to get Google auth URL' }, { status: 500 });
  }
}
