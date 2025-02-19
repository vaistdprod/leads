import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import natural from 'natural';

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

// Custom tokenizer that preserves Czech characters
function customTokenize(text: string): string[] {
  // This regex matches words including Czech characters
  return text.match(/[\p{L}\p{N}]+/gu) || [];
}

const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

// Custom word processing that preserves Czech characters
function processWord(word: string): string {
  return word.toLowerCase();
}

interface ContentMetrics {
  wordCount: number;
  sentenceCount: number;
  averageWordLength: number;
  readabilityScore: number;
  topKeywords: { word: string; score: number }[];
  sentiment: number;
}

// Simplified syllable counting for Czech words
function countSyllables(word: string): number {
  // Czech syllables are typically marked by vowels (including long vowels)
  const vowels = word.match(/[aáeéěiíoóuúůyý]/gi);
  return vowels ? vowels.length : 1;
}

function calculateReadability(text: string): number {
  const words = customTokenize(text);
  // Split on sentence endings, including Czech quotation marks
  const sentences = text.split(/[.!?„"]+/).filter(Boolean);
  
  if (words.length === 0 || sentences.length === 0) return 0;
  
  const syllables = words.reduce((count, word) => {
    return count + countSyllables(word);
  }, 0);
  
  // Modified readability score for Czech text
  const score = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
  return Math.min(Math.max(0, score), 100);
}

function extractTopKeywords(text: string, count: number = 10): { word: string; score: number }[] {
  const words = customTokenize(text).map(processWord);
  const wordFreq: { [key: string]: number } = {};
  
  // Count word frequencies
  words.forEach(word => {
    if (word.length > 2) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  // Convert to array and sort by frequency
  return Object.entries(wordFreq)
    .map(([word, freq]) => ({
      word,
      score: freq / words.length // Normalize by text length
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
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
    const $ = cheerio.load(html);
    
    // Remove script tags, style tags, and HTML comments
    $('script, style, comment').remove();
    
    // Extract main content
    const mainContent = $('main, article, .content, #content')
      .first()
      .text()
      .trim()
      .replace(/\s+/g, ' ');
    
    const words = customTokenize(mainContent);
    const sentences = mainContent.split(/[.!?„"]+/).filter(Boolean);
    
    const metrics: ContentMetrics = {
      wordCount: words.length,
      sentenceCount: sentences.length,
      averageWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length,
      readabilityScore: calculateReadability(mainContent),
      topKeywords: extractTopKeywords(mainContent),
      sentiment: 0, // Sentiment analysis disabled for Czech text
    };

    return NextResponse.json(
      metrics,
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Content analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content' },
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
