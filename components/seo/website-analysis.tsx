"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function WebsiteAnalysis() {
  const [url, setUrl] = useState('https://tdprod.cz');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeWebsite = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/seo/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze website');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Website Analysis</h2>
        <p className="text-muted-foreground">
          Analyze your website's content and SEO elements
        </p>
      </div>

      <div className="flex gap-4">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter website URL"
          className="flex-1"
        />
        <Button onClick={analyzeWebsite} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Analyze
        </Button>
      </div>

      {error && (
        <Card className="p-4 bg-destructive/10 text-destructive">
          {error}
        </Card>
      )}

      {analysis && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="meta">
            <AccordionTrigger>Meta Information</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <p><strong>Title:</strong> {analysis.title}</p>
                <p><strong>Description:</strong> {analysis.description}</p>
                <p><strong>Keywords:</strong> {analysis.keywords}</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="headings">
            <AccordionTrigger>Headings Structure</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">H1 Headings</h4>
                  <ul className="list-disc pl-6">
                    {analysis.headings.h1.map((h: string, i: number) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">H2 Headings</h4>
                  <ul className="list-disc pl-6">
                    {analysis.headings.h2.map((h: string, i: number) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="links">
            <AccordionTrigger>Links Analysis</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <p><strong>Total Links:</strong> {analysis.links.length}</p>
                <ul className="list-disc pl-6">
                  {analysis.links.slice(0, 10).map((link: any, i: number) => (
                    <li key={i}>
                      <span className="font-medium">{link.text}</span> -{' '}
                      <span className="text-muted-foreground">{link.href}</span>
                    </li>
                  ))}
                </ul>
                {analysis.links.length > 10 && (
                  <p className="text-muted-foreground">
                    And {analysis.links.length - 10} more links...
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
