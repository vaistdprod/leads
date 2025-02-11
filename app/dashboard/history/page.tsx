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
import { isDevelopment } from '@/lib/env';
import { InboxIcon, ClockIcon } from 'lucide-react';

const mockHistory = {
  emailHistory: [],
  leadHistory: []
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
        await new Promise(resolve => setTimeout(resolve, 1000));
        setEmailHistory(mockHistory.emailHistory);
        setLeadHistory(mockHistory.leadHistory);
        setLoading(false);
        return;
      }

      const [emailsResponse, leadsResponse] = await Promise.all([
        supabase
          .from('email_history')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('lead_history')
          .select('*')
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
          <h2 className="text-xl font-semibold mb-4">Historie emailů</h2>
          {emailHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Předmět</TableHead>
                  <TableHead>Stav</TableHead>
                  <TableHead>Chyba</TableHead>
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
                      <Badge variant={email.status === 'sent' ? 'default' : 'destructive'}>
                        {email.status === 'sent' ? 'Odesláno' : 'Chyba'}
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
              title="Žádná historie emailů"
              description="Historie odeslaných emailů se zobrazí zde."
            />
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Aktivita kontaktů</h2>
          {leadHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>ID kontaktu</TableHead>
                  <TableHead>Akce</TableHead>
                  <TableHead>Detaily</TableHead>
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
                        {activity.action === 'created' ? 'Vytvořeno' :
                         activity.action === 'enriched' ? 'Obohaceno' :
                         activity.action === 'verified' ? 'Ověřeno' :
                         activity.action === 'contacted' ? 'Kontaktováno' :
                         activity.action === 'blacklisted' ? 'Na černé listině' :
                         activity.action}
                      </Badge>
                    </TableCell>
                    <TableCell>{activity.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState 
              icon={ClockIcon}
              title="Žádná aktivita kontaktů"
              description="Historie aktivit kontaktů se zobrazí zde."
            />
          )}
        </Card>
      </div>
    </div>
  );
}