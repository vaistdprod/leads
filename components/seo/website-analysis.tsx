"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

interface WebsiteAnalysisProps {
  onAnalyze?: (results: any) => void;
}

export function WebsiteAnalysis({ onAnalyze }: WebsiteAnalysisProps) {
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!url) return;

    setAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      // Run both analyses in parallel
      const [analysisResponse, pagespeedResponse] = await Promise.all([
        fetch("/api/seo/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }),
        fetch("/api/seo/pagespeed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }),
      ]);

      const [analysisData, pagespeedData] = await Promise.all([
        analysisResponse.json(),
        pagespeedResponse.json(),
      ]);

      if (!analysisResponse.ok) {
        throw new Error(analysisData.error || "Failed to analyze website");
      }

      if (!pagespeedResponse.ok) {
        throw new Error(pagespeedData.error || "Failed to analyze page speed");
      }

      if (pagespeedData.error) {
        throw new Error(pagespeedData.error);
      }

      const combinedResults = {
        ...analysisData,
        performance: pagespeedData,
      };

      setResults(combinedResults);
      if (onAnalyze) {
        onAnalyze(combinedResults);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze website";
      console.error('Website analysis error:', {
        error: err,
        message: errorMessage,
        url,
      });
      setError(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  const formatScore = (score: number) => {
    return score.toFixed(0);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatTime = (time: number) => {
    return `${(time / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-4">
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleAnalyze();
        }} 
        className="flex gap-4"
      >
        <Input
          type="url"
          placeholder="Enter website URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={analyzing || !url}>
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze"
          )}
        </Button>
      </form>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {results && (
        <Tabs defaultValue="performance">
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
            <TabsTrigger value="best-practices">Best Practices</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <h3 className="font-medium mb-2">Performance Score</h3>
                <div className="relative pt-1">
                  <Progress 
                    value={results.performance.scores.performance} 
                    className={getScoreColor(results.performance.scores.performance)}
                  />
                  <p className="text-2xl font-bold mt-2">
                    {formatScore(results.performance.scores.performance)}
                  </p>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-2">First Contentful Paint</h3>
                <p className="text-2xl font-bold">
                  {formatTime(results.performance.metrics.firstContentfulPaint)}
                </p>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-2">Largest Contentful Paint</h3>
                <p className="text-2xl font-bold">
                  {formatTime(results.performance.metrics.largestContentfulPaint)}
                </p>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-2">Time to Interactive</h3>
                <p className="text-2xl font-bold">
                  {formatTime(results.performance.metrics.timeToInteractive)}
                </p>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-2">Total Blocking Time</h3>
                <p className="text-2xl font-bold">
                  {formatTime(results.performance.metrics.totalBlockingTime)}
                </p>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-2">Server Response Time</h3>
                <p className="text-2xl font-bold">
                  {formatTime(results.performance.metrics.serverResponseTime)}
                </p>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-2">Main Thread Work</h3>
                <p className="text-2xl font-bold">
                  {formatTime(results.performance.metrics.mainThreadWork)}
                </p>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-2">JavaScript Bootup Time</h3>
                <p className="text-2xl font-bold">
                  {formatTime(results.performance.metrics.bootupTime)}
                </p>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-2">Cumulative Layout Shift</h3>
                <p className="text-2xl font-bold">
                  {results.performance.metrics.cumulativeLayoutShift.toFixed(3)}
                </p>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Environment Details</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Device Emulation</h4>
                  <p className="text-muted-foreground">{results.performance.details.deviceEmulation}</p>
                </div>
                <div>
                  <h4 className="font-medium">Network Info</h4>
                  <p className="text-muted-foreground">{results.performance.details.networkInfo}</p>
                </div>
                <div>
                  <h4 className="font-medium">CPU/Memory Power</h4>
                  <p className="text-muted-foreground">Benchmark Index: {results.performance.details.cpu}</p>
                </div>
                {results.performance.details.stackPacks?.map((pack: any) => (
                  <div key={pack.name}>
                    <h4 className="font-medium">{pack.name} Recommendations</h4>
                    <ul className="list-disc pl-5 mt-2 space-y-2">
                      {Object.entries(pack.descriptions).map(([id, desc]: [string, any]) => (
                        <li key={id} className="text-muted-foreground">{desc}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Performance Audits</h3>
              <div className="grid gap-4">
                {results.performance.audits.performance.map((audit: any) => (
                  <Card key={audit.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-medium">{audit.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {audit.description}
                        </p>
                        {audit.displayValue && (
                          <p className="text-sm font-medium">
                            {audit.displayValue}
                          </p>
                        )}
                        {audit.explanation && (
                          <p className="text-sm text-muted-foreground">
                            {audit.explanation}
                          </p>
                        )}
                        {audit.warnings?.length > 0 && (
                          <div className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 p-3 rounded-md">
                            <ul className="list-disc pl-5 space-y-1">
                              {audit.warnings.map((warning: string, i: number) => (
                                <li key={i} className="text-sm">{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {audit.errorMessage && (
                          <div className="bg-destructive/10 text-destructive p-3 rounded-md">
                            <p className="text-sm">{audit.errorMessage}</p>
                          </div>
                        )}
                      </div>
                      {audit.score !== null && (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${getScoreColor(audit.score * 100)}`}>
                          {formatScore(audit.score * 100)}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <h3 className="font-medium mb-2">SEO Score</h3>
                <div className="relative pt-1">
                  <Progress 
                    value={results.performance.scores.seo} 
                    className={getScoreColor(results.performance.scores.seo)}
                  />
                  <p className="text-2xl font-bold mt-2">
                    {formatScore(results.performance.scores.seo)}
                  </p>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-2">Word Count</h3>
                <p className="text-2xl font-bold">{results.stats.wordCount}</p>
                <p className="text-sm text-muted-foreground mt-1">Total words on page</p>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-2">Links</h3>
                <p className="text-2xl font-bold">{results.stats.linkCount}</p>
                <p className="text-sm text-muted-foreground mt-1">Total links found</p>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-2">Images</h3>
                <p className="text-2xl font-bold">{results.stats.imageCount}</p>
                <p className="text-sm text-muted-foreground mt-1">Total images found</p>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Meta Information</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Title</h4>
                  <p className="text-muted-foreground">{results.title || 'Not found'}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Length: {(results.title || '').length} characters 
                    {(results.title || '').length > 60 ? ' (Consider shortening)' : ''}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Meta Description</h4>
                  <p className="text-muted-foreground">{results.description || 'Not found'}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Length: {(results.description || '').length} characters
                    {(results.description || '').length > 160 ? ' (Consider shortening)' : ''}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Keywords</h4>
                  <p className="text-muted-foreground">{results.keywords || 'Not found'}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Heading Structure</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    H1 Headings
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      results.stats.headingCount.h1 === 1 ? 'bg-green-500/10 text-green-700' : 'bg-yellow-500/10 text-yellow-700'
                    }`}>
                      {results.stats.headingCount.h1}
                    </span>
                  </h4>
                  <div className="mt-2 space-y-2">
                    {results.headings.h1.map((heading: string, index: number) => (
                      <p key={index} className="text-muted-foreground">{heading}</p>
                    ))}
                  </div>
                  {results.stats.headingCount.h1 !== 1 && (
                    <p className="text-sm text-yellow-600 mt-2">
                      Best practice: Use exactly one H1 heading per page
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium">H2 Headings ({results.stats.headingCount.h2})</h4>
                  <div className="mt-2 space-y-2">
                    {results.headings.h2.map((heading: string, index: number) => (
                      <p key={index} className="text-muted-foreground">{heading}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">H3 Headings ({results.stats.headingCount.h3})</h4>
                  <div className="mt-2 space-y-2">
                    {results.headings.h3.map((heading: string, index: number) => (
                      <p key={index} className="text-muted-foreground">{heading}</p>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Social Media Tags</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Open Graph Tags</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(results.socialTags.og).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <p className="font-medium text-sm">{key}</p>
                        <p className="text-muted-foreground text-sm">{value as string}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Twitter Cards</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(results.socialTags.twitter).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <p className="font-medium text-sm">{key}</p>
                        <p className="text-muted-foreground text-sm">{value as string}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Images Analysis</h3>
              <div className="space-y-4">
                {results.images.map((image: any, index: number) => (
                  <div key={index} className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium break-all">{image.src}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Alt text: {image.alt || <span className="text-yellow-600">Missing alt text</span>}
                      </p>
                      {(image.width && image.height) ? (
                        <p className="text-sm text-muted-foreground">
                          Dimensions: {image.width}x{image.height}
                        </p>
                      ) : (
                        <p className="text-sm text-yellow-600">
                          Missing width/height attributes
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">SEO Audits</h3>
              {results.performance.audits.seo.map((audit: any) => (
                <Card key={audit.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{audit.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {audit.description}
                      </p>
                    </div>
                    {audit.score !== null && (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${getScoreColor(audit.score * 100)}`}>
                        {formatScore(audit.score * 100)}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="accessibility" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <h3 className="font-medium mb-2">Accessibility Score</h3>
                <div className="relative pt-1">
                  <Progress 
                    value={results.performance.scores.accessibility} 
                    className={getScoreColor(results.performance.scores.accessibility)}
                  />
                  <p className="text-2xl font-bold mt-2">
                    {formatScore(results.performance.scores.accessibility)}
                  </p>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-2">Images with Alt Text</h3>
                <p className="text-2xl font-bold">
                  {results.images.filter((img: any) => img.alt).length}/{results.images.length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Images with descriptive text</p>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-2">ARIA Labels</h3>
                <p className="text-2xl font-bold">
                  {results.performance.audits.accessibility.filter((a: any) => 
                    a.id.includes('aria') && a.score === 1
                  ).length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Valid ARIA attributes</p>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-2">Color Contrast</h3>
                <p className="text-2xl font-bold">
                  {results.performance.audits.accessibility.find((a: any) => 
                    a.id === 'color-contrast'
                  )?.score === 1 ? 'Pass' : 'Fail'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Text visibility</p>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Critical Issues</h3>
              <div className="space-y-4">
                {results.performance.audits.accessibility
                  .filter((audit: any) => audit.score === 0)
                  .map((audit: any) => (
                    <div key={audit.id} className="p-4 bg-red-500/10 rounded-lg">
                      <h4 className="font-medium text-red-700 dark:text-red-400">{audit.title}</h4>
                      <p className="text-sm mt-1">{audit.description}</p>
                      {audit.details?.items?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Affected Elements:</p>
                          <ul className="list-disc pl-5 mt-1">
                            {audit.details.items.map((item: any, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground">
                                {item.node?.snippet || item.element || 'Unknown element'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Warnings</h3>
              <div className="space-y-4">
                {results.performance.audits.accessibility
                  .filter((audit: any) => audit.score !== null && audit.score < 1 && audit.score > 0)
                  .map((audit: any) => (
                    <div key={audit.id} className="p-4 bg-yellow-500/10 rounded-lg">
                      <h4 className="font-medium text-yellow-700 dark:text-yellow-400">{audit.title}</h4>
                      <p className="text-sm mt-1">{audit.description}</p>
                      {audit.details?.items?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Affected Elements:</p>
                          <ul className="list-disc pl-5 mt-1">
                            {audit.details.items.map((item: any, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground">
                                {item.node?.snippet || item.element || 'Unknown element'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Passed Checks</h3>
              <div className="grid gap-4">
                {results.performance.audits.accessibility
                  .filter((audit: any) => audit.score === 1)
                  .map((audit: any) => (
                    <div key={audit.id} className="p-4 bg-green-500/10 rounded-lg">
                      <h4 className="font-medium text-green-700 dark:text-green-400">{audit.title}</h4>
                      <p className="text-sm mt-1">{audit.description}</p>
                    </div>
                  ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Recommendations</h3>
              <div className="space-y-4">
                {results.performance.audits.accessibility
                  .filter((audit: any) => audit.score !== 1)
                  .map((audit: any) => (
                    <div key={audit.id} className="space-y-2">
                      <h4 className="font-medium">{audit.title}</h4>
                      <p className="text-sm text-muted-foreground">{audit.description}</p>
                      {audit.details?.items?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">How to fix:</p>
                          <ul className="list-disc pl-5 mt-1">
                            {audit.details.items.map((item: any, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground">
                                {item.node?.explanation || item.explanation || 'No specific guidance available'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="best-practices" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <h3 className="font-medium mb-2">Best Practices Score</h3>
                <div className="relative pt-1">
                  <Progress 
                    value={results.performance.scores.bestPractices} 
                    className={getScoreColor(results.performance.scores.bestPractices)}
                  />
                  <p className="text-2xl font-bold mt-2">
                    {formatScore(results.performance.scores.bestPractices)}
                  </p>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-2">Security Issues</h3>
                <p className="text-2xl font-bold">
                  {results.performance.audits.bestPractices.filter((a: any) => 
                    a.id.includes('security') && a.score !== 1
                  ).length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Security vulnerabilities found</p>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-2">Browser Compatibility</h3>
                <p className="text-2xl font-bold">
                  {results.performance.audits.bestPractices.filter((a: any) => 
                    a.id.includes('browser-compat') && a.score === 1
                  ).length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Cross-browser compatibility</p>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-2">Modern Web Standards</h3>
                <p className="text-2xl font-bold">
                  {results.performance.audits.bestPractices.filter((a: any) => 
                    a.id.includes('doctype') || a.id.includes('charset') || a.id.includes('viewport')
                  ).every((a: any) => a.score === 1) ? 'Pass' : 'Fail'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Basic web standards</p>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Security Findings</h3>
              <div className="space-y-4">
                {results.performance.audits.bestPractices
                  .filter((audit: any) => audit.id.includes('security'))
                  .map((audit: any) => (
                    <div key={audit.id} className={`p-4 rounded-lg ${
                      audit.score === 1 ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className={`font-medium ${
                            audit.score === 1 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                          }`}>{audit.title}</h4>
                          <p className="text-sm mt-1">{audit.description}</p>
                          {audit.details?.items?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium">Details:</p>
                              <ul className="list-disc pl-5 mt-1">
                                {audit.details.items.map((item: any, index: number) => (
                                  <li key={index} className="text-sm text-muted-foreground">
                                    {item.description || item.url || 'No details available'}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        {audit.score !== null && (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${getScoreColor(audit.score * 100)}`}>
                            {formatScore(audit.score * 100)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Browser Compatibility</h3>
              <div className="space-y-4">
                {results.performance.audits.bestPractices
                  .filter((audit: any) => audit.id.includes('browser-compat') || audit.id.includes('doctype') || audit.id.includes('charset'))
                  .map((audit: any) => (
                    <div key={audit.id} className={`p-4 rounded-lg ${
                      audit.score === 1 ? 'bg-green-500/10' : 'bg-yellow-500/10'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className={`font-medium ${
                            audit.score === 1 ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'
                          }`}>{audit.title}</h4>
                          <p className="text-sm mt-1">{audit.description}</p>
                        </div>
                        {audit.score !== null && (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${getScoreColor(audit.score * 100)}`}>
                            {formatScore(audit.score * 100)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Performance Best Practices</h3>
              <div className="space-y-4">
                {results.performance.audits.bestPractices
                  .filter((audit: any) => !audit.id.includes('security') && !audit.id.includes('browser-compat'))
                  .map((audit: any) => (
                    <div key={audit.id} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h4 className="font-medium">{audit.title}</h4>
                          <p className="text-sm text-muted-foreground">{audit.description}</p>
                          {audit.details?.items?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium">Recommendations:</p>
                              <ul className="list-disc pl-5 mt-1">
                                {audit.details.items.map((item: any, index: number) => (
                                  <li key={index} className="text-sm text-muted-foreground">
                                    {item.description || item.url || 'No specific recommendation'}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        {audit.score !== null && (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${getScoreColor(audit.score * 100)}`}>
                            {formatScore(audit.score * 100)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
