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

      if (!analysisResponse.ok || !pagespeedResponse.ok) {
        throw new Error("Failed to analyze website");
      }

      const [analysisData, pagespeedData] = await Promise.all([
        analysisResponse.json(),
        pagespeedResponse.json(),
      ]);

      const combinedResults = {
        ...analysisData,
        performance: pagespeedData,
      };

      setResults(combinedResults);
      if (onAnalyze) {
        onAnalyze(combinedResults);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze website");
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
      <div className="flex gap-4">
        <Input
          type="url"
          placeholder="Enter website URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleAnalyze} disabled={analyzing || !url}>
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze"
          )}
        </Button>
      </div>

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
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Performance Audits</h3>
              {results.performance.audits.performance.map((audit: any) => (
                <Card key={audit.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{audit.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {audit.description}
                      </p>
                      {audit.displayValue && (
                        <p className="text-sm font-medium mt-2">
                          {audit.displayValue}
                        </p>
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
