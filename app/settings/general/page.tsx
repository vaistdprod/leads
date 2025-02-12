"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase/client';
import BackButton from '@/components/ui/back-button';

const generalSettingsSchema = z.object({
  blacklistSheetId: z.string().min(1, 'Povinné pole'),
  contactsSheetId: z.string().min(1, 'Povinné pole'),
  autoExecutionEnabled: z.boolean(),
  cronSchedule: z.string().optional(),
});

export default function GeneralSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof generalSettingsSchema>>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      blacklistSheetId: '',
      contactsSheetId: '',
      autoExecutionEnabled: false,
      cronSchedule: '',
    },
  });

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: settings, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found, create one
          const { data: newSettings, error: insertError } = await supabase
            .from('settings')
            .insert({ user_id: user.id })
            .select()
            .single();
          
          if (insertError) throw insertError;
          if (newSettings) {
            form.reset({
              blacklistSheetId: newSettings.blacklist_sheet_id || '',
              contactsSheetId: newSettings.contacts_sheet_id || '',
              autoExecutionEnabled: newSettings.auto_execution_enabled || false,
              cronSchedule: newSettings.cron_schedule || '',
            });
          }
        } else {
          throw error;
        }
      } else if (settings) {
        form.reset({
          blacklistSheetId: settings.blacklist_sheet_id || '',
          contactsSheetId: settings.contacts_sheet_id || '',
          autoExecutionEnabled: settings.auto_execution_enabled || false,
          cronSchedule: settings.cron_schedule || '',
        });
      }
    } catch (error) {
      console.error('Nepodařilo se načíst nastavení:', error);
      toast.error('Nepodařilo se načíst nastavení. Používám výchozí hodnoty.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof generalSettingsSchema>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('settings')
        .upsert({
          user_id: user.id,
          blacklist_sheet_id: values.blacklistSheetId,
          contacts_sheet_id: values.contactsSheetId,
          auto_execution_enabled: values.autoExecutionEnabled,
          cron_schedule: values.cronSchedule,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Nastavení bylo úspěšně uloženo');
    } catch (error) {
      console.error('Nepodařilo se uložit nastavení:', error);
      toast.error('Nepodařilo se uložit nastavení. Zkuste to prosím znovu.');
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <Card className="p-6">
        <div className="flex justify-between items-start">
          <BackButton />
          <h1 className="text-2xl font-bold mb-6">Obecná Nastavení</h1>
          <div></div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="blacklistSheetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Blacklist Sheetu</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    ID Google Sheetu obsahujícího blacklist emailů.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactsSheetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Kontaktů Sheetu</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    ID Google Sheetu obsahujícího kontakty ke zpracování.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="autoExecutionEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Automatické Spouštění
                    </FormLabel>
                    <FormDescription>
                      Povolit automatické zpracování kontaktů podle rozvrhu.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('autoExecutionEnabled') && (
              <FormField
                control={form.control}
                name="cronSchedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rozvrh (Cron Výraz)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="0 0 * * *" />
                    </FormControl>
                    <FormDescription>
                      Kdy spouštět zpracování (v cron formátu).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit">Uložit Nastavení</Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
