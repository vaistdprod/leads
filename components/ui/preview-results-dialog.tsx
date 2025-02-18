import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog";
import { ScrollArea } from "./scroll-area";
import { Card } from "./card";
import { Button } from "./button";
import { EnrichmentData } from "@/lib/api/gemini";

interface PreviewResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: {
    emails: Array<{
      to: string;
      subject: string;
      body: string;
      enrichmentData: EnrichmentData;
    }>;
    delayBetweenEmails: number;
  };
  stats: {
    total: number;
    processed: number;
    success: number;
    failure: number;
    rowRange?: {
      start: number;
      end: number;
    };
  };
}

export function PreviewResultsDialog({ open, onOpenChange, results, stats }: PreviewResultsDialogProps) {
  if (!results?.emails?.length) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-4xl h-[90vh] p-0 gap-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="h-full flex flex-col">
          <div className="p-6 pb-2">
            <DialogHeader>
              <DialogTitle>Preview Results</DialogTitle>
              <DialogDescription>
                Review the generated emails and processing configuration before proceeding
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="px-6 grid grid-cols-2 gap-4 mb-4">
            <Card className="p-4 bg-gray-50 dark:bg-gray-900">
              <h3 className="font-semibold mb-2">Processing Stats</h3>
              <div className="space-y-1 text-sm">
                <p>Total Contacts: {stats.total}</p>
                <p>Would Process: {stats.processed}</p>
                <p>Successful Generations: {stats.success}</p>
                <p>Failed Generations: {stats.failure}</p>
                {stats.rowRange && (
                  <p>Row Range: {stats.rowRange.start + 1} - {stats.rowRange.end}</p>
                )}
              </div>
            </Card>
            
            <Card className="p-4 bg-gray-50 dark:bg-gray-900">
              <h3 className="font-semibold mb-2">Timing Configuration</h3>
              <div className="space-y-1 text-sm">
                <p>Delay Between Emails: {results.delayBetweenEmails} seconds</p>
                <p>Estimated Total Duration: {((results.delayBetweenEmails * (stats.processed - 1)) / 60).toFixed(1)} minutes</p>
                <p className="text-muted-foreground mt-2">Note: Processing is done in batches to handle large volumes</p>
              </div>
            </Card>
          </div>

          <ScrollArea className="flex-1 px-6">
            <div className="space-y-6 pb-6">
              {results.emails.map((email, index) => (
                <Card key={index} className="p-4 bg-gray-50 dark:bg-gray-900">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold">Email {index + 1}</h4>
                      <p className="text-sm text-muted-foreground">To: {email.to}</p>
                    </div>

                    <div>
                      <h5 className="font-medium">Subject</h5>
                      <p className="text-sm mt-1 bg-gray-100 dark:bg-gray-800 p-2 rounded">{email.subject}</p>
                    </div>

                    <div>
                      <h5 className="font-medium">Body</h5>
                      <div className="text-sm mt-1 whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-2 rounded">
                        {email.body}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium">Enrichment Data</h5>
                      <div className="text-sm mt-1 space-y-2">
                        {Object.entries(email.enrichmentData).map(([key, value]) => (
                          <div key={key} className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                            <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: </span>
                            <span>{value as string}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <div className="p-6 pt-2 border-t">
            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
