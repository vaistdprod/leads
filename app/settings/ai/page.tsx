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
import BackButton from '@/components/ui/back-button';

const DEFAULT_ENRICHMENT_PROMPT = `
Hledej na internetu podrobnosti o tomto kontaktu a napiš stručné shrnutí v češtině:

Jméno: {firstName} {lastName}
Společnost: {company}
Pozice: {position}

Zaměř se na:
1. Profesní historii
2. Úspěchy ve firmě
3. Relevantní projekty
`;

const DEFAULT_EMAIL_PROMPT = `
Napiš profesionální email v češtině pro potenciálního klienta.

Kontakt:
Jméno: {firstName} {lastName}
Společnost: {company}
Pozice: {position}

Dodatečné informace:
{enrichmentData}

Požadavky:
- Krátký, profesionální, ale přátelský tón
- Personalizovaný úvod využívající dodatečné informace
- Nabídka pomoci, ne prodej
- Zmínka o zlepšení efektivity jejich operací
- Možnost odpovědět "ne" pro odmítnutí

Formát:
[SUBJECT]: <předmět emailu - max 3 slova>
[BODY]: <tělo emailu>
`;

const aiSettingsSchema = z.object({
  geminiApiKey: z.string().min(1, 'Required'),
  model: z.string().default('gemini-pro'),
  temperature: z.number().min(0).max(1),
  topK: z.number().min(1).max(40),
  topP: z.number().min(0).max(1),
  useGoogleSearch: z.boolean(),
  enrichmentPrompt: z.string().optional(),
  emailPrompt: z.string().optional(),
});

export default function AiSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);
  const form = useForm<z.infer<typeof aiSettingsSchema>>({
    resolver: zodResolver(aiSettingsSchema),
    defaultValues: {
      geminiApiKey: '',
      model: 'gemini-pro',
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      useGoogleSearch: false,
      enrichmentPrompt: DEFAULT_ENRICHMENT_PROMPT,
      emailPrompt: DEFAULT_EMAIL_PROMPT,
    },
  });

  const loadSettings = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (error) throw error;

      if (settings) {
        // Only update form if we have settings
        form.reset({
          geminiApiKey: settings.gemini_api_key || '',
          model: settings.model || 'gemini-pro',
          temperature: settings.temperature || 0.7,
          topK: settings.top_k || 40,
          topP: settings.top_p || 0.95,
          useGoogleSearch: settings.use_google_search || false,
          enrichmentPrompt: settings.enrichment_prompt || DEFAULT_ENRICHMENT_PROMPT,
          emailPrompt: settings.email_prompt || DEFAULT_EMAIL_PROMPT,
        });
        
        // Set hasApiKey if we have a key
        setHasApiKey(!!settings.gemini_api_key);
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
      const { error } = await supabase
        .from('settings')
        .update({
          gemini_api_key: values.geminiApiKey,
          model: values.model,
          temperature: values.temperature,
          top_k: values.topK,
          top_p: values.topP,
          use_google_search: values.useGoogleSearch,
          enrichment_prompt: values.enrichmentPrompt || DEFAULT_ENRICHMENT_PROMPT,
          email_prompt: values.emailPrompt || DEFAULT_EMAIL_PROMPT,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      setHasApiKey(!!values.geminiApiKey);
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
          <h1 className="text-2xl font-bold mb-6">AI Settings</h1>
          <div></div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="geminiApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gemini API Key</FormLabel>
                  <FormControl>
                    {hasApiKey ? (
                      <div className="flex gap-2">
                        <Input 
                          type="password" 
                          {...field} 
                          placeholder="API key is set" 
                          value="" 
                          onChange={(e) => {
                            field.onChange(e);
                            setHasApiKey(false);
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setHasApiKey(false)}
                        >
                          Change
                        </Button>
                      </div>
                    ) : (
                      <Input type="password" {...field} />
                    )}
                  </FormControl>
                  <FormDescription>
                    Your Gemini API key for AI operations
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
                  <FormLabel>Temperature ({field.value})</FormLabel>
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
                    Controls randomness in output (0 = deterministic, 1 = creative)
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
                    Limits the number of tokens considered for each step
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
                    Controls output diversity
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
                      Use Google Search
                    </FormLabel>
                    <FormDescription>
                      Enable Google Search for lead enrichment
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
                  <FormLabel>Enrichment Prompt Template</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={5}
                      placeholder={DEFAULT_ENRICHMENT_PROMPT}
                    />
                  </FormControl>
                  <FormDescription>
                    Template for generating lead enrichment prompts. Use {'{firstName}'}, {'{lastName}'} etc. for variables.
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
                  <FormLabel>Email Prompt Template</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={5}
                      placeholder={DEFAULT_EMAIL_PROMPT}
                    />
                  </FormControl>
                  <FormDescription>
                    Template for generating email prompts. Use {'{firstName}'}, {'{enrichmentData}'} etc. for variables.
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
                Back
              </Button>
              <Button type="submit">Save Settings</Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}