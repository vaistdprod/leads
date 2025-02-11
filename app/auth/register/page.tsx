"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      if (password !== confirmPassword) {
        toast.error('Hesla se neshodují');
        return;
      }

      if (password.length < 6) {
        toast.error('Heslo musí mít alespoň 6 znaků');
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
          toast.error('Příliš mnoho pokusů. Zkuste to prosím později.');
        } else if (signUpError.message.includes('valid email')) {
          toast.error('Zadejte prosím platnou emailovou adresu');
        } else if (signUpError.message.includes('password')) {
          toast.error('Heslo musí mít alespoň 6 znaků');
        } else if (signUpError.message.includes('network')) {
          toast.error('Chyba sítě. Zkontrolujte prosím své připojení a zkuste to znovu.');
        } else {
          toast.error(signUpError.message || 'Registrace selhala. Zkuste to prosím znovu.');
        }
        return;
      }

      if (data?.user) {
        toast.success('Registrace proběhla úspěšně! Zkontrolujte prosím svůj email pro ověření účtu.');
        router.push('/setup/welcome');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Došlo k neočekávané chybě. Zkuste to prosím později.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Vytvořit Účet</h1>
          <p className="text-muted-foreground">Začněte s automatizací zpracování potenciálních zákazníků</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potvrďte Heslo</Label>
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
            {loading ? 'Vytváření účtu...' : 'Vytvořit Účet'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => router.push('/auth/login')}
            disabled={loading}
          >
            Již máte účet? Přihlásit se
          </Button>
        </div>
      </Card>
    </div>
  );
}
