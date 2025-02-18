'use client';

import * as React from 'react';

interface JsonViewProps {
  data: any;
}

export function JsonView({ data }: JsonViewProps) {
  if (!data) return null;

  const formatValue = (value: any): string => {
    if (typeof value === 'string') {
      // Remove quotes from string values
      return value;
    }
    if (typeof value === 'object' && value !== null) {
      return Object.entries(value)
        .map(([k, v]) => `${k}: ${formatValue(v)}`)
        .join(', ');
    }
    return String(value);
  };

  const formatData = (obj: any): React.ReactElement => {
    return (
      <div className="space-y-1 text-sm">
        {Object.entries(obj).map(([key, value]) => {
          // Skip empty or null values
          if (value === null || value === undefined || value === '') return null;
          
          // Convert key from snake_case or camelCase to Title Case
          const formattedKey = key
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());

          return (
            <div key={key} className="flex flex-col">
              <span className="font-medium text-muted-foreground">{formattedKey}</span>
              <span className="text-foreground">{formatValue(value)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return formatData(data);
}
