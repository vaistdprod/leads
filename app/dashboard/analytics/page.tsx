"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { toast } from "sonner";
import { supabase } from '@/lib/supabase/client';

interface ApiUsageData {
  date: string;
  gemini: number;
  gmail: number;
  sheets: number;
  disify: number;
}

interface SuccessRateData {
  date: string;
  success: number;
  failure: number;
}

const chartConfig = {
  margin: { top: 20, right: 30, left: 20, bottom: 20 },
  axisProps: {
    tickCount: 5,
    tickSize: 6,
    tickMargin: 6,
    height: 60,
    width: 60,
    fontSize: 12,
    stroke: 'var(--border)',
  },
  tooltipStyle: {
    backgroundColor: 'var(--background)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
  },
  lineProps: {
    strokeWidth: 2,
    dot: { strokeWidth: 2 },
    activeDot: { strokeWidth: 2, r: 6 },
  },
  barProps: {
    radius: [4, 4, 0, 0] as [number, number, number, number],
  },
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [apiUsage, setApiUsage] = useState<ApiUsageData[]>([]);
  const [successRates, setSuccessRates] = useState<SuccessRateData[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: usageData, error: usageError } = await supabase
        .from('api_usage')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (usageError) throw usageError;

      const processedUsage = processApiUsageData(usageData || []);
      setApiUsage(processedUsage);

      const { data: successData, error: successError } = await supabase
        .from('processing_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (successError) throw successError;

      const processedRates = processSuccessRatesData(successData || []);
      setSuccessRates(processedRates);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const processApiUsageData = (data: Array<{
    created_at: string;
    service: string;
  }>): ApiUsageData[] => {
    const grouped = data.reduce((acc: Record<string, ApiUsageData>, curr) => {
      const date = new Date(curr.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, gemini: 0, gmail: 0, sheets: 0, disify: 0 };
      }
      
      // Only increment if service is a valid key
      if (curr.service === 'gemini' || curr.service === 'gmail' || 
          curr.service === 'sheets' || curr.service === 'disify') {
        acc[date][curr.service]++;
      }
      
      return acc;
    }, {});

    return Object.values(grouped);
  };

  const processSuccessRatesData = (data: Array<{
    created_at: string;
    status: string;
  }>): SuccessRateData[] => {
    const grouped = data.reduce((acc: Record<string, SuccessRateData>, curr) => {
      const date = new Date(curr.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, success: 0, failure: 0 };
      }
      curr.status === 'success' ? acc[date].success++ : acc[date].failure++;
      return acc;
    }, {});

    return Object.values(grouped);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-8">
          <Card className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-[400px] bg-gray-200 rounded"></div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-[400px] bg-gray-200 rounded"></div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">API Usage</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={apiUsage} margin={chartConfig.margin}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  scale="auto"
                  tickCount={chartConfig.axisProps.tickCount}
                  tickSize={chartConfig.axisProps.tickSize}
                  tickMargin={chartConfig.axisProps.tickMargin}
                  height={chartConfig.axisProps.height}
                  tick={{ fontSize: chartConfig.axisProps.fontSize }}
                  tickLine={{ stroke: chartConfig.axisProps.stroke }}
                  axisLine={{ stroke: chartConfig.axisProps.stroke }}
                  orientation="bottom"
                />
                <YAxis
                  scale="auto"
                  tickCount={chartConfig.axisProps.tickCount}
                  tickSize={chartConfig.axisProps.tickSize}
                  tickMargin={chartConfig.axisProps.tickMargin}
                  width={chartConfig.axisProps.width}
                  tick={{ fontSize: chartConfig.axisProps.fontSize }}
                  tickLine={{ stroke: chartConfig.axisProps.stroke }}
                  axisLine={{ stroke: chartConfig.axisProps.stroke }}
                  orientation="left"
                />
                <Tooltip contentStyle={chartConfig.tooltipStyle} />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="gemini"
                  stroke="hsl(var(--chart-1))"
                  name="Gemini AI"
                  {...chartConfig.lineProps}
                />
                <Line
                  type="monotone"
                  dataKey="gmail"
                  stroke="hsl(var(--chart-2))"
                  name="Gmail"
                  {...chartConfig.lineProps}
                />
                <Line
                  type="monotone"
                  dataKey="sheets"
                  stroke="hsl(var(--chart-3))"
                  name="Google Sheets"
                  {...chartConfig.lineProps}
                />
                <Line
                  type="monotone"
                  dataKey="disify"
                  stroke="hsl(var(--chart-4))"
                  name="Disify"
                  {...chartConfig.lineProps}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Success Rates</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={successRates} margin={chartConfig.margin}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  scale="auto"
                  tickCount={chartConfig.axisProps.tickCount}
                  tickSize={chartConfig.axisProps.tickSize}
                  tickMargin={chartConfig.axisProps.tickMargin}
                  height={chartConfig.axisProps.height}
                  tick={{ fontSize: chartConfig.axisProps.fontSize }}
                  tickLine={{ stroke: chartConfig.axisProps.stroke }}
                  axisLine={{ stroke: chartConfig.axisProps.stroke }}
                  orientation="bottom"
                />
                <YAxis
                  scale="auto"
                  tickCount={chartConfig.axisProps.tickCount}
                  tickSize={chartConfig.axisProps.tickSize}
                  tickMargin={chartConfig.axisProps.tickMargin}
                  width={chartConfig.axisProps.width}
                  tick={{ fontSize: chartConfig.axisProps.fontSize }}
                  tickLine={{ stroke: chartConfig.axisProps.stroke }}
                  axisLine={{ stroke: chartConfig.axisProps.stroke }}
                  orientation="left"
                />
                <Tooltip contentStyle={chartConfig.tooltipStyle} />
                <Legend verticalAlign="top" height={36} />
                <Bar
                  dataKey="success"
                  fill="hsl(var(--chart-2))"
                  name="Success"
                  stackId="a"
                  {...chartConfig.barProps}
                />
                <Bar
                  dataKey="failure"
                  fill="hsl(var(--chart-1))"
                  name="Failure"
                  stackId="a"
                  {...chartConfig.barProps}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}