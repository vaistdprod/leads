"use client";

import { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fromDate ? format(fromDate, "PPP") : <span>From date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              selected={fromDate}
              onSelect={handleFromSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {toDate ? format(toDate, "PPP") : <span>To date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              selected={toDate}
              onSelect={handleToSelect}
              initialFocus
              disabled={(date: Date) => fromDate ? date < fromDate : false}
            />
          </PopoverContent>
        </Popover>
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
