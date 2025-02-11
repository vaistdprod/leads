"use client";

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart, RefreshCw, Settings, Users } from "lucide-react";
import { useRouter } from 'next/navigation';
import { supabase, isDevelopment, getMockData, simulateDelay } from '@/lib/supabase/client';
import { toast } from "sonner";
import BackButton from '@/components/ui/back-button'; // Make sure this component exists and is exported correctly
import MockSheetViewer from '@/components/MockSheetViewer'; // Make sure this component exists and is exported correctly

interface DashboardStats {
  totalLeads: number;
  processedLeads: number;
  successRate: number;
  lastProcessed: string | null;
  blacklistCount: number;
  contactsCount: number;
  emailsSent: number;
  emailsQueued: number;
}

const mockStats = {
  leads: [
    { email_sent: true },
    { email_sent: false },
    { email_sent: true }
  ],
  settings: { last_execution_at: new Date().toISOString() },
  blacklist: { count: 150 },
  contacts: { count: 500 },
  emails: { sent: 250, queued: 50 }
};

// Mock data for the sheet viewer
const mockSheetData = [
  ['Header 1', 'Header 2', 'Header 3'],
  ['Row 1, Cell 1', 'Row 1, Cell 2', 'Row 1, Cell 3'],
  ['Row 2, Cell 1', 'Row 2, Cell 2', 'Row 2, Cell 3'],
];

export default function OverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    processedLeads: 0,
    successRate: 0,
    lastProcessed: null,
    blacklistCount: 0,
    contactsCount: 0,
    emailsSent: 0,
    emailsQueued: 0
  });
  const [showMockSheet, setShowMockSheet] = useState(false);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      if (isDevelopment) {
        const { data } = await getMockData(mockStats);
        setStats({
          totalLeads: data.leads.length,
          processedLeads: data.leads.filter(lead => lead.email_sent).length,
          successRate: (data.leads.filter(lead => lead.email_sent).length / data.leads.length) * 100,
          lastProcessed: data.settings.last_execution_at,
          blacklistCount: data.blacklist.count,
          contactsCount: data.contacts.count,
          emailsSent: data.emails.sent,
          emailsQueued: data.emails.queued
        });
      } else {
        const [leadsResult, settingsResult, blacklistResult, contactsResult, emailsResult] = await Promise.all([
          supabase.from('leads').select('*'),
          supabase.from('settings').select('last_execution_at').single(),
          supabase.from('blacklist').select('count'),
          supabase.from('contacts').select('count'),
          supabase.from('emails').select('count').match({ status: 'sent' })
        ]);

        if (leadsResult.error) throw leadsResult.error;
        if (settingsResult.error) throw settingsResult.error;

        const totalLeads = leadsResult.data.length;
        const processedLeads = leadsResult.data.filter(lead => lead.email_sent).length;

        setStats({
          totalLeads,
          processedLeads,
          successRate: totalLeads > 0 ? (processedLeads / totalLeads) * 100 : 0,
          lastProcessed: settingsResult.data?.last_execution_at || null,
          blacklistCount: blacklistResult.count || 0,
          contactsCount: contactsResult.count || 0,
          emailsSent: emailsResult.count || 0,
          emailsQueued: 0 // TODO: Implement email queue count
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      toast.error('Failed to load dashboard data. Using default values.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      if (isDevelopment) {
        await simulateDelay();
        toast.success('Development mode: Processing simulated');
      } else {
        const response = await fetch('/api/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Processing failed');
        }
      }

      await loadDashboardStats();
      toast.success('Processing completed successfully');
    } catch (error) {
      console.error('Processing failed:', error);
      toast.error('Failed to process leads. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
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
              'Process Leads'
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
              <h2 className="text-2xl font-bold">{stats.totalLeads}</h2>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Processed</p>
              <h2 className="text-2xl font-bold">{stats.processedLeads}</h2>
            </div>
            <BarChart className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
              <h2 className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</h2>
            </div>
            <LineChart className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Processed</p>
              <h2 className="text-lg font-bold">
                {stats.lastProcessed ? new Date(stats.lastProcessed).toLocaleDateString() : 'Never'}
              </h2>
            </div>
            <RefreshCw className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Blacklisted Emails</p>
              <h2 className="text-2xl font-bold">{stats.blacklistCount}</h2>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Contact List Size</p>
              <h2 className="text-2xl font-bold">{stats.contactsCount}</h2>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Emails Sent</p>
              <h2 className="text-2xl font-bold">{stats.emailsSent}</h2>
            </div>
            <BarChart className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Emails Queued</p>
              <h2 className="text-2xl font-bold">{stats.emailsQueued}</h2>
            </div>
            <LineChart className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>
      {isDevelopment && (
        <div className="mt-8">
          <Button onClick={() => setShowMockSheet(!showMockSheet)}>
            {showMockSheet ? 'Hide Mock Sheet' : 'Show Mock Sheet'}
          </Button>
          {showMockSheet && (
            <div className="mt-4">
              <MockSheetViewer data={mockSheetData} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
