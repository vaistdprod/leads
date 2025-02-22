import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const RATE_LIMIT_DELAY = 60 * 1000; // 1 minute in milliseconds

async function getPageSpeedResults(url: string, strategy: 'mobile' | 'desktop', apiKey: string) {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo`;
  
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || `PageSpeed API request failed for ${strategy}`);
  }

  const data = await response.json();
  if (!data.lighthouseResult) {
    throw new Error(`Failed to get ${strategy} performance metrics`);
  }

  const {
    lighthouseResult: {
      categories,
      audits,
      configSettings,
      timing: { total: analysisTime },
      stackPacks,
      environment,
    },
  } = data;

  return {
    scores: {
      performance: categories.performance?.score * 100,
      accessibility: categories.accessibility?.score * 100,
      bestPractices: categories['best-practices']?.score * 100,
      seo: categories.seo?.score * 100,
    },
    metrics: {
      firstContentfulPaint: audits['first-contentful-paint']?.numericValue,
      speedIndex: audits['speed-index']?.numericValue,
      largestContentfulPaint: audits['largest-contentful-paint']?.numericValue,
      timeToInteractive: audits['interactive']?.numericValue,
      totalBlockingTime: audits['total-blocking-time']?.numericValue,
      cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue,
      maxPotentialFid: audits['max-potential-fid']?.numericValue,
      serverResponseTime: audits['server-response-time']?.numericValue,
    },
    opportunities: Object.entries(audits)
      .filter(([_, audit]: [string, any]) => 
        audit.score !== null && 
        audit.score < 0.9 && 
        audit.details?.type === 'opportunity'
      )
      .map(([id, audit]: [string, any]) => ({
        id,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        savings: audit.details?.overallSavingsMs || null,
      })),
    details: {
      deviceEmulation: configSettings.emulatedFormFactor,
      analysisTime,
      networkInfo: environment?.networkUserAgent,
      cpu: environment?.benchmarkIndex,
    }
  };
}

export async function POST(request: Request) {
  console.log('PageSpeed API request received');
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
          set: (name, value, options) => {
            try {
              cookieStore.set({ name, value, ...options } as ResponseCookie);
            } catch (error) {
              console.error('Error setting cookie:', error);
            }
          },
          remove: (name, options) => {
            try {
              cookieStore.delete(name);
            } catch (error) {
              console.error('Error removing cookie:', error);
            }
          },
        },
      }
    );
    
    const { url } = await request.json();
    
    // Validate URL format
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid URL protocol');
      }
    } catch (error) {
      console.error('PageSpeed API error: Invalid URL format', { url });
      return NextResponse.json(
        { error: 'Invalid URL format. Please provide a valid http/https URL.' },
        { status: 400 }
      );
    }

    // Try to get API key from environment variable first
    let apiKey = process.env.PAGESPEED_API_KEY;
    console.log('PageSpeed API: Checking environment variable');

    // If not in env, try to get from database
    if (!apiKey) {
      console.log('PageSpeed API: Environment variable not found, checking database');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('PageSpeed API error: User not authenticated');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Get PageSpeed API key from settings for current user
      const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('pagespeed_api_key')
        .eq('user_id', user.id)
        .single();

      if (settingsError) {
        console.error('PageSpeed API error: Failed to fetch settings', settingsError);
        return NextResponse.json(
          { error: 'Failed to fetch PageSpeed API settings' },
          { status: 500 }
        );
      }

      apiKey = settings?.pagespeed_api_key;
    }

    if (!apiKey) {
      console.error('PageSpeed API error: API key not configured');
      return NextResponse.json(
        { error: 'PageSpeed API key not configured in environment or settings' },
        { status: 400 }
      );
    }

    console.log('PageSpeed API: Calling Google PageSpeed API', { url });
    // Check cache first
    const { data: cachedResult } = await supabase
      .from('pagespeed_cache')
      .select('*')
      .eq('url', url)
      .single();

    if (cachedResult && (Date.now() - new Date(cachedResult.analyzed_at).getTime() < CACHE_DURATION)) {
      console.log('Returning cached results for', url);
      return NextResponse.json({
        mobile: cachedResult.mobile_results,
        desktop: cachedResult.desktop_results,
        cached: true,
        analyzed_at: cachedResult.analyzed_at
      });
    }

    // Get mobile results
    console.log('Getting mobile results for', url);
    const mobileResults = await getPageSpeedResults(url, 'mobile', apiKey);

    // Wait for rate limit
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));

    // Get desktop results
    console.log('Getting desktop results for', url);
    const desktopResults = await getPageSpeedResults(url, 'desktop', apiKey);

    // Cache results
    const results = {
      mobile: mobileResults,
      desktop: desktopResults,
      cached: false,
      analyzed_at: new Date().toISOString()
    };

    await supabase
      .from('pagespeed_cache')
      .upsert({
        url,
        mobile_results: mobileResults,
        desktop_results: desktopResults,
        analyzed_at: results.analyzed_at
      }, {
        onConflict: 'url'
      });

    return NextResponse.json(results);
  } catch (error) {
    console.error('PageSpeed API error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to analyze page speed',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
