"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { getAuthUrl } from '@/lib/google/auth';
import BackButton from '@/components/ui/back-button';

export default function GoogleAuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const authUrl = getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error('Failed to initiate Google authentication');
      setLoading(false);
    }
  };

  return (
    <Card className="p-8">
      <div className="flex justify-between items-start">
        <BackButton />
        <h1 className="text-3xl font-bold mb-2">Connect Google Account</h1>
        <div></div>
      </div>
      <p className="text-muted-foreground">
        We need access to Google Sheets for contacts and Gmail for sending emails.
      </p>

      <div className="space-y-6 mb-8">
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Required Permissions:</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Read access to Google Sheets (for contacts and blacklist)</li>
            <li>Send emails via Gmail</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleGoogleAuth}
          disabled={loading}
          size="lg"
        >
          {loading ? 'Connecting...' : 'Connect Google Account'}
        </Button>
      </div>
    </Card>
  );
}