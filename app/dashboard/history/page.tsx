"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase, isDevelopment, getMockData } from '@/lib/supabase/client';
import { EmailHistory, LeadHistory } from '@/lib/types';

const mockHistory = {
  emails: [
    {
      id: '1',
      leadId: 'lead-1',
      subject: 'Introduction',
      status: 'sent',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      leadId: 'lead-2',
      subject: 'Follow-up',
      status: 'failed',
      error: 'Invalid email',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  leads: [
    {
      id: '1',
      leadId: 'lead-1',
      action: 'created',
      details: 'Lead imported from sheet',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      leadId: 'lead-1',
      action: 'enriched',
      details: 'Data enriched via Gemini',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
};

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [leadHistory, setLeadHistory] = useState<LeadHistory[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      if (isDevelopment) {
        const { data } = await getMockData(mockHistory);
        setEmailHistory(data.emails);
        setLeadHistory(data.leads);
      } else {
        const [emailsResult, leadsResult] = await Promise.all([
          supabase
            .from('email_history')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50),
          supabase
            .from('lead_history')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50),
        ]);

        if (emailsResult.error) throw emailsResult.error;
        if (leadsResult.error) throw leadsResult.error;

        setEmailHistory(emailsResult.data);
        setLeadHistory(leadsResult.data);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Email History</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailHistory.map((email) => (
                <TableRow key={email.id}>
                  <TableCell>
                    {new Date(email.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{email.subject}</TableCell>
                  <TableCell>
                    <Badge variant={email.status === 'sent' ? 'success' : 'destructive'}>
                      {email.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{email.error || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Lead Activity</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Lead ID</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadHistory.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    {new Date(activity.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{activity.leadId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {activity.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{activity.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
