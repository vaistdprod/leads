"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import BackButton from '@/components/ui/back-button';

export default function SetupCompletePage() {
  const router = useRouter();

  return (
    <Card className="p-8">
      <div className="flex justify-between items-start">
        <BackButton />
        <div></div> {/* Empty div for spacing */}
      </div>
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Setup Complete!</h1>
        <p className="text-muted-foreground">
          Your lead processing automation system is ready to use.
        </p>
      </div>

      <div className="space-y-6 mb-8">
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2">What's next:</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Explore your dashboard</li>
            <li>Start processing leads</li>
            <li>Monitor results and analytics</li>
            <li>Adjust settings as needed</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={() => router.push('/dashboard')}
        >
          Go to Dashboard
        </Button>
      </div>
    </Card>
  );
}
