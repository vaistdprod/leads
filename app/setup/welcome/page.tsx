"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  const steps = [
    {
      title: "Connect Google Account",
      description: "Connect your Google account for access to Sheets and Gmail.",
    },
    {
      title: "Set up Gemini API",
      description: "Configure your Gemini API key for lead enrichment with AI.",
    },
    {
      title: "Configure Google Sheets",
      description: "Set up your blacklist and contacts sheets.",
    },
  ];

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to Initial Setup</h1>
        <p className="text-muted-foreground">
          Let's set up your automated lead processing system.
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-[hsl(var(--background))]">
              {index + 1}
            </div>
            <div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={() => router.push('/setup/google-auth')}
        >
          Get Started
        </Button>
      </div>
    </Card>
  );
}