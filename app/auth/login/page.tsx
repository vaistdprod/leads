"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Supabase session in login page:', session);

      if (session) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Test Supabase connection before attempting login
      try {
        const { error: pingError } = await supabase.auth.getSession();
        if (pingError) {
          throw new Error('Nelze se připojit ke službě ověřování');
        }
      } catch (pingError) {
        console.error('Connection test failed:', pingError);
        toast.error('Nelze se připojit ke službě ověřování. Zkuste to prosím později.');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          toast.error('Neplatný email nebo heslo');
        } else if (signInError.message.includes('rate limit')) {
          toast.error('Příliš mnoho pokusů. Zkuste to prosím později.');
        } else if (signInError.message.includes('network')) {
          toast.error('Chyba sítě. Zkontrolujte prosím své připojení a zkuste to znovu.');
        } else {
          toast.error('Nepodařilo se přihlásit. Zkuste to prosím znovu.');
        }
        return;
      }

      toast.success('Přihlášení proběhlo úspěšně');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Došlo k neočekávané chybě. Zkuste to prosím později.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Vítejte Zpět</h1>
          <p className="text-muted-foreground">Přihlaste se ke svému účtu</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Heslo</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full"
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Musí mít alespoň 6 znaků
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Přihlašování...' : 'Přihlásit se'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => router.push('/auth/register')}
            disabled={loading}
          >
            Nemáte účet? Zaregistrovat se
          </Button>
        </div>
      </Card>
    </div>
  );
}
