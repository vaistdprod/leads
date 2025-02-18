"use client";

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const mockTrafficData = [
  { date: '2024-01', pageviews: 1200, visitors: 800 },
  { date: '2024-02', pageviews: 1500, visitors: 1000 },
  { date: '2024-03', pageviews: 1800, visitors: 1200 },
  { date: '2024-04', pageviews: 2200, visitors: 1500 },
];

const mockKeywordData = [
  { keyword: 'web development', clicks: 450, impressions: 5000 },
  { keyword: 'software solutions', clicks: 380, impressions: 4200 },
  { keyword: 'digital transformation', clicks: 320, impressions: 3800 },
  { keyword: 'cloud services', clicks: 290, impressions: 3500 },
  { keyword: 'IT consulting', clicks: 250, impressions: 3000 },
];

const mockContentPerformance = [
  { title: 'Getting Started with Cloud Computing', views: 1200, engagement: 75 },
  { title: 'Digital Transformation Guide', views: 980, engagement: 82 },
  { title: 'Web Development Best Practices', views: 850, engagement: 68 },
  { title: 'IT Security Essentials', views: 720, engagement: 71 },
];

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function Reports() {
  const [timeRange, setTimeRange] = useState('3m');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-muted-foreground">
            View detailed analytics and performance reports
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">Last Month</SelectItem>
            <SelectItem value="3m">Last 3 Months</SelectItem>
            <SelectItem value="6m">Last 6 Months</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="seo">SEO Performance</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Traffic Overview</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockTrafficData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="pageviews"
                      stroke="hsl(var(--chart-1))"
                      name="Page Views"
                    />
                    <Line
                      type="monotone"
                      dataKey="visitors"
                      stroke="hsl(var(--chart-2))"
                      name="Visitors"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Keywords</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockKeywordData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="keyword" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="clicks" fill="hsl(var(--chart-1))" name="Clicks" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="seo">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Keyword Performance</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockKeywordData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="keyword" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar
                      yAxisId="left"
                      dataKey="clicks"
                      fill="hsl(var(--chart-1))"
                      name="Clicks"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="impressions"
                      fill="hsl(var(--chart-2))"
                      name="Impressions"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Click Distribution</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockKeywordData}
                      dataKey="clicks"
                      nameKey="keyword"
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      label
                    >
                      {mockKeywordData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content">
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Content Performance</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockContentPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="title" type="category" width={200} />
                    <Tooltip />
                    <Bar dataKey="views" fill="hsl(var(--chart-1))" name="Views">
                      {mockContentPerformance.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Engagement Metrics</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockContentPerformance}
                        dataKey="engagement"
                        nameKey="title"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {mockContentPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
                <div className="space-y-4">
                  {mockContentPerformance.map((content, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{content.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {content.views.toLocaleString()} views
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{content.engagement}%</p>
                        <p className="text-sm text-muted-foreground">engagement</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
