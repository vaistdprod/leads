"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Check if setup is completed
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('setup_completed')
        .eq('id', session.user.id)
        .single();

      if (!profile?.setup_completed) {
        router.push('/setup/welcome');
      } else {
        router.push('/dashboard');
      }
    };

    checkAuth();
  }, [router]);

  return null;
}
