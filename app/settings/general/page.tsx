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
  blacklistSheetId: z.string().min(1, 'Required'),
  contactsSheetId: z.string().min(1, 'Required'),
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
            .upsert({ user_id: user.id }, { onConflict: 'user_id' })
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
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings. Using default values.');
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

      toast.success('Settings saved successfully.');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings. Please try again.');
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
          <h1 className="text-2xl font-bold mb-6">General Settings</h1>
          <div></div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="blacklistSheetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blacklist Sheet ID</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    Google Sheet ID containing contacts to process.
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
                  <FormLabel>Contacts Sheet ID</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    Google Sheet ID containing contacts to process.
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
                      Auto Execution
                    </FormLabel>
                    <FormDescription>
                      Enable automatic processing of contacts according to schedule.
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
                    <FormLabel>Schedule (Cron Expression)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="0 0 * * *" />
                    </FormControl>
                    <FormDescription>
                      When to run the processing (in cron format).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit">Save Settings</Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
