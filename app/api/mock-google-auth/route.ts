import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { success } = await request.json();

  if (success) {
    // Simulate successful Google authentication
    return NextResponse.json({
      isAuthenticated: true,
      expiryDate: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    });
  } else {
    return NextResponse.json({ isAuthenticated: false });
  }
}
