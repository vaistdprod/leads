"use client";

import { WebsiteAnalysis } from "@/components/seo/website-analysis";

export default function SEOPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">SEO Tools</h2>
      </div>
      
      <div className="space-y-4">
        <WebsiteAnalysis />
      </div>
    </div>
  );
}
