'use client';

import { useState } from 'react';
import { Input } from './input';
import { Label } from './label';
import { Button } from './button';
import { Card } from './card';

interface ColumnMappingFormProps {
  initialMappings?: {
    name: string;
    email: string;
    company: string;
    position: string;
    scheduledFor: string;
    status: string;
  };
  onSave: (mappings: {
    name: string;
    email: string;
    company: string;
    position: string;
    scheduledFor: string;
    status: string;
  }) => void;
}

export function ColumnMappingForm({ initialMappings, onSave }: ColumnMappingFormProps) {
  const [mappings, setMappings] = useState(initialMappings ?? {
    name: 'název',
    email: 'email',
    company: 'společnost',
    position: 'pozice',
    scheduledFor: 'scheduledfor',
    status: 'status'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(mappings);
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Column Mappings</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Specify the column names in your Google Sheet that correspond to each required field.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name-column">Name Column</Label>
            <Input
              id="name-column"
              value={mappings.name}
              onChange={e => setMappings(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., název, name, full_name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-column">Email Column</Label>
            <Input
              id="email-column"
              value={mappings.email}
              onChange={e => setMappings(prev => ({ ...prev, email: e.target.value }))}
              placeholder="e.g., email, email_address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-column">Company Column</Label>
            <Input
              id="company-column"
              value={mappings.company}
              onChange={e => setMappings(prev => ({ ...prev, company: e.target.value }))}
              placeholder="e.g., společnost, company, organization"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position-column">Position Column</Label>
            <Input
              id="position-column"
              value={mappings.position}
              onChange={e => setMappings(prev => ({ ...prev, position: e.target.value }))}
              placeholder="e.g., pozice, position, job_title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled-column">Scheduled For Column</Label>
            <Input
              id="scheduled-column"
              value={mappings.scheduledFor}
              onChange={e => setMappings(prev => ({ ...prev, scheduledFor: e.target.value }))}
              placeholder="e.g., scheduledfor, scheduled_date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status-column">Status Column</Label>
            <Input
              id="status-column"
              value={mappings.status}
              onChange={e => setMappings(prev => ({ ...prev, status: e.target.value }))}
              placeholder="e.g., status, state"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button type="submit">Save Column Mappings</Button>
        </div>
      </form>
    </Card>
  );
}
