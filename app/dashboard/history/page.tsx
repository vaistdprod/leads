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
import { supabase } from '@/lib/supabase/client';
import { EmailHistory, LeadHistory } from '@/lib/types';
import { InboxIcon, ClockIcon } from 'lucide-react';

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [leadHistory, setLeadHistory] = useState<LeadHistory[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const [emailsResponse, leadsResponse] = await Promise.all([
        supabase
          .from('email_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('lead_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (emailsResponse.error) throw emailsResponse.error;
      if (leadsResponse.error) throw leadsResponse.error;

      setEmailHistory(emailsResponse.data || []);
      setLeadHistory(leadsResponse.data || []);
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load history data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-8">
          <Card className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const EmptyState = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground/70">{description}</p>
    </div>
  );

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Email History</h2>
          {emailHistory.length > 0 ? (
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
                      {new Date(email.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{email.subject}</TableCell>
                    <TableCell>
                      <Badge variant={email.status === 'sent' ? 'default' : 'destructive'}>
                        {email.status === 'sent' ? 'Sent' : 'Failed'}
                      </Badge>
                    </TableCell>
                    <TableCell>{email.error || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState 
              icon={InboxIcon}
              title="No Email History"
              description="Email history will appear here."
            />
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Lead Activity</h2>
          {leadHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadHistory.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      {new Date(activity.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{activity.email}</TableCell>
                    <TableCell>
                      <Badge variant={activity.status === 'success' ? 'default' : 'destructive'}>
                        {activity.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{activity.details ? JSON.stringify(activity.details) : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState 
              icon={ClockIcon}
              title="No Lead Activity"
              description="Lead activity history will appear here."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
