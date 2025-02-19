import { NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';

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
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    // Fetch with proper encoding
    const response = await fetch(url);
    const contentType = response.headers.get('content-type') || '';
    const charset = contentType.includes('charset=') 
      ? contentType.split('charset=')[1] 
      : 'utf-8';

    const html = await response.text();
    const dom = new JSDOM(html, {
      url: url,
      contentType: `text/html; charset=${charset}`,
      pretendToBeVisual: true,
      runScripts: 'outside-only'
    });

    const document = dom.window.document;

    // Helper to clean text
    const cleanText = (text: string | null | undefined) => {
      if (!text) return '';
      return text.replace(/\s+/g, ' ').trim();
    };

    // Extract meta information
    const title = cleanText(document.querySelector('title')?.textContent);
    const description = cleanText(document.querySelector('meta[name="description"]')?.getAttribute('content'));
    const keywords = cleanText(document.querySelector('meta[name="keywords"]')?.getAttribute('content'));

    // Extract headings with proper text cleaning
    const headings = {
      h1: Array.from(document.querySelectorAll('h1')).map(el => cleanText(el.textContent)).filter(Boolean),
      h2: Array.from(document.querySelectorAll('h2')).map(el => cleanText(el.textContent)).filter(Boolean),
      h3: Array.from(document.querySelectorAll('h3')).map(el => cleanText(el.textContent)).filter(Boolean),
    };

    // Extract main content with encoding preservation
    const mainContent = cleanText(document.querySelector('main, article, .content, #content')?.textContent);

    // Extract links with proper text cleaning
    const links = Array.from(document.querySelectorAll('a[href]')).map(el => ({
      text: cleanText(el.textContent),
      href: el.getAttribute('href') || '',
    }));

    // Extract images with alt text
    const images = Array.from(document.querySelectorAll('img')).map(el => ({
      src: el.getAttribute('src') || '',
      alt: cleanText(el.getAttribute('alt')),
      width: el.getAttribute('width'),
      height: el.getAttribute('height'),
    }));

    // Extract structured data
    const structuredData = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map(el => {
        try {
          return JSON.parse(el.textContent || '');
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Extract meta tags
    const metaTags = Array.from(document.querySelectorAll('meta')).map(el => ({
      name: el.getAttribute('name'),
      property: el.getAttribute('property'),
      content: cleanText(el.getAttribute('content')),
    }));

    // Extract social media meta tags
    const socialTags = {
      og: Object.fromEntries(
        Array.from(document.querySelectorAll('meta[property^="og:"]')).map(el => [
          el.getAttribute('property')?.replace('og:', ''),
          cleanText(el.getAttribute('content'))
        ])
      ),
      twitter: Object.fromEntries(
        Array.from(document.querySelectorAll('meta[name^="twitter:"]')).map(el => [
          el.getAttribute('name')?.replace('twitter:', ''),
          cleanText(el.getAttribute('content'))
        ])
      ),
    };

    // Extract text content statistics
    const textContent = cleanText(document.body.textContent);
    const wordCount = textContent.split(/\s+/).length;
    const paragraphCount = document.querySelectorAll('p').length;

    return NextResponse.json(
      {
        url,
        title,
        description,
        keywords,
        headings,
        mainContent,
        links,
        images,
        structuredData,
        metaTags,
        socialTags,
        stats: {
          wordCount,
          paragraphCount,
          headingCount: {
            h1: headings.h1.length,
            h2: headings.h2.length,
            h3: headings.h3.length,
          },
          linkCount: links.length,
          imageCount: images.length,
        },
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Error analyzing website:', error);
    return NextResponse.json(
      { error: 'Failed to analyze website' },
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
