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

    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract meta information
    const title = document.querySelector('title')?.textContent || '';
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';

    // Extract headings
    const headings = {
      h1: Array.from(document.querySelectorAll('h1')).map((el: Element) => el.textContent?.trim()).filter(Boolean),
      h2: Array.from(document.querySelectorAll('h2')).map((el: Element) => el.textContent?.trim()).filter(Boolean),
      h3: Array.from(document.querySelectorAll('h3')).map((el: Element) => el.textContent?.trim()).filter(Boolean),
    };

    // Extract main content
    const mainContent = document.querySelector('main, article, .content, #content')
      ?.textContent?.trim() || '';

    // Extract links
    const links = Array.from(document.querySelectorAll('a[href]')).map((el: Element) => ({
      text: el.textContent?.trim() || '',
      href: el.getAttribute('href') || '',
    }));

    return NextResponse.json(
      {
        title,
        description,
        keywords,
        headings,
        mainContent,
        links,
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
