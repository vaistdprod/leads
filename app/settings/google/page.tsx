"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { getAuthUrl } from '@/lib/google/auth';
import BackButton from '@/components/ui/back-button';

export default function GoogleSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState({ isAuthenticated: false });

  useEffect(() => {
    loadGoogleAuth();
  }, []);

  const loadGoogleAuth = async () => {
    try {
      const response = await fetch('/api/google-auth-state');
      const data = await response.json();
      setAuthState(data);
    } catch (error) {
      console.error('Failed to load Google auth state:', error);
      toast.error('Failed to load Google authentication status');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    const authUrl = getAuthUrl();
    window.location.href = authUrl;
  };

  const handleRevoke = async () => {
    try {
      const response = await fetch('/api/google-revoke', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke access');
      }

      setAuthState({ isAuthenticated: false });
      toast.success('Google authentication revoked successfully');
    } catch (error) {
      console.error('Failed to revoke Google auth:', error);
      toast.error('Failed to revoke Google authentication');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="p-6">
        <div className="flex justify-between items-start">
          <BackButton />
          <h1 className="text-2xl font-bold mb-6">Google Integration</h1>
          <div></div>
        </div>

        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Status</h3>
            <p className="text-muted-foreground">
              {authState.isAuthenticated
                ? 'Connected to Google'
                : 'Not connected to Google'}
            </p>
            {authState.isAuthenticated && authState.expiryDate && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Token expires: {new Date(authState.expiryDate).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            {authState.isAuthenticated ? (
              <Button
                variant="destructive"
                onClick={handleRevoke}
              >
                Revoke Access
              </Button>
            ) : (
              <Button
                onClick={handleGoogleAuth}
              >
                Connect Google Account
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
