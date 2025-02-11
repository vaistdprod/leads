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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase/client';
import { isDevelopment } from '@/lib/env';
import BackButton from '@/components/ui/back-button';

const aiSettingsSchema = z.object({
  geminiApiKey: z.string().min(1, 'Required'),
  model: z.string().default('gemini-pro'),
  temperature: z.number().min(0).max(1),
  topK: z.number().min(1).max(40),
  topP: z.number().min(0).max(1),
  useGoogleSearch: z.boolean(),
  enrichmentPrompt: z.string().min(1, 'Required'),
  emailPrompt: z.string().min(1, 'Required'),
});

const mockAiSettings = {
  gemini_api_key: 'mock-api-key',
  model: 'gemini-pro',
  temperature: 0.7,
  top_k: 40,
  top_p: 0.95,
  use_google_search: false,
  enrichment_prompt: 'Default enrichment prompt',
  email_prompt: 'Default email prompt',
};

export default function AiSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof aiSettingsSchema>>({
    resolver: zodResolver(aiSettingsSchema),
    defaultValues: {
      geminiApiKey: '',
      model: 'gemini-pro',
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      useGoogleSearch: false,
      enrichmentPrompt: '',
      emailPrompt: '',
    },
  });

  const loadSettings = async () => {
    try {
      let data;

      if (isDevelopment) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        data = mockAiSettings;
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
          geminiApiKey: data.gemini_api_key || '',
          model: data.model || 'gemini-pro',
          temperature: data.temperature || 0.7,
          topK: data.top_k || 40,
          topP: data.top_p || 0.95,
          useGoogleSearch: data.use_google_search || false,
          enrichmentPrompt: data.enrichment_prompt || '',
          emailPrompt: data.email_prompt || '',
        });
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
      toast.error('Failed to load AI settings. Using defaults.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof aiSettingsSchema>) => {
    try {
      if (isDevelopment) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Development mode: AI settings saved');
        return;
      }

      const { error } = await supabase
        .from('settings')
        .update({
          gemini_api_key: values.geminiApiKey,
          model: values.model,
          temperature: values.temperature,
          top_k: values.topK,
          top_p: values.topP,
          use_google_search: values.useGoogleSearch,
          enrichment_prompt: values.enrichmentPrompt,
          email_prompt: values.emailPrompt,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast.success('AI settings saved successfully');
    } catch (error) {
      console.error('Failed to save AI settings:', error);
      toast.error('Failed to save AI settings. Please try again.');
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
          <h1 className="text-2xl font-bold mb-6">Nastavení AI</h1>
          <div></div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="geminiApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gemini API klíč</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormDescription>
                    Váš Gemini API klíč pro operace AI
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teplota ({field.value})</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={[field.value]}
                      onValueChange={([value]) => field.onChange(value)}
                    />
                  </FormControl>
                  <FormDescription>
                    Řídí náhodnost ve výstupu (0 = deterministický, 1 = kreativní)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topK"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Top K ({field.value})</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={40}
                      step={1}
                      value={[field.value]}
                      onValueChange={([value]) => field.onChange(value)}
                    />
                  </FormControl>
                  <FormDescription>
                    Omezuje počet tokenů zvažovaných pro každý krok
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topP"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Top P ({field.value})</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={1}
                      step={0.05}
                      value={[field.value]}
                      onValueChange={([value]) => field.onChange(value)}
                    />
                  </FormControl>
                  <FormDescription>
                    Řídí rozmanitost výstupu
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="useGoogleSearch"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Použít vyhledávání Google
                    </FormLabel>
                    <FormDescription>
                      Povolit vyhledávání Google pro obohacení potenciálních zákazníků
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

            <FormField
              control={form.control}
              name="enrichmentPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Šablona výzvy k obohacení</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={5}
                      placeholder="Zadejte šablonu výzvy pro obohacení potenciálních zákazníků..."
                    />
                  </FormControl>
                  <FormDescription>
                    Šablona pro generování výzev k obohacení potenciálních zákazníků. Použijte {'{firstName}'}, {'{lastName}'} atd. pro proměnné.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emailPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Šablona výzvy k emailu</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={5}
                      placeholder="Zadejte šablonu výzvy pro generování emailu..."
                    />
                  </FormControl>
                  <FormDescription>
                    Šablona pro generování výzev k emailu. Použijte {'{firstName}'}, {'{enrichmentData}'} atd. pro proměnné.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Zpět
              </Button>
              <Button type="submit">Uložit nastavení</Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}