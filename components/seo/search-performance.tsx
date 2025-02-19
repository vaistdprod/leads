"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SearchPerformanceProps {
  onDateRangeChange?: (range: { from: Date; to: Date }) => void;
}

export function SearchPerformance({ onDateRangeChange }: SearchPerformanceProps) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate) return;

    setLoading(true);
    try {
      if (onDateRangeChange) {
        await onDateRangeChange({
          from: new Date(fromDate),
          to: new Date(toDate)
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for max attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="fromDate">From date</Label>
          <Input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              // Reset toDate if it's before fromDate
              if (toDate && toDate < e.target.value) {
                setToDate('');
              }
            }}
            max={today}
            required
            className="w-[240px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="toDate">To date</Label>
          <Input
            id="toDate"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            min={fromDate}
            max={today}
            required
            className="w-[240px]"
          />
        </div>

        <Button 
          type="submit" 
          disabled={!fromDate || !toDate || loading}
          className="mb-0.5"
        >
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
