"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function WelcomePage() {
  const router = useRouter();

  const steps = [
    {
      title: "Propojení Google účtu",
      description: "Propojte svůj Google účet pro přístup k Sheets a Gmailu.",
    },
    {
      title: "Nastavení Gemini API",
      description: "Nastavte svůj Gemini API klíč pro obohacování leadů pomocí AI.",
    },
    {
      title: "Nastavení Google Sheets",
      description: "Nastavte svůj blacklist a kontaktní sheet.",
    },
  ];

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Vítejte v úvodním nastavení</h1>
        <p className="text-muted-foreground">
          Pojďme nastavit váš systém na automatizované zpracování leadů.
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
