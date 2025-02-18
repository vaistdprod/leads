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

const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();
const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');

interface ContentMetrics {
  wordCount: number;
  sentenceCount: number;
  averageWordLength: number;
  readabilityScore: number;
  topKeywords: { word: string; score: number }[];
  sentiment: number;
}

function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  const syllableCount = word.match(/[aeiouy]{1,2}/g);
  return syllableCount ? syllableCount.length : 1;
}

function calculateReadability(text: string): number {
  const words = tokenizer.tokenize(text) || [];
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  
  if (words.length === 0 || sentences.length === 0) return 0;
  
  const syllables = words.reduce((count, word) => {
    return count + countSyllables(word);
  }, 0);
  
  // Flesch Reading Ease score
  const score = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
  return Math.min(Math.max(0, score), 100);
}

function extractTopKeywords(text: string, count: number = 10): { word: string; score: number }[] {
  tfidf.addDocument(text);
  const terms: { word: string; score: number }[] = [];
  
  tfidf.listTerms(0).forEach(item => {
    terms.push({ word: item.term, score: item.tfidf });
  });
  
  return terms
    .filter(term => term.word.length > 2)
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
    
    const words = tokenizer.tokenize(mainContent) || [];
    const sentences = mainContent.split(/[.!?]+/).filter(Boolean);
    
    const metrics: ContentMetrics = {
      wordCount: words.length,
      sentenceCount: sentences.length,
      averageWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length,
      readabilityScore: calculateReadability(mainContent),
      topKeywords: extractTopKeywords(mainContent),
      sentiment: analyzer.getSentiment(words),
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
