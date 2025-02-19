import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getGoogleAuthClient } from '@/lib/google/googleAuth';
import { getEnvOrThrow } from '@/lib/env/validateEnv';

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const { startDate, endDate } = await req.json();
    
    const auth = await getGoogleAuthClient();
    const searchconsole = google.searchconsole('v1').searchanalytics;
    const siteUrl = getEnvOrThrow('GOOGLE_SEARCH_CONSOLE_SITE_URL');

    console.log('Search Console API: Preparing request', {
      siteUrl,
      startDate,
      endDate,
    });

    const response = await searchconsole.query({
      auth,
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 100,
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'country',
            expression: 'cze'  // Filter for Czech Republic
          }]
        }],
      },
    });

    console.log('Search Console API: Response received', {
      rowCount: response.data.rows?.length || 0,
    });

    return NextResponse.json(
      response.data,
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Search Console API error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to fetch search data' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}
