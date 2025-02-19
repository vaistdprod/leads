"use client";

import { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SearchPerformanceProps {
  onDateRangeChange?: (range: { from: Date; to: Date }) => void;
}

export function SearchPerformance({ onDateRangeChange }: SearchPerformanceProps) {
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();

  const handleFromSelect = (date: Date | undefined) => {
    setFromDate(date);
    if (date && toDate && onDateRangeChange) {
      onDateRangeChange({ from: date, to: toDate });
    }
  };

  const handleToSelect = (date: Date | undefined) => {
    setToDate(date);
    if (fromDate && date && onDateRangeChange) {
      onDateRangeChange({ from: fromDate, to: date });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fromDate ? format(fromDate, "PPP") : <span>From date</span>}
            </Button>
          </DialogTrigger>
          <DialogContent className="p-0">
            <Calendar
              selected={fromDate}
              onSelect={(date) => {
                handleFromSelect(date);
                const dialogElement = document.querySelector('[role="dialog"]');
                if (dialogElement instanceof HTMLElement) {
                  dialogElement.click(); // Close dialog after selection
                }
              }}
              initialFocus
            />
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {toDate ? format(toDate, "PPP") : <span>To date</span>}
            </Button>
          </DialogTrigger>
          <DialogContent className="p-0">
            <Calendar
              selected={toDate}
              onSelect={(date) => {
                handleToSelect(date);
                const dialogElement = document.querySelector('[role="dialog"]');
                if (dialogElement instanceof HTMLElement) {
                  dialogElement.click(); // Close dialog after selection
                }
              }}
              initialFocus
              disabled={(date: Date) => fromDate ? date < fromDate : false}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="font-medium mb-2">Total Clicks</h3>
          <p className="text-2xl font-bold">0</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-medium mb-2">Total Impressions</h3>
          <p className="text-2xl font-bold">0</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-medium mb-2">Average CTR</h3>
          <p className="text-2xl font-bold">0%</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-medium mb-2">Average Position</h3>
          <p className="text-2xl font-bold">0</p>
        </Card>
      </div>
    </div>
  );
}
