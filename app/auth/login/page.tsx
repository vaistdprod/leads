"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase/client';
import { isDevelopment } from '@/lib/env';
import { Logo } from '@/components/ui/logo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (isDevelopment) {
          const devAuth = localStorage.getItem('dev_auth');
          if (devAuth === 'true') {
            document.cookie = 'dev_auth=true; path=/';
            window.location.href = '/dashboard';
            return;
          }
          setInitialized(true);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          window.location.href = '/dashboard';
          return;
        }
        setInitialized(true);
      } catch (error) {
        console.error('Session check failed:', error);
        setInitialized(true);
      }
    };

    checkSession();
  }, []);

  const validateForm = () => {
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
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
        await new Promise(resolve => setTimeout(resolve, 500));
        localStorage.setItem('dev_auth', 'true');
        document.cookie = 'dev_auth=true; path=/';
        toast.success('Development mode: Login successful');
        window.location.href = '/dashboard';
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Login error:', signInError);
        
        if (signInError.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else if (signInError.message.includes('rate limit')) {
          toast.error('Too many attempts. Please try again in a few minutes');
        } else if (signInError.message.includes('network')) {
          toast.error('Network error. Please check your connection');
        } else {
          toast.error('Login failed. Please try again');
        }
        return;
      }

      if (data.session) {
        toast.success('Login successful');
        window.location.href = '/dashboard';
      } else {
        toast.error('Failed to get session. Please try again');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <Logo className="mb-4" size={60} />
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  );
}