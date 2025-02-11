"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase/client';

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
      toast.success('Sheet IDs successfully saved');
    } catch (error) {
      console.error('Failed to save sheet IDs:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Konfigurace tabulek Google</h1>
        <p className="text-muted-foreground">
          nastavte své tabulky kontaktů a blacklistu
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="blacklistSheetId">ID tabulky blacklistu</Label>
          <Input
            id="blacklistSheetId"
            value={blacklistSheetId}
            onChange={(e) => setBlacklistSheetId(e.target.value)}
            required
            placeholder="Zadejte ID tabulky blacklistu"
          />
          <p className="text-sm text-muted-foreground">
            ID najdete v URL tabulky mezi /d/ a /edit
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactsSheetId">ID tabulky kontaktů</Label>
          <Input
            id="contactsSheetId"
            value={contactsSheetId}
            onChange={(e) => setContactsSheetId(e.target.value)}
            required
            placeholder="Zadejte ID tabulky kontaktů"
          />
          <p className="text-sm text-muted-foreground">
            ID najdete v URL tabulky mezi /d/ a /edit
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/setup/gemini-setup')}
          >
            zpět
          </Button>
          <Button
            type="submit"
            disabled={loading || !blacklistSheetId || !contactsSheetId}
          >
            {loading ? 'Ukládání...' : 'Dokončit nastavení'}
          </Button>
        </div>
      </form>
    </Card>
  );
}