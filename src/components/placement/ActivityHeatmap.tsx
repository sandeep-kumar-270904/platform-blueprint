import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActivityHeatmapProps {
  history: string[]; // array of ISO date strings (e.g., '2023-10-15')
  currentStreak: number;
  longestStreak: number;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ history, currentStreak, longestStreak }) => {
  // Generate last 12 weeks of days (84 days)
  const today = new Date();
  const days = [];
  const historySet = new Set(history);

  for (let i = 83; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      active: historySet.has(dateStr)
    });
  }

  // Create columns of 7 days (Sunday - Saturday is standard, but we'll just stack them vertically 7 per column)
  const columns = [];
  for (let i = 0; i < days.length; i += 7) {
    columns.push(days.slice(i, i + 7));
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center text-lg">
          <span>Activity Streaks</span>
          <div className="flex gap-4 text-sm font-normal text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="font-bold text-primary">{currentStreak}</span> current
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-primary">{longestStreak}</span> longest
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex overflow-x-auto gap-1 pb-2 scrollbar-thin">
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-1">
              {col.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  title={day.date}
                  className={`w-4 h-4 rounded-sm ${
                    day.active ? 'bg-primary' : 'bg-muted/30'
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
