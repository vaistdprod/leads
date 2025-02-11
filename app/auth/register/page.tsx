"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase, isDevelopment } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      toast.error('Vyplňte prosím všechna pole');
      return false;
    }

    if (password !== confirmPassword) {
      toast.error('Hesla se neshodují');
      return false;
    }

    if (password.length < 6) {
      toast.error('Heslo musí mít alespoň 6 znaků');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Zadejte prosím platnou emailovou adresu');
      return false;
    }

    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isDevelopment) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        localStorage.setItem('dev_auth', 'true');
        toast.success('Registrace proběhla úspěšně (vývojový režim)');
        router.push('/setup/welcome');
        return;
      }

      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('rate limit')) {
          toast.error('Příliš mnoho pokusů. Zkuste to prosím později');
        } else if (signUpError.message.includes('valid email')) {
          toast.error('Zadejte prosím platnou emailovou adresu');
        } else if (signUpError.message.includes('password')) {
          toast.error('Heslo musí mít alespoň 6 znaků');
        } else if (signUpError.message.includes('network')) {
          toast.error('Chyba sítě. Zkontrolujte prosím své připojení');
        } else {
          toast.error('Registrace selhala. Zkuste to prosím znovu');
        }
        return;
      }

      if (data?.user) {
        toast.success('Registrace proběhla úspěšně! Zkontrolujte prosím svůj email');
        router.push('/setup/welcome');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Došlo k neočekávané chybě. Zkuste to prosím později');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Vytvořit účet</h1>
          <p className="text-muted-foreground">Začněte s automatizací zpracování potenciálních zákazníků</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potvrďte heslo</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Vytváření účtu...' : 'Vytvořit účet'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => router.push('/auth/login')}
            disabled={loading}
          >
            Již máte účet? Přihlaste se
          </Button>
        </div>
      </Card>
    </div>
  );
}