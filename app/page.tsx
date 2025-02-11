"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { isDevelopment } from '@/lib/env';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndSetup = async () => {
      try {
        if (isDevelopment) {
          const devAuth = localStorage.getItem('dev_auth');
          if (!devAuth || devAuth !== 'true') {
            router.replace('/auth/login');
            return;
          }
          router.replace('/dashboard');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.replace('/auth/login');
          return;
        }

        // Check if setup is completed
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('setup_completed')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          router.replace('/auth/login');
          return;
        }

        if (!profile?.setup_completed) {
          router.replace('/setup/welcome');
        } else {
          router.replace('/dashboard');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.replace('/auth/login');
      }
    };

    checkAuthAndSetup();
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}