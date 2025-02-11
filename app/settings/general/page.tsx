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
import { supabase, isDevelopment, getMockData } from '@/lib/supabase/client';
import MockSheetViewer from '@/components/MockSheetViewer';

const generalSettingsSchema = z.object({
  blacklistSheetId: z.string().min(1, 'Required'),
  contactsSheetId: z.string().min(1, 'Required'),
  autoExecutionEnabled: z.boolean(),
  cronSchedule: z.string().optional(),
});

export default function GeneralSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showMockSheet, setShowMockSheet] = useState(false);
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
      let data;

      if (isDevelopment) {
        data = (await getMockData({
          blacklist_sheet_id: '1abc...xyz',
          contacts_sheet_id: '2def...uvw',
          auto_execution_enabled: false,
          cron_schedule: '',
        })).data;
      } else {
        const { data: settings, error } = await supabase
          .from('settings')
          .select('*')
          .single();

        if (error) throw error;
        data = settings;
      }

      if (data) {
        form.reset({
          blacklistSheetId: data.blacklist_sheet_id || '',
          contactsSheetId: data.contacts_sheet_id || '',
          autoExecutionEnabled: data.auto_execution_enabled || false,
          cronSchedule: data.cron_schedule || '',
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings. Using defaults.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof generalSettingsSchema>) => {
    try {
      if (isDevelopment) {
        await getMockData(null);
        toast.success('Development mode: Settings saved');
        return;
      }

      const { error } = await supabase
        .from('settings')
        .update({
          blacklist_sheet_id: values.blacklistSheetId,
          contacts_sheet_id: values.contactsSheetId,
          auto_execution_enabled: values.autoExecutionEnabled,
          cron_schedule: values.cronSchedule,
          updated_at: new Date().toISOString(),
        })
        .single();

      if (error) throw error;

      toast.success('Settings saved successfully');
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
        <h1 className="text-2xl font-bold mb-6">General Settings</h1>

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
                    The ID of your Google Sheet containing blacklisted emails
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
                    The ID of your Google Sheet containing contacts to process
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
                      Automatic Execution
                    </FormLabel>
                    <FormDescription>
                      Enable automatic processing of contacts on a schedule
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
                      When to run the processing (in cron format)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit">Save Settings</Button>
          </form>
        </Form>

        <div className="mt-8">
          <Button onClick={() => router.back()}>Go Back</Button>
          <Button onClick={() => setShowMockSheet(!showMockSheet)}>
            {showMockSheet ? 'Hide' : 'Show'} Mock Sheet
          </Button>
        </div>

        {showMockSheet && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Mock Sheet Preview</h2>
            <MockSheetViewer
              data={[
                ['Email', 'First Name', 'Last Name', 'Company', 'Position'],
                ['john@example.com', 'John', 'Doe', 'Acme Inc', 'CEO'],
                ['jane@example.com', 'Jane', 'Smith', 'Tech Corp', 'CTO'],
              ]}
            />
          </div>
        )}
      </Card>
    </div>
  );
}