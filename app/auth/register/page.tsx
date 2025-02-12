import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase/client';
import { isDevelopment } from '@/lib/env';
import { Logo } from '@/components/ui/logo';

const passwordRequirements = [
  { label: 'Alespoň jedno malé písmeno (a-z)', regex: /[a-z]/ },
  { label: 'Alespoň jedno velké písmeno (A-Z)', regex: /[A-Z]/ },
  { label: 'Alespoň jedno číslo (0-9)', regex: /[0-9]/ },
  { label: 'Alespoň jeden speciální znak (!@#$%^&*()_+-=[]{};\':"|<>?,./`~)', regex: /[!@#$%^&*()_+\-=\[\]{};\\':"\\|,.<>?/`~]/ },
  { label: 'Minimálně 8 znaků', regex: /.{8,}/ }
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const token = searchParams.get('signup_token');
        const emailParam = searchParams.get('email');
        
        if (!token || !emailParam) {
          console.error('Missing token or email');
          toast.error('Invalid registration link');
          router.replace('/auth/login');
          return;
        }

        // First check if we're in development mode
        if (isDevelopment) {
          setIsValidToken(true);
          setEmail(emailParam);
          setLoading(false);
          return;
        }

        // Validate token with API
        const response = await fetch(`/api/validate-token?token=${encodeURIComponent(token)}&email=${encodeURIComponent(emailParam)}`);
        const data = await response.json();

        if (!response.ok) {
          console.error('Token validation failed:', data);
          toast.error(data.error || 'Invalid registration link');
          router.replace('/auth/login');
          return;
        }

        if (!data.valid) {
          console.error('Invalid token:', data);
          toast.error('Invalid registration link');
          router.replace('/auth/login');
          return;
        }

        setIsValidToken(true);
        setEmail(emailParam);
      } catch (error) {
        console.error('Token validation failed:', error);
        toast.error('Failed to validate registration link');
        router.replace('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [router, searchParams]);

  const validatePassword = (password: string) => {
    return passwordRequirements.every(req => req.regex.test(password));
  };

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      toast.error('Vyplňte prosím všechna pole');
      return false;
    }

    if (password !== confirmPassword) {
      toast.error('Hesla se neshodují');
      return false;
    }

    if (!validatePassword(password)) {
      toast.error('Heslo nesplňuje všechny požadavky');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Zadejte prosím platnou emailovou adresu');
      return false;
    }

    return true;
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const token = searchParams.get('signup_token');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${window.location.origin}/auth/callback?signup_token=${token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error('Přihlášení přes Google selhalo');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const token = searchParams.get('signup_token');

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?signup_token=${token}`,
        },
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        
        if (signUpError.message.includes('weak_password')) {
          toast.error('Heslo je příliš slabé. Dodržujte prosím všechny požadavky');
        } else if (signUpError.message.includes('email')) {
          toast.error('Zadejte prosím platnou emailovou adresu');
        } else if (signUpError.message.includes('rate limit')) {
          toast.error('Příliš mnoho pokusů. Zkuste to prosím později');
        } else {
          toast.error('Registrace selhala: ' + signUpError.message);
        }
        return;
      }

      if (data?.user) {
        // Mark signup token as used
        const { error: tokenError } = await supabase
          .from('signup_tokens')
          .update({ 
            used: true, 
            used_by: data.user.id, 
            used_at: new Date().toISOString() 
          })
          .eq('token', token);

        if (tokenError) {
          console.error("Error updating token:", tokenError);
          toast.error("Nepodařilo se aktualizovat stav registrace");
          return;
        }

        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([{ 
            id: data.user.id, 
            setup_completed: false 
          }]);

        if (profileError) {
          console.error("Error creating user profile:", profileError);
          toast.error("Nepodařilo se vytvořit uživatelský profil");
          return;
        }

        toast.success('Registrace úspěšná! Zkontrolujte prosím svůj email');
        router.push('/setup/welcome');
      } else {
        toast.error('Nebyla přijata žádná data o uživateli');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Došlo k neočekávané chybě');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <RegisterLoading />;
  }

  if (!isValidToken) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <Logo className="mb-4" size={60} />
          <h1 className="text-2xl font-bold">Vytvořit účet</h1>
          <p className="text-muted-foreground">Připojte se k naší platformě</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={true}
              className="w-full"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Nebo pokračujte pomocí
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full"
          >
            {googleLoading ? 'Připojování...' : 'Přihlásit se přes Google'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Nebo vytvořte heslo
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Heslo</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
              disabled={loading || googleLoading}
            />
            <div className="text-sm space-y-1">
              <p className="font-medium text-muted-foreground">Požadavky na heslo:</p>
              <ul className="list-none space-y-1">
                {passwordRequirements.map((req, index) => (
                  <li
                    key={index}
                    className={`flex items-center space-x-2 ${
                      req.regex.test(password) ? 'text-green-600' : 'text-muted-foreground'
                    }`}
                  >
                    <span className="text-xs">
                      {req.regex.test(password) ? '✓' : '○'}
                    </span>
                    <span className="text-xs">{req.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potvrdit heslo</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full"
              disabled={loading || googleLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || googleLoading}
          >
            {loading ? 'Vytváření účtu...' : 'Vytvořit účet'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => router.push('/auth/login')}
            disabled={loading || googleLoading}
          >
            Již máte účet? Přihlaste se
          </Button>
        </div>
      </Card>
    </div>
  );
}

function RegisterLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md p-8">
        <div className="animate-pulse space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <RegisterForm />
    </Suspense>
  );
}