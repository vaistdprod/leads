"use client";

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Save,
  RefreshCcw,
  Globe,
  Bot,
  Bell,
} from "lucide-react";

export default function SeoSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    analysis: {
      autoAnalyze: true,
      crawlDepth: 2,
      includeImages: true,
      checkBrokenLinks: true,
      analysisInterval: "daily",
      maxPagesPerScan: 100,
    },
    content: {
      temperature: 0.7,
      maxTokens: 2000,
      language: "en",
      tone: "professional",
      includeSources: true,
    },
    notifications: {
      emailAlerts: true,
      weeklyReport: true,
      performanceAlerts: true,
      alertThreshold: 20,
    },
  });

  const saveSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'seo',
          settings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast({
        title: "Settings saved",
        description: "Your SEO preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">SEO Settings</h2>
        <p className="text-muted-foreground">
          Configure your content analysis and generation preferences
        </p>
      </div>
      
      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">
            <Globe className="w-4 h-4 mr-2" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="content">
            <Bot className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatic Analysis</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically analyze websites on schedule
                  </p>
                </div>
                <Switch
                  checked={settings.analysis.autoAnalyze}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      analysis: { ...settings.analysis, autoAnalyze: checked },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Crawl Depth</Label>
                <Slider
                  value={[settings.analysis.crawlDepth]}
                  onValueChange={([value]) =>
                    setSettings({
                      ...settings,
                      analysis: { ...settings.analysis, crawlDepth: value },
                    })
                  }
                  max={5}
                  step={1}
                />
                <p className="text-sm text-muted-foreground">
                  Current depth: {settings.analysis.crawlDepth} levels
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Images Analysis</Label>
                    <p className="text-sm text-muted-foreground">
                      Analyze image alt text and optimization
                    </p>
                  </div>
                  <Switch
                    checked={settings.analysis.includeImages}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        analysis: { ...settings.analysis, includeImages: checked },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Check Broken Links</Label>
                    <p className="text-sm text-muted-foreground">
                      Verify all internal and external links
                    </p>
                  </div>
                  <Switch
                    checked={settings.analysis.checkBrokenLinks}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        analysis: { ...settings.analysis, checkBrokenLinks: checked },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Temperature</Label>
                <Slider
                  value={[settings.content.temperature * 100]}
                  onValueChange={([value]) =>
                    setSettings({
                      ...settings,
                      content: { ...settings.content, temperature: value / 100 },
                    })
                  }
                  max={100}
                />
                <p className="text-sm text-muted-foreground">
                  Current temperature: {settings.content.temperature}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Content Tone</Label>
                <Select
                  value={settings.content.tone}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      content: { ...settings.content, tone: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select content tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important updates via email
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.emailAlerts}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, emailAlerts: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Report</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly performance summaries
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.weeklyReport}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, weeklyReport: checked },
                    })
                  }
                />
              </div>

              <div className="space-y-4">
                <Label>Alert Threshold (%)</Label>
                <Slider
                  value={[settings.notifications.alertThreshold]}
                  onValueChange={([value]) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, alertThreshold: value },
                    })
                  }
                  max={100}
                />
                <p className="text-sm text-muted-foreground">
                  Alert when metrics change by {settings.notifications.alertThreshold}%
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" disabled={loading}>
          <RefreshCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button onClick={saveSettings} disabled={loading}>
          {loading ? (
            <AlertCircle className="w-4 h-4 mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
