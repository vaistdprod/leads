import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
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
    setOpen(false);
    await onProcess(config);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isTest ? "outline" : "default"}
          className={isTest ? "hover:bg-accent" : "hover:bg-primary/90"}
          disabled={processing}
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
      </DialogTrigger>
      <DialogContent>
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
              checked={config.updateScheduling}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                updateScheduling: e.target.checked
              }))}
            />
            <Label htmlFor="updateScheduling">Update scheduling information in sheets</Label>
          </div>

          <Button type="submit" className="w-full">
            {isTest ? "Run Test" : "Start Processing"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
