"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createBrowserClient } from "@supabase/ssr";

export default function SeoSettings() {
  const [settings, setSettings] = useState({
    gemini_api_key: "",
    pagespeed_api_key: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('gemini_api_key, pagespeed_api_key')
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          gemini_api_key: data.gemini_api_key || "",
          pagespeed_api_key: data.pagespeed_api_key || "",
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .update({
          gemini_api_key: settings.gemini_api_key,
          pagespeed_api_key: settings.pagespeed_api_key,
        })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">SEO Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure your SEO analysis settings
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gemini_api_key">Gemini API Key</Label>
            <Input
              id="gemini_api_key"
              type="password"
              value={settings.gemini_api_key}
              onChange={(e) => setSettings(prev => ({ ...prev, gemini_api_key: e.target.value }))}
              placeholder="Enter your Gemini API key"
            />
            <p className="text-sm text-muted-foreground">
              Used for content analysis and generation
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pagespeed_api_key">PageSpeed Insights API Key</Label>
            <Input
              id="pagespeed_api_key"
              type="password"
              value={settings.pagespeed_api_key}
              onChange={(e) => setSettings(prev => ({ ...prev, pagespeed_api_key: e.target.value }))}
              placeholder="Enter your PageSpeed Insights API key"
            />
            <p className="text-sm text-muted-foreground">
              Used for website performance analysis
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
