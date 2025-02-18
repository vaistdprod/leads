"use client";

import { useProcessingState } from "@/lib/hooks/use-processing-state";
import { Progress } from "./progress";
import { Card } from "./card";
import { Loader2 } from "lucide-react";

export function ProcessingIndicator() {
  const { isProcessing, totalContacts, processedContacts, progress } = useProcessingState();

  if (!isProcessing) return null;

  return (
    <Card className="fixed bottom-4 right-4 p-4 w-[300px] shadow-lg z-50">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-sm font-medium">Processing Contacts</p>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground">
          {totalContacts === null ? (
            "Loading contacts..."
          ) : (
            `Processing ${processedContacts} of ${totalContacts} contacts...`
          )}
        </p>
      </div>
    </Card>
  );
}
