"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function SetupCompletePage() {
  const router = useRouter();

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Nastavení dokončeno!</h1>
        <p className="text-muted-foreground">
          váš systém pro automatizaci zpracování potenciálních zákazníků je připraven k použití
        </p>
      </div>

      <div className="space-y-6 mb-8">
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2">co dál:</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>prohlédněte si svůj dashboard</li>
            <li>začněte zpracovávat potenciální zákazníky</li>
            <li>monitorujte výsledky a analýzy</li>
            <li>upravte nastavení podle potřeby</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={() => router.push('/dashboard')}
        >
          přejít na dashboard
        </Button>
      </div>
    </Card>
  );
}
