"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ColumnMappingForm } from "@/components/ui/column-mapping-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase/client';
import BackButton from '@/components/ui/back-button';

interface DomainUser {
  email: string;
  name: string;
}

const emailSettingsSchema = z.object({
  impersonatedEmail: z.string().email('Valid email required'),
  columnMappings: z.object({
    name: z.string(),
    email: z.string(),
    company: z.string(),
    position: z.string(),
    scheduledFor: z.string(),
    status: z.string()
  }).optional()
});

export default function EmailSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [domainUsers, setDomainUsers] = useState<DomainUser[]>([]);
  
  const form = useForm<z.infer<typeof emailSettingsSchema>>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      impersonatedEmail: '',
      columnMappings: {
        name: 'název',
        email: 'email',
        company: 'společnost',
        position: 'pozice',
        scheduledFor: 'scheduledfor',
        status: 'status'
      }
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

      if (error) throw error;

      if (settings) {
        form.reset({
          impersonatedEmail: settings.impersonated_email || '',
          columnMappings: settings.column_mappings || {
            name: 'název',
            email: 'email',
            company: 'společnost',
            position: 'pozice',
            scheduledFor: 'scheduledfor',
            status: 'status'
          }
        });
      }

      // Load domain users
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch domain users');
      }

      const { users } = await response.json();
      setDomainUsers(users);
    } catch (error) {
      console.error('Failed to load email settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof emailSettingsSchema>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('settings')
        .update({
          impersonated_email: values.impersonatedEmail,
          column_mappings: values.columnMappings,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Email settings saved successfully');
      router.refresh(); // Refresh the page to update any cached data
    } catch (error) {
      console.error('Failed to save email settings:', error);
      toast.error('Failed to save settings. Please try again.');
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold mb-6">Email Settings</h1>
          <div></div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="impersonatedEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Send Emails As</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user to impersonate" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {domainUsers.map((user) => (
                        <SelectItem key={user.email} value={user.email}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose which domain user to send emails as. This user must have Gmail delegation enabled.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mt-8">
              <ColumnMappingForm
                initialMappings={form.getValues().columnMappings}
                onSave={(mappings) => {
                  form.setValue('columnMappings', mappings);
                  form.handleSubmit(onSubmit)();
                }}
              />
            </div>

            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Back
              </Button>
              <Button type="submit">Save All Settings</Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
