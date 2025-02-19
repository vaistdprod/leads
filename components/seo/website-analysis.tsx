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

          <TabsContent value="seo" className="space-y-4">
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

          <TabsContent value="accessibility" className="space-y-4">
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

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Accessibility Audits</h3>
              {results.performance.audits.accessibility.map((audit: any) => (
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

          <TabsContent value="best-practices" className="space-y-4">
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

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Best Practices Audits</h3>
              {results.performance.audits.bestPractices.map((audit: any) => (
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
        </Tabs>
      )}
    </div>
  );
}
