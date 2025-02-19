"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentGeneration } from "@/components/seo/content-generation";
import { SeoResearch } from "@/components/seo/seo-research";
import { WebsiteAnalysis } from "@/components/seo/website-analysis";

export default function SEOPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">SEO Tools</h2>
      </div>
      
      <Tabs defaultValue="generation" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="generation">Content Generation</TabsTrigger>
          <TabsTrigger value="research">Search Performance</TabsTrigger>
          <TabsTrigger value="website">Website Analysis</TabsTrigger>
        </TabsList>
        <TabsContent value="generation" className="space-y-4">
          <ContentGeneration />
        </TabsContent>
        <TabsContent value="research" className="space-y-4">
          <SeoResearch />
        </TabsContent>
        <TabsContent value="website" className="space-y-4">
          <WebsiteAnalysis />
        </TabsContent>
      </Tabs>
    </div>
  );
}
