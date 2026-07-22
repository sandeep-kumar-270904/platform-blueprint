import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export interface SharedCalendarProps {
  deadlines?: { date: Date; title: string; type: string }[];
}

export const SharedCalendar: React.FC<SharedCalendarProps> = ({ deadlines = [] }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Filter deadlines for the selected date
  const selectedDeadlines = deadlines.filter(
    (d) => date && d.date.toDateString() === date.toDateString()
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Shared Deadline Calendar</CardTitle>
        <CardDescription>Track upcoming scholarship and application deadlines together.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex justify-center border rounded-lg p-2 bg-muted/10">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md"
            modifiers={{
              hasDeadline: deadlines.map((d) => d.date),
            }}
            modifiersStyles={{
              hasDeadline: { fontWeight: 'bold', textDecoration: 'underline', color: 'var(--primary)' },
            }}
          />
        </div>
        <div className="flex-1 space-y-4">
          <h3 className="font-semibold text-lg">
            {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
          </h3>
          {selectedDeadlines.length > 0 ? (
            <div className="space-y-3">
              {selectedDeadlines.map((deadline, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 border rounded-md bg-background">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium">{deadline.title}</p>
                    <Badge variant="outline" className="mt-1 text-xs">{deadline.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm p-4 text-center border border-dashed rounded-md">
              No deadlines scheduled for this date.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
