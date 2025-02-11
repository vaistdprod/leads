"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function WelcomePage() {
  const router = useRouter();

  const steps = [
    {
      title: "Integrace Google",
      description: "Propojte svůj účet Google pro přístup k Tabulkám a Gmailu.",
    },
    {
      title: "Nastavení Gemini API",
      description: "Nastavte svůj klíč Gemini API pro obohacení potenciálních zákazníků pomocí AI.",
    },
    {
      title: "Konfigurace Tabulek",
      description: "Nakonfigurujte své tabulky kontaktů a blacklistu",
    },
  ];

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Vítejte v nastavení</h1>
        <p className="text-muted-foreground">
          Pojďme nastavit váš systém pro automatizaci zpracování potenciálních zákazníků
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
          Začít
        </Button>
      </div>
    </Card>
  );
}