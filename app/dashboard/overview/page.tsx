"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart, RefreshCw, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase/client';

interface DashboardStats {
  total_leads: number;
  processed_leads: number;
  success_rate: number;
  last_processed: string | null;
  blacklist_count: number;
  contacts_count: number;
  emails_sent: number;
  emails_queued: number;
}

export default function OverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    total_leads: 0,
    processed_leads: 0,
    success_rate: 0,
    last_processed: null,
    blacklist_count: 0,
    contacts_count: 0,
    emails_sent: 0,
    emails_queued: 0
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: dashboardStats, error } = await supabase
        .from('dashboard_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found, create one
          const { data: newStats, error: insertError } = await supabase
            .from('dashboard_stats')
            .insert({ user_id: user.id })
            .select()
            .single();
          
          if (insertError) throw insertError;
          if (newStats) setStats(newStats);
        } else {
          throw error;
        }
      } else if (dashboardStats) {
        setStats(dashboardStats);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      toast.success('Processing completed successfully');
      await loadDashboardStats();
    } catch (error) {
      console.error('Processing failed:', error);
      toast.error('Failed to process contacts');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Overview</h1>
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
                Processing...
              </>
            ) : (
              "Process Contacts"
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
              <h2 className="text-2xl font-bold">{stats.total_leads}</h2>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Processed</p>
              <h2 className="text-2xl font-bold">{stats.processed_leads}</h2>
            </div>
            <BarChart className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
              <h2 className="text-2xl font-bold">{(stats.success_rate || 0).toFixed(1)}%</h2>
            </div>
            <LineChart className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Processed</p>
              <h2 className="text-lg font-bold">
                {stats.last_processed ? new Date(stats.last_processed).toLocaleDateString() : 'Never'}
              </h2>
            </div>
            <RefreshCw className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>
    </div>
  );
}
