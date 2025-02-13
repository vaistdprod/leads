"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isAuthenticated, setupCompleted } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/auth/login');
      } else if (setupCompleted === false) {
        router.replace('/setup/welcome');
      }
    }
  }, [isLoading, isAuthenticated, setupCompleted, router]);

  const currentTab = pathname.split('/').pop() || 'general';

  const handleTabChange = (value: string) => {
    router.push(`/settings/${value}`);
  };

  if (isLoading || !isAuthenticated || !setupCompleted) {
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
    <div className="container mx-auto py-8 px-4">
      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-8">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="general">Obecné</TabsTrigger>
          <TabsTrigger value="google">Google</TabsTrigger>
          <TabsTrigger value="ai">AI Nastavení</TabsTrigger>
        </TabsList>
        {children}
      </Tabs>
    </div>
  );
}