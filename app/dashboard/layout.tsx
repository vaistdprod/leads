"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeToggle } from "@/components/ui/mode-toggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const currentTab = pathname.split('/').pop() || 'overview';

  const handleTabChange = (value: string) => {
    router.push(`/dashboard/${value}`);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-full max-w-md mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto py-4 px-4">
          <div className="flex justify-between items-center">
            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full max-w-md">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="overview" className="cursor-pointer">Přehled</TabsTrigger>
                <TabsTrigger value="analytics" className="cursor-pointer">Analytika</TabsTrigger>
                <TabsTrigger value="history" className="cursor-pointer">Historie</TabsTrigger>
              </TabsList>
            </Tabs>
            <ModeToggle />
          </div>
        </div>
      </div>
      <div className="container mx-auto py-8 px-4">
        {children}
      </div>
    </div>
  );
}
