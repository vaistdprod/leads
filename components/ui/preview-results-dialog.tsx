import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { ScrollArea } from "./scroll-area";
import { Card } from "./card";

interface PreviewResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: {
    emails: Array<{
      to: string;
      subject: string;
      body: string;
      enrichmentData: any;
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview Results</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Processing Stats</h3>
            <div className="space-y-1 text-sm">
              <p>Total Contacts: {stats.total}</p>
              <p>Would Process: {stats.processed}</p>
              <p>Successful Generations: {stats.success}</p>
              <p>Failed Generations: {stats.failure}</p>
              {stats.rowRange && (
                <p>Row Range: {stats.rowRange.start} - {stats.rowRange.end}</p>
              )}
            </div>
          </Card>
          
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Timing Configuration</h3>
            <div className="space-y-1 text-sm">
              <p>Delay Between Emails: {results.delayBetweenEmails} seconds</p>
              <p>Estimated Total Duration: {(results.delayBetweenEmails * (stats.processed - 1) / 60).toFixed(1)} minutes</p>
            </div>
          </Card>
        </div>

        <ScrollArea className="flex-1 border rounded-md p-4">
          <div className="space-y-6">
            {results.emails.map((email, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Email {index + 1}</h4>
                    <p className="text-sm text-muted-foreground">To: {email.to}</p>
                  </div>

                  <div>
                    <h5 className="font-medium">Subject</h5>
                    <p className="text-sm mt-1">{email.subject}</p>
                  </div>

                  <div>
                    <h5 className="font-medium">Body</h5>
                    <div className="text-sm mt-1 whitespace-pre-wrap bg-muted p-2 rounded">
                      {email.body}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium">Enrichment Data</h5>
                    <div className="text-sm mt-1 bg-muted p-2 rounded">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(email.enrichmentData, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
