"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function WelcomePage() {
  const router = useRouter();

  const steps = [
    {
      title: "Google Integration",
      description: "Connect your Google account to access Sheets and Gmail.",
    },
    {
      title: "Gemini API Setup",
      description: "Set up your Gemini API key for AI-powered lead enrichment.",
    },
    {
      title: "Sheets Configuration",
      description: "Configure your contacts and blacklist sheets.",
    },
  ];

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to Setup</h1>
        <p className="text-muted-foreground">
          Let's set up your lead processing automation system.
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
              {index + 1}
            </div>
            <div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={() => router.push('/setup/google-auth')}
        >
          Get Started
        </Button>
      </div>
    </Card>
  );
}
