"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase/client';

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
      toast.success('Klíč Gemini API úspěšně uložen');
    } catch (error) {
      console.error('Failed to save Gemini API key:', error);
      toast.error('Nepodařilo se uložit klíč API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Nastavení Gemini API</h1>
        <p className="text-muted-foreground">
          Nakonfigurujte svůj klíč Gemini API pro obohacení potenciálních zákazníků pomocí AI
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="apiKey">Gemini API Klíč</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
            placeholder="Zadejte svůj Gemini API klíč"
          />
          <p className="text-sm text-muted-foreground">
            Nemáte API klíč?{' '}
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Získejte ho zde
            </a>
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/setup/google-auth')}
          >
            Zpět
          </Button>
          <Button
            type="submit"
            disabled={loading || !apiKey}
          >
            {loading ? 'Ukládání...' : 'Pokračovat'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
