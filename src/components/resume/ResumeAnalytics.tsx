import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarChart3, Eye, Briefcase, Download } from 'lucide-react';

interface ResumeAnalyticsProps {
  analytics: {
    applicationCount?: number;
    viewCount?: number;
    exportCount?: number;
  };
}

export const ResumeAnalytics = ({ analytics }: ResumeAnalyticsProps) => {
  const data = [
    { label: 'Applications', value: analytics?.applicationCount || 0, icon: Briefcase, color: 'text-blue-500' },
    { label: 'Public Views', value: analytics?.viewCount || 0, icon: Eye, color: 'text-green-500' },
    { label: 'PDF Exports', value: analytics?.exportCount || 0, icon: Download, color: 'text-purple-500' },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <BarChart3 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Resume Analytics</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 mt-4">
          {data.map(item => (
            <div key={item.label} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-white rounded-full shadow-sm ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="font-medium">{item.label}</span>
              </div>
              <span className="text-2xl font-bold">{item.value}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
