import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google/auth';

export async function GET() {
  const authUrl = getAuthUrl();
  return NextResponse.json({ authUrl });
}
