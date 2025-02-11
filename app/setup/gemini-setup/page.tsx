"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase/client';
import BackButton from '@/components/ui/back-button';

export default function GeminiSetupPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('settings')
        .update({ gemini_api_key: apiKey })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      router.push('/setup/sheet-setup');
      toast.success('Gemini API Key saved successfully');
    } catch (error) {
      console.error('Failed to save Gemini API key:', error);
      toast.error('Failed to save API key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8">
      <div className="flex justify-between items-start">
        <BackButton />
        <h1 className="text-3xl font-bold mb-2">Gemini API Setup</h1>
        <div></div> {/* Empty div for spacing */}
      </div>
      <p className="text-muted-foreground">
        Configure your Gemini API key for AI-powered lead enrichment.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="apiKey">Gemini API Key</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
            placeholder="Enter your Gemini API key"
          />
          <p className="text-sm text-muted-foreground">
            Don't have an API key?{' '}
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Get it here
            </a>
          </p>
        </div>

        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={loading || !apiKey}
          >
            {loading ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
