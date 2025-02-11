"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 left-4 z-50"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {children}
      </div>
    </div>
  );
}
