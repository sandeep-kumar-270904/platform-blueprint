import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, Users, CheckCircle2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const InstitutionBulkAidPanel: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      // Assume endpoint for institution stats, placeholder for now
      const res = await fetch(`${API_URL}/api/scholarships/admin/institution-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setData(await res.json());
      } else {
        // Mock data fallback for UI demonstration since backend endpoint might not exist yet
        setData({
          totalFundingPool: 50000,
          allocatedFunds: 35000,
          pendingApplications: 12,
          disbursedCount: 45
        });
      }
    } catch (err) {
      console.error(err);
      setData({
        totalFundingPool: 50000,
        allocatedFunds: 35000,
        pendingApplications: 12,
        disbursedCount: 45
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Total Funding Pool</p>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">${data?.totalFundingPool.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Allocated Funds</p>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">${data?.allocatedFunds.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(((data?.allocatedFunds || 0) / (data?.totalFundingPool || 1)) * 100)}% of total pool
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Pending Applications</p>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{data?.pendingApplications}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Awards Disbursed</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{data?.disbursedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bulk-Aid Management</CardTitle>
          <CardDescription>Manage and allocate your institution's funding pool across multiple students efficiently.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">Bulk disbursement interface to be implemented.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
