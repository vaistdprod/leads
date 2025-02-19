"use client";

import { useState, forwardRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface CustomInputProps {
  value?: string;
  onClick?: () => void;
  placeholder: string;
}

const CustomInput = forwardRef<HTMLButtonElement, CustomInputProps>(
  ({ value, onClick, placeholder }, ref) => (
    <button
      type="button"
      className="w-[240px] flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left"
      onClick={onClick}
      ref={ref}
    >
      {value || <span className="text-muted-foreground">{placeholder}</span>}
    </button>
  )
);
CustomInput.displayName = "CustomInput";

interface SearchPerformanceProps {
  onDateRangeChange?: (range: { from: Date; to: Date }) => void;
}

export function SearchPerformance({ onDateRangeChange }: SearchPerformanceProps) {
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFetchData = async () => {
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
      <div className="flex flex-wrap gap-4 items-end">
        <div className="relative">
          <DatePicker
            selected={fromDate}
            onChange={(date: Date | null) => {
              setFromDate(date);
              if (toDate && date && date > toDate) {
                setToDate(null);
              }
            }}
            selectsStart
            startDate={fromDate || undefined}
            endDate={toDate || undefined}
            maxDate={new Date()}
            dateFormat="MMM d, yyyy"
            customInput={<CustomInput placeholder="From date" />}
            portalId="root"
          />
        </div>

        <div className="relative">
          <DatePicker
            selected={toDate}
            onChange={(date: Date | null) => setToDate(date)}
            selectsEnd
            startDate={fromDate || undefined}
            endDate={toDate || undefined}
            minDate={fromDate || undefined}
            maxDate={new Date()}
            dateFormat="MMM d, yyyy"
            customInput={<CustomInput placeholder="To date" />}
            portalId="root"
          />
        </div>

        <Button 
          onClick={handleFetchData}
          disabled={!fromDate || !toDate || loading}
          className="mb-0.5"
        >
          {loading ? "Loading..." : "Fetch Data"}
        </Button>
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
