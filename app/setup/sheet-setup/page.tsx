"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase/client';
import BackButton from '@/components/ui/back-button';

export default function SheetSetupPage() {
  const router = useRouter();
  const [blacklistSheetId, setBlacklistSheetId] = useState('');
  const [contactsSheetId, setContactsSheetId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('settings')
        .update({
          blacklist_sheet_id: blacklistSheetId,
          contacts_sheet_id: contactsSheetId,
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      router.push('/setup/complete');
      toast.success('Sheet IDs saved successfully');
    } catch (error) {
      console.error('Failed to save sheet IDs:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8">
      <div className="flex justify-between items-start">
        <BackButton />
        <h1 className="text-3xl font-bold mb-2">Google Sheets Configuration</h1>
        <div></div> {/* Empty div for spacing */}
      </div>
      <p className="text-muted-foreground">
        Set up your contacts and blacklist sheets.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="blacklistSheetId">Blacklist Sheet ID</Label>
          <Input
            id="blacklistSheetId"
            value={blacklistSheetId}
            onChange={(e) => setBlacklistSheetId(e.target.value)}
            required
            placeholder="Enter Blacklist Sheet ID"
          />
          <p className="text-sm text-muted-foreground">
            You can find the ID in the URL of the sheet between /d/ and /edit
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactsSheetId">Contacts Sheet ID</Label>
          <Input
            id="contactsSheetId"
            value={contactsSheetId}
            onChange={(e) => setContactsSheetId(e.target.value)}
            required
            placeholder="Enter Contacts Sheet ID"
          />
          <p className="text-sm text-muted-foreground">
            You can find the ID in the URL of the sheet between /d/ and /edit
          </p>
        </div>

        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={loading || !blacklistSheetId || !contactsSheetId}
          >
            {loading ? 'Saving...' : 'Complete Setup'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
