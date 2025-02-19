"use client";

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle, FileText, Wand2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  title: string;
  content: string;
  keywords: string[];
}

export function ContentGeneration() {
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('professional');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPost, setGeneratedPost] = useState<BlogPost | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [activeTab, setActiveTab] = useState('edit');

  const generateContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/seo/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, keywords, tone }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      setGeneratedPost(data);
      setEditedContent(data.content);
      setActiveTab('edit');
      
      toast({
        title: "Content Generated",
        description: "Your blog post has been generated successfully.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportContent = () => {
    const blob = new Blob([editedContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Content Generation</h2>
        <p className="text-muted-foreground">
          Generate SEO-optimized blog posts and articles
        </p>
      </div>
      
      <Card className="p-6">
        <div className="space-y-6">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              generateContent();
            }}
            className="space-y-6"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Topic</label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter the main topic for your blog post"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Keywords</label>
                <Input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="Enter keywords (comma-separated)"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tone</label>
                <Select value={tone} onValueChange={setTone}>
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

            <Button 
              type="submit"
              disabled={loading || !topic.trim()}
              className="w-full"
            >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!loading && <Wand2 className="mr-2 h-4 w-4" />}
            Generate Content
            </Button>
          </form>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-md">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {generatedPost && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{generatedPost.title}</h3>
                <Button variant="outline" onClick={exportContent}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export Markdown
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {generatedPost.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-sm bg-primary/10 text-primary rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="mt-4">
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[500px] font-mono"
                  />
                </TabsContent>
                <TabsContent value="preview" className="mt-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{editedContent}</ReactMarkdown>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
