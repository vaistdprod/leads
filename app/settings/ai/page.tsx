"use client";

import { useState, useEffect } from 'react';
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
import { supabase, isDevelopment, getMockData } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

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
        data = (await getMockData(mockAiSettings)).data;
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
      console.error('nepodařilo se načíst nastavení ai:', error);
      toast.error('nepodařilo se načíst nastavení ai. používám výchozí hodnoty.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof aiSettingsSchema>) => {
    try {
      if (isDevelopment) {
        await getMockData(null);
        toast.success('vývojový režim: nastavení ai uloženo');
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
        .single();

      if (error) throw error;

      toast.success('nastavení ai úspěšně uloženo');
    } catch (error) {
      console.error('nepodařilo se uložit nastavení ai:', error);
      toast.error('nepodařilo se uložit nastavení ai. zkuste to prosím znovu.');
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">nastavení ai</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="geminiApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>klíč gemini api</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormDescription>
                    váš klíč gemini api pro operace ai
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
                  <FormLabel>teplota ({field.value})</FormLabel>
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
                    řídí náhodnost ve výstupu (0 = deterministický, 1 = kreativní)
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
                  <FormLabel>top k ({field.value})</FormLabel>
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
                    omezuje počet tokenů zvažovaných pro každý krok
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
                  <FormLabel>top p ({field.value})</FormLabel>
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
                    řídí rozmanitost výstupu
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
                      použít vyhledávání google
                    </FormLabel>
                    <FormDescription>
                      povolit vyhledávání google pro obohacení potenciálních zákazníků
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
                  <FormLabel>šablona výzvy k obohacení</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={5}
                      placeholder="zadejte šablonu výzvy pro obohacení potenciálních zákazníků..."
                    />
                  </FormControl>
                  <FormDescription>
                    šablona pro generování výzev k obohacení potenciálních zákazníků. použijte {'{firstName}'}, {'{lastName}'} atd. pro proměnné.
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
                  <FormLabel>šablona výzvy k emailu</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={5}
                      placeholder="zadejte šablonu výzvy pro generování emailu..."
                    />
                  </FormControl>
                  <FormDescription>
                    šablona pro generování výzev k emailu. použijte {'{firstName}'}, {'{enrichmentData}'} atd. pro proměnné.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit">uložit nastavení ai</Button>
          </form>
        </Form>
        <Button onClick={() => router.back()}>zpět</Button>
      </Card>
    </div>
  );
}
