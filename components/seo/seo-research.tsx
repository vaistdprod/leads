"use client";

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
  const [siteUrl, setSiteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchData, setSearchData] = useState<SearchData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchSearchData = async () => {
    if (!startDate || !endDate || !siteUrl) {
      setError('Please fill in all fields (Site URL and date range)');
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
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          siteUrl: siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
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
            className="flex flex-wrap gap-4"
          >
            <div className="space-y-2 w-full">
              <label className="text-sm font-medium">Site URL</label>
              <Input
                type="text"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="e.g. https://example.com"
                className="w-full md:w-[400px]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <div className="relative">
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => {
                    setStartDate(date || undefined);
                    if (endDate && date && date > endDate) {
                      setEndDate(undefined);
                    }
                  }}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  maxDate={new Date()}
                  dateFormat="MMM d, yyyy"
                  placeholderText="Pick a date"
                  className="w-[200px] flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  portalId="root"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <div className="relative">
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date || undefined)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  maxDate={new Date()}
                  dateFormat="MMM d, yyyy"
                  placeholderText="Pick a date"
                  className="w-[200px] flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  portalId="root"
                />
              </div>
            </div>

            <Button 
              type="submit"
              disabled={loading || !startDate || !endDate || !siteUrl.trim()}
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
