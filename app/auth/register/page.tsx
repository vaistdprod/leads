"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase/client';
import { isDevelopment } from '@/lib/env';

const passwordRequirements = [
  { label: 'At least one lowercase letter (a-z)', regex: /[a-z]/ },
  { label: 'At least one uppercase letter (A-Z)', regex: /[A-Z]/ },
  { label: 'At least one number (0-9)', regex: /[0-9]/ },
  { label: 'At least one special character (!@#$%^&*()_+-=[]{};\':"|<>?,./`~)', regex: /[!@#$%^&*()_+\-=\[\]{};\\':"\\|,.<>?/`~]/ },
  { label: 'Minimum 6 characters', regex: /.{6,}/ }
];

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (password: string) => {
    return passwordRequirements.every(req => req.regex.test(password));
  };

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return false;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    if (!validatePassword(password)) {
      toast.error('Password does not meet all requirements');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      // In development mode, simulate success after a short delay
      if (isDevelopment) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Registration successful! Redirecting...');
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
        console.error('Signup error:', signUpError);
        
        if (signUpError.message.includes('weak_password')) {
          toast.error('Password is too weak. Please follow all requirements');
        } else if (signUpError.message.includes('email')) {
          toast.error('Please enter a valid email address');
        } else if (signUpError.message.includes('rate limit')) {
          toast.error('Too many attempts. Please try again in a few minutes');
        } else {
          toast.error('Registration failed: ' + signUpError.message);
        }
        return;
      }

      if (data?.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([{ id: data.user.id, setup_completed: false }]);

        if (profileError) {
          console.error("Error creating user profile:", profileError);
          toast.error("Failed to create user profile");
          return;
        }

        toast.success('Registration successful! Please check your email');
        router.push('/setup/welcome');
      } else {
        toast.error('No user data received');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-muted-foreground">
            Start automating your lead processing
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              required
              className="w-full"
              disabled={loading}
            />
            <div className="text-sm space-y-1">
              <p className="font-medium text-muted-foreground">Password requirements:</p>
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
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => router.push('/auth/login')}
            disabled={loading}
          >
            Already have an account? Log in
          </Button>
        </div>
      </Card>
    </div>
  );
}