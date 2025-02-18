"use client";

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ContentMetrics {
  wordCount: number;
  sentenceCount: number;
  averageWordLength: number;
  readabilityScore: number;
  topKeywords: { word: string; score: number }[];
  sentiment: number;
}

export function ContentAnalysis() {
  const [url, setUrl] = useState('https://tdprod.cz');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<ContentMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/seo/content-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.5) return 'Very Positive';
    if (score > 0) return 'Positive';
    if (score === 0) return 'Neutral';
    if (score > -0.5) return 'Negative';
    return 'Very Negative';
  };

  const getReadabilityLabel = (score: number) => {
    if (score >= 90) return 'Very Easy';
    if (score >= 80) return 'Easy';
    if (score >= 70) return 'Fairly Easy';
    if (score >= 60) return 'Standard';
    if (score >= 50) return 'Fairly Difficult';
    if (score >= 30) return 'Difficult';
    return 'Very Difficult';
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Content Analysis</h2>
        <p className="text-muted-foreground">
          Analyze your content's tone, style, and effectiveness
        </p>
      </div>
      
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex gap-4">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL to analyze"
              className="flex-1"
            />
            <Button onClick={analyzeContent} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-md">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {metrics && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-4 space-y-2">
                <h3 className="font-semibold">Content Overview</h3>
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Words</dt>
                    <dd className="font-medium">{metrics.wordCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Sentences</dt>
                    <dd className="font-medium">{metrics.sentenceCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Average Word Length</dt>
                    <dd className="font-medium">{metrics.averageWordLength.toFixed(1)} characters</dd>
                  </div>
                </dl>
              </Card>

              <Card className="p-4 space-y-2">
                <h3 className="font-semibold">Content Quality</h3>
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Readability</dt>
                    <dd className="font-medium">
                      {metrics.readabilityScore.toFixed(1)} - {getReadabilityLabel(metrics.readabilityScore)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Sentiment</dt>
                    <dd className="font-medium">{getSentimentLabel(metrics.sentiment)}</dd>
                  </div>
                </dl>
              </Card>

              <Card className="p-4 space-y-4 md:col-span-2">
                <h3 className="font-semibold">Top Keywords</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.topKeywords}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="word" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="score" fill="hsl(var(--chart-1))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
