"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { ProcessingIndicator } from "@/components/ui/processing-indicator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
  }, [router]);

  const currentTab = pathname.split('/').pop() || 'overview';

  const handleTabChange = (value: string) => {
    router.push(`/dashboard/${value}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto py-4 px-4">
          <div className="flex justify-between items-center">
            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full max-w-md">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="overview" className="cursor-pointer">Overview</TabsTrigger>
                <TabsTrigger value="analytics" className="cursor-pointer">Analytics</TabsTrigger>
                <TabsTrigger value="history" className="cursor-pointer">History</TabsTrigger>
                <TabsTrigger value="seo" className="cursor-pointer">SEO</TabsTrigger>
              </TabsList>
            </Tabs>
            <ModeToggle />
          </div>
        </div>
      </div>
      <div className="container mx-auto py-8 px-4">
        {children}
      </div>
      <ProcessingIndicator />
    </div>
  );
}
