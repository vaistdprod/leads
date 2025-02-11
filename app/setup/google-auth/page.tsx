"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { getAuthUrl } from '@/lib/google/auth';
import { supabase } from '@/lib/supabase/client';

export default function GoogleAuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const authUrl = getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('google auth error:', error);
      toast.error('nepodařilo se spustit ověření google');
      setLoading(false);
    }
  };

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Propojte účet google</h1>
        <p className="text-muted-foreground">
          potřebujeme přístup k tabulkám google pro kontakty a gmail pro odesílání emailů
        </p>
      </div>

      <div className="space-y-6 mb-8">
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Požadovaná oprávnění:</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>přístup ke čtení tabulek google (pro kontakty a blacklist)</li>
            <li>odesílání emailů přes gmail</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/setup/welcome')}
        >
          zpět
        </Button>
        <Button
          onClick={handleGoogleAuth}
          disabled={loading}
        >
          {loading ? 'připojování...' : 'propojit účet google'}
        </Button>
      </div>
    </Card>
  );
}
