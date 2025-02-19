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
  const [loading, setLoading] = useState(false);
  const [fromDateOpen, setFromDateOpen] = useState(false);
  const [toDateOpen, setToDateOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate) return;

    setLoading(true);
    try {
      if (onDateRangeChange) {
        await onDateRangeChange({ from: fromDate, to: toDate });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex space-x-4">
        <Dialog open={fromDateOpen} onOpenChange={setFromDateOpen}>
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
                setFromDate(date);
                setFromDateOpen(false);
              }}
              initialFocus
            />
          </DialogContent>
        </Dialog>

        <Dialog open={toDateOpen} onOpenChange={setToDateOpen}>
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
                setToDate(date);
                setToDateOpen(false);
              }}
              initialFocus
              disabled={(date: Date) => fromDate ? date < fromDate : false}
            />
          </DialogContent>
        </Dialog>

        <Button type="submit" disabled={!fromDate || !toDate || loading}>
          {loading ? "Loading..." : "Fetch Data"}
        </Button>
      </form>

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
