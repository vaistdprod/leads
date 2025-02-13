"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/lib/supabase/client';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
  }, [router]);

  const currentTab = pathname.split('/').pop() || 'general';

  const handleTabChange = (value: string) => {
    router.push(`/settings/${value}`);
  };


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
