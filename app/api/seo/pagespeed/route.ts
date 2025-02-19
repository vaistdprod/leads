import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

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
    
    if (!url) {
      console.error('PageSpeed API error: URL is required');
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    console.log('PageSpeed API: Fetching user');

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('PageSpeed API error: User not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('PageSpeed API: Fetching settings');

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

    if (!settings?.pagespeed_api_key) {
      console.error('PageSpeed API error: API key not configured');
      return NextResponse.json(
        { error: 'PageSpeed API key not configured' },
        { status: 400 }
      );
    }

    console.log('PageSpeed API: Calling Google PageSpeed API');
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${settings.pagespeed_api_key}&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('PageSpeed API error: Google API request failed', data.error);
      throw new Error(data.error?.message || 'PageSpeed API request failed');
    }

    console.log('PageSpeed API: Successfully retrieved data');

    // Extract relevant metrics
    const {
      lighthouseResult: {
        categories,
        audits,
        configSettings,
        timing: { total: analysisTime },
      },
    } = data;

    // Format performance metrics
    const performanceMetrics = {
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
      },
      details: {
        deviceEmulation: configSettings.emulatedFormFactor,
        analysisTime: analysisTime,
      },
      audits: {
        performance: Object.entries(audits)
          .filter(([_, audit]: [string, any]) => audit.group === 'performance')
          .map(([id, audit]: [string, any]) => ({
            id,
            title: audit.title,
            description: audit.description,
            score: audit.score,
            displayValue: audit.displayValue,
            numericValue: audit.numericValue,
            warnings: audit.warnings,
          })),
        accessibility: Object.entries(audits)
          .filter(([_, audit]: [string, any]) => audit.group === 'accessibility')
          .map(([id, audit]: [string, any]) => ({
            id,
            title: audit.title,
            description: audit.description,
            score: audit.score,
            displayValue: audit.displayValue,
            warnings: audit.warnings,
          })),
        bestPractices: Object.entries(audits)
          .filter(([_, audit]: [string, any]) => audit.group === 'best-practices')
          .map(([id, audit]: [string, any]) => ({
            id,
            title: audit.title,
            description: audit.description,
            score: audit.score,
            displayValue: audit.displayValue,
            warnings: audit.warnings,
          })),
        seo: Object.entries(audits)
          .filter(([_, audit]: [string, any]) => audit.group === 'seo')
          .map(([id, audit]: [string, any]) => ({
            id,
            title: audit.title,
            description: audit.description,
            score: audit.score,
            displayValue: audit.displayValue,
            warnings: audit.warnings,
          })),
      },
    };

    return NextResponse.json(performanceMetrics);
  } catch (error) {
    console.error('PageSpeed API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to analyze page speed',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
