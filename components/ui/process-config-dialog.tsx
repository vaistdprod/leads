import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { RefreshCw } from "lucide-react";

interface ProcessConfigDialogProps {
  onProcess: (config: ProcessConfig) => Promise<void>;
  isTest?: boolean;
  processing: boolean;
}

export interface ProcessConfig {
  startRow?: number;
  endRow?: number;
  delayBetweenEmails: number;
  testMode: boolean;
  updateScheduling: boolean;
}

export function ProcessConfigDialog({ onProcess, isTest = false, processing }: ProcessConfigDialogProps) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<ProcessConfig>({
    delayBetweenEmails: 30,
    testMode: isTest,
    updateScheduling: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await onProcess({
        ...config,
        testMode: isTest
      });
      setOpen(false);
    } catch (error) {
      console.error('Process error:', error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!processing) {
      setOpen(newOpen);
    }
  };

  return (
    <>
      <Button
        variant={isTest ? "outline" : "default"}
        className={isTest ? "hover:bg-accent" : "hover:bg-primary/90"}
        disabled={processing}
        onClick={() => handleOpenChange(true)}
      >
        {processing ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            {isTest ? "Testing..." : "Processing..."}
          </>
        ) : (
          isTest ? "Test Run" : "Process Contacts"
        )}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isTest ? "Test Configuration" : "Process Configuration"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startRow">Start Row (optional)</Label>
                <Input
                  id="startRow"
                  type="number"
                  min="0"
                  placeholder="From beginning"
                  value={config.startRow || ""}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    startRow: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endRow">End Row (optional)</Label>
                <Input
                  id="endRow"
                  type="number"
                  min="0"
                  placeholder="To end"
                  value={config.endRow || ""}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    endRow: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                />
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
              />
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
              />
              <Label htmlFor="updateScheduling">Update scheduling information in sheets</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={processing}>
                {isTest ? "Run Test" : "Start Processing"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
