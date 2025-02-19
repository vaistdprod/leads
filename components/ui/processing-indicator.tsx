"use client";

import { useState } from "react";
import { useProcessingState } from "@/lib/hooks/use-processing-state";
import { Progress } from "./progress";
import { Card } from "./card";
import { Loader2 } from "lucide-react";
import { Button } from "./button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";

export function ProcessingIndicator() {
  const { isProcessing, totalContacts, processedContacts, progress, abort } = useProcessingState();
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isProcessing) return null;

  const handleAbort = () => {
    setShowConfirm(true);
  };

  const confirmAbort = () => {
    abort();
    setShowConfirm(false);
  };

  return (
    <>
      <Card className="fixed bottom-4 right-4 p-4 w-[300px] shadow-lg z-50">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm font-medium">Processing Contacts</p>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleAbort}
            >
              Abort
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {totalContacts === null ? (
              "Loading contacts..."
            ) : (
              `Processing ${processedContacts} of ${totalContacts} contacts (${Math.round(progress)}%)`
            )}
          </p>
        </div>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abort Processing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop processing after the current contact is finished. Already processed contacts will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAbort} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Abort Processing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
