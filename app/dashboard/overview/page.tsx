"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart, RefreshCw, Settings, Users } from "lucide-react";
import { useRouter } from 'next/navigation';
import { supabase, isDevelopment, getMockData, simulateDelay } from '@/lib/supabase/client';
import { toast } from "sonner";

export default function OverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({
    totalLeads: 0,
    processedLeads: 0,
    successRate: 0,
    lastProcessed: null,
    blacklistCount: 0,
    contactsCount: 0,
    emailsSent: 0,
    emailsQueued: 0
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    // ... existing loadDashboardStats implementation ...
  };

  const handleProcess = async () => {
    // ... existing handleProcess implementation ...
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">přehled</h1>
        <div className="space-x-4">
          <Button
            onClick={() => router.push('/settings')}
            variant="outline"
            size="icon"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleProcess}
            disabled={processing}
          >
            {processing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                zpracovávání...
              </>
            ) : (
              'zpracovat kontakty'
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">celkem kontaktů</p>
              <h2 className="text-2xl font-bold">{stats.totalLeads}</h2>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">zpracováno</p>
              <h2 className="text-2xl font-bold">{stats.processedLeads}</h2>
            </div>
            <BarChart className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">úspěšnost</p>
              <h2 className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</h2>
            </div>
            <LineChart className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">naposledy zpracováno</p>
              <h2 className="text-lg font-bold">
                {stats.lastProcessed ? new Date(stats.lastProcessed).toLocaleDateString() : 'nikdy'}
              </h2>
            </div>
            <RefreshCw className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>
    </div>
  );
}