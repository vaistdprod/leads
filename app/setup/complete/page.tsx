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
        <div></div>
      </div>
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Nastavení dokončeno</h1>
        <p className="text-muted-foreground">
          Váš systém na automatizované zpracování leadů je připraven k použití.
        </p>
      </div>

      <div className="space-y-6 mb-8">
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Co dále:</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Prozkoumejte hlavní stránku</li>
            <li>Začněte zpracovávat leady</li>
            <li>Sledujte výsledky a analýzy</li>
            <li>Upravujte nastavení dle potřeb</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={() => router.push('/dashboard')}
        >
          Na hlavní stránku
        </Button>
      </div>
    </Card>
  );
}
