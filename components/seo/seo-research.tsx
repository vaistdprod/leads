"use client";

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SearchData {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export function SeoResearch() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [searchData, setSearchData] = useState<SearchData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchSearchData = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/seo/google-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch search data');
      }

      const data = await response.json();
      setSearchData(data.rows || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">SEO Research</h2>
        <p className="text-muted-foreground">
          Analyze search performance and discover keyword opportunities
        </p>
      </div>
      
      <Card className="p-6">
        <div className="space-y-4">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              fetchSearchData();
            }} 
            className="flex gap-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="p-0">
                  <Calendar
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      const dialogElement = document.querySelector('[role="dialog"]');
                      if (dialogElement instanceof HTMLElement) {
                        dialogElement.click(); // Close dialog after selection
                      }
                    }}
                    initialFocus
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="p-0">
                  <Calendar
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      const dialogElement = document.querySelector('[role="dialog"]');
                      if (dialogElement instanceof HTMLElement) {
                        dialogElement.click(); // Close dialog after selection
                      }
                    }}
                    initialFocus
                    disabled={(date: Date) => startDate ? date < startDate : false}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <Button 
              type="submit"
              disabled={loading || !startDate || !endDate}
              className="self-end"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fetch Data
            </Button>
          </form>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}

          {searchData.length > 0 && (
            <div className="space-y-6">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={searchData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="keys[0]" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="clicks"
                      stroke="hsl(var(--chart-1))"
                      name="Clicks"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="impressions"
                      stroke="hsl(var(--chart-2))"
                      name="Impressions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="border rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">Keyword</th>
                      <th className="px-4 py-2 text-right">Clicks</th>
                      <th className="px-4 py-2 text-right">Impressions</th>
                      <th className="px-4 py-2 text-right">CTR</th>
                      <th className="px-4 py-2 text-right">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchData.map((row, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="px-4 py-2">{row.keys[0]}</td>
                        <td className="px-4 py-2 text-right">{row.clicks}</td>
                        <td className="px-4 py-2 text-right">{row.impressions}</td>
                        <td className="px-4 py-2 text-right">
                          {(row.ctr * 100).toFixed(2)}%
                        </td>
                        <td className="px-4 py-2 text-right">
                          {row.position.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
