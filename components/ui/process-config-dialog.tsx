"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { RefreshCw } from "lucide-react";
import { useProcessingState } from "@/lib/hooks/use-processing-state";

interface ProcessConfigDialogProps {
  onProcess: (config: ProcessConfig) => Promise<ProcessResult>;
  isTest?: boolean;
}

interface ProcessResult {
  success: boolean;
  aborted?: boolean;
  stats: {
    total: number;
    processed: number;
    success: number;
    failure: number;
    currentBatch: {
      start: number;
      end: number;
    };
  };
  nextBatch?: {
    startRow: number;
    remainingContacts: number;
  } | null;
}

export interface ProcessConfig {
  startRow?: number;
  endRow?: number;
  delayBetweenEmails: number;
  testMode: boolean;
  updateScheduling: boolean;
  shouldAbort?: boolean;
}

export function ProcessConfigDialog({ onProcess, isTest = false }: ProcessConfigDialogProps) {
  const [open, setOpen] = useState(false);
  const { 
    isProcessing,
    shouldAbort,
    setProcessing, 
    setTotalContacts, 
    setProcessedContacts,
    abort,
    reset 
  } = useProcessingState();
  
  const [config, setConfig] = useState<ProcessConfig>({
    delayBetweenEmails: 30,
    testMode: isTest,
    updateScheduling: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let currentConfig = {
        ...config,
        testMode: isTest
      };

      // Reset state
      reset();
      setProcessing(true);

      // Close dialog immediately
      setOpen(false);

      let result = await onProcess(currentConfig);
      
      // Set total contacts only on first batch
      setTotalContacts(result.stats.total);
      setProcessedContacts(result.stats.processed);

      // Continue processing remaining batches
      while (result.nextBatch && !shouldAbort) {
        currentConfig = {
          ...currentConfig,
          startRow: result.nextBatch.startRow,
          shouldAbort
        };
        result = await onProcess(currentConfig);
        if (result.aborted) {
          break;
        }
        setProcessedContacts(result.stats.processed);
      }

      // Reset state when done
      reset();
    } catch (error) {
      console.error('Process error:', error);
      reset();
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isProcessing) {
      if (!newOpen) {
        reset();
      }
      setOpen(newOpen);
    }
  };

  return (
    <>
      <Button
        variant={isTest ? "outline" : "default"}
        className={isTest ? "hover:bg-accent" : "hover:bg-primary/90"}
        disabled={isProcessing}
        onClick={() => handleOpenChange(true)}
        aria-label={isTest ? "Configure test run" : "Configure processing"}
      >
        {isProcessing ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            {isTest ? "Testing..." : "Processing..."}
          </>
        ) : (
          isTest ? "Test Run" : "Process Contacts"
        )}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px] p-0">
          <div className="flex flex-col h-full">
            <div className="p-6 pb-2">
              <DialogHeader>
                <DialogTitle>{isTest ? "Test Configuration" : "Process Configuration"}</DialogTitle>
                <DialogDescription>
                  Configure how contacts will be processed and scheduled
                </DialogDescription>
              </DialogHeader>
            </div>

            <form id="processConfigForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startRow">Start Row (optional)</Label>
                    <Input
                      id="startRow"
                      type="number"
                      min="1"
                      placeholder="From beginning"
                      value={config.startRow || ""}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        startRow: e.target.value ? parseInt(e.target.value) - 1 : undefined
                      }))}
                      aria-describedby="startRowHelp"
                    />
                    <p id="startRowHelp" className="text-xs text-muted-foreground">
                      First row to process (1-based)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endRow">End Row (optional)</Label>
                    <Input
                      id="endRow"
                      type="number"
                      min="1"
                      placeholder="To end"
                      value={config.endRow || ""}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        endRow: e.target.value ? parseInt(e.target.value) : undefined
                      }))}
                      aria-describedby="endRowHelp"
                    />
                    <p id="endRowHelp" className="text-xs text-muted-foreground">
                      Last row to process (1-based)
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="delay">Delay Between Emails (seconds)</Label>
                  <Input
                    id="delay"
                    type="number"
                    min="1"
                    value={config.delayBetweenEmails}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      delayBetweenEmails: parseInt(e.target.value) || 30
                    }))}
                    aria-describedby="delayHelp"
                  />
                  <p id="delayHelp" className="text-xs text-muted-foreground">
                    Time to wait between sending each email
                  </p>
                  {config.startRow !== undefined && config.endRow !== undefined && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Estimated duration: {((config.endRow - (config.startRow ?? 0)) * config.delayBetweenEmails / 60).toFixed(1)} minutes
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Note: Processing is done in batches to handle large volumes
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="updateScheduling"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={config.updateScheduling}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      updateScheduling: e.target.checked
                    }))}
                    aria-describedby="updateSchedulingHelp"
                  />
                  <Label htmlFor="updateScheduling">Update scheduling information in sheets</Label>
                </div>
                <p id="updateSchedulingHelp" className="text-xs text-muted-foreground ml-6">
                  Track email status and scheduling in Google Sheets
                </p>
              </div>
            </form>

            <div className="p-6 pt-2 border-t mt-6">
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" form="processConfigForm" disabled={isProcessing}>
                  {isTest ? "Run Test" : "Start Processing"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
