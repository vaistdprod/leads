"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase, isDevelopment, isDevAuthenticated } from '@/lib/supabase/client';
import { useTheme } from 'next-themes';
import { MoonIcon, SunIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isDevelopment) {
          if (!isDevAuthenticated()) {
            router.push('/auth/login');
            return;
          }
          setIsLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/login');
          return;
        }
        setIsLoading(false);
      } catch (error) {
        console.error('ověření auth selhalo:', error);
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  const currentTab = pathname.split('/').pop() || 'overview';

  const handleTabChange = (value: string) => {
    router.push(`/dashboard/${value}`);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background animate-pulse" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex justify-end p-4">
        {mounted ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">přepnout motiv</span>
          </Button>
        ) : null}
      </div>
      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-8">
        <TabsList className="container mx-auto px-4 grid grid-cols-3 w-full">
          <TabsTrigger value="overview">přehled</TabsTrigger>
          <TabsTrigger value="history">historie</TabsTrigger>
          <TabsTrigger value="analytics">analýzy</TabsTrigger>
        </TabsList>
        {children}
      </Tabs>
    </div>
  );
}