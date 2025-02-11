"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndSetup = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
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
        // Handle the error appropriately, maybe show a message to the user
        return;
      }

      if (!profile?.setup_completed) {
        router.push('/setup/welcome');
      } else {
        router.push('/dashboard');
      }
    };

    checkAuthAndSetup();
  }, [router]);

  return null; // Or a loading indicator
}
