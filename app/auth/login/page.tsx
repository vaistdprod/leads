"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase, isDevelopment, setDevAuth, simulateDelay, isDevAuthenticated } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (isDevelopment && isDevAuthenticated()) {
          router.push('/dashboard');
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setInitialized(true);
      }
    };

    checkSession();
  }, [router]);

  const validateForm = () => {
    if (!email || !password) {
      toast.error('Vyplňte prosím všechna pole');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Zadejte prosím platnou emailovou adresu');
      return false;
    }

    if (password.length < 6) {
      toast.error('Heslo musí mít alespoň 6 znaků');
      return false;
    }

    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isDevelopment) {
        await simulateDelay(500);
        const mockSession = await setDevAuth();
        if (mockSession) {
          toast.success('Přihlášení proběhlo úspěšně (vývojový režim)');
          await simulateDelay(300);
          router.push('/dashboard');
        } else {
          toast.error('Nepodařilo se nastavit vývojový režim');
        }
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          toast.error('Neplatný email nebo heslo');
        } else if (signInError.message.includes('rate limit')) {
          toast.error('Příliš mnoho pokusů. Zkuste to prosím později');
        } else if (signInError.message.includes('network')) {
          toast.error('Chyba sítě. Zkontrolujte prosím své připojení');
        } else {
          toast.error('Nepodařilo se přihlásit. Zkuste to prosím znovu');
        }
        return;
      }

      if (data.session) {
        toast.success('Přihlášení proběhlo úspěšně');
        await simulateDelay(300);
        router.push('/dashboard');
      } else {
        toast.error('Nepodařilo se získat session. Zkuste to prosím znovu');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Došlo k neočekávané chybě. Zkuste to prosím později');
    } finally {
      setLoading(false);
    }
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <p className="text-muted-foreground">Načítání...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Vítejte zpět</h1>
          <p className="text-muted-foreground">Přihlaste se ke svému účtu</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="vas@email.cz"
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
            Nemáte účet? Zaregistrujte se
          </Button>
        </div>
      </Card>
    </div>
  );
}