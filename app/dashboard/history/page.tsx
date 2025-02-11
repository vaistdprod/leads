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

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [leadHistory, setLeadHistory] = useState<LeadHistory[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    // ... existing loadHistory implementation ...
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
          <h2 className="text-xl font-semibold mb-4">historie emailů</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>datum</TableHead>
                <TableHead>předmět</TableHead>
                <TableHead>stav</TableHead>
                <TableHead>chyba</TableHead>
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
                      {email.status === 'sent' ? 'odesláno' : 'chyba'}
                    </Badge>
                  </TableCell>
                  <TableCell>{email.error || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">aktivita kontaktů</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>datum</TableHead>
                <TableHead>id kontaktu</TableHead>
                <TableHead>akce</TableHead>
                <TableHead>detaily</TableHead>
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
