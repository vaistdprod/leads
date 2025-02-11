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

const passwordRequirements = [
  { label: 'At least one lowercase letter (a-z)', regex: /[a-z]/ },
  { label: 'At least one uppercase letter (A-Z)', regex: /[A-Z]/ },
  { label: 'At least one number (0-9)', regex: /[0-9]/ },
  { label: 'At least one special character (!@#$%^&*()_+-=[]{};\':"|<>?,./`~)', regex: /[!@#$%^&*()_+\-=\[\]{};\\':"\\|,.<>?/`~]/ },
  { label: 'Minimum 8 characters', regex: /.{8,}/ } // Updated to 8 characters
];

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validatePassword = (password: string) => {
    return passwordRequirements.every(req => req.regex.test(password));
  };

  const validateForm = () => {
    if (!email || !password || !confirmPassword || !inviteCode) {
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

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);

      // First verify the invite code and email match
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select('*')
        .eq('code', inviteCode)
        .eq('used', false)
        .eq('allowed_email', email)
        .single();

      if (inviteError || !invite) {
        toast.error('Invalid invite code or email mismatch');
        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${window.location.origin}/auth/callback?invite=${inviteCode}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error('Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      // Verify invite code and email match
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select('*')
        .eq('code', inviteCode)
        .eq('used', false)
        .eq('allowed_email', email)
        .single();

      if (inviteError || !invite) {
        toast.error('Invalid invite code or email mismatch');
        return;
      }

      // Register user
      const { data, error: signUpError } = await supabase.auth.signUp({
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
        // Mark invite as used
        const { error: updateError } = await supabase
          .from('invites')
          .update({
            used: true,
            used_by: data.user.id,
            used_at: new Date().toISOString()
          })
          .eq('id', invite.id);

        if (updateError) {
          console.error("Error updating invite:", updateError);
          toast.error("Failed to update invite status");
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <Logo className="mb-4" size={60} />
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-muted-foreground">Join our platform</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              type="text"
              placeholder="Enter your invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
              className="w-full"
              disabled={loading || googleLoading}
            />
          </div>

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
              disabled={loading || googleLoading}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading || !inviteCode || !email}
            className="w-full"
          >
            {googleLoading ? 'Connecting...' : 'Sign in with Google'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or create password
              </span>
            </div>
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
              disabled={loading || googleLoading}
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
              disabled={loading || googleLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || googleLoading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => router.push('/auth/login')}
            disabled={loading || googleLoading}
          >
            Already have an account? Log in
          </Button>
        </div>
      </Card>
    </div>
  );
}