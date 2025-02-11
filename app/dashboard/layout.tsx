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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkAuthAndSetup = async () => {
      try {
        if (isDevelopment) {
          if (!isDevAuthenticated()) {
            router.push('/auth/login');
            return;
          }
          setIsLoading(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
          router.push('/auth/login');
          return;
        }

        if (!session) {
          router.push('/auth/login');
          return;
        }

        // Check if setup is completed
        const { data: profile, setupError } = await supabase
          .from('user_profiles')
          .select('setup_completed')
          .eq('id', session.user.id)
          .single();

        if (setupError) {
          console.error("Error fetching user profile:", setupError);
          // Handle error - maybe show a message, but don't necessarily redirect
          return;
        }

        if (!profile?.setup_completed) {
          router.push('/setup/welcome');
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
      }
    };

    checkAuthAndSetup();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/auth/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const currentTab = pathname.split('/').pop() || 'overview';

  const handleTabChange = (value: string) => {
    router.push(`/dashboard/${value}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background animate-pulse" />
    );
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
            <span className="sr-only">Toggle theme</span>
          </Button>
        ) : null}
      </div>
      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-8">
        <TabsList className="container mx-auto px-4 grid grid-cols-3 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        {children}
      </Tabs>
    </div>
  );
}
