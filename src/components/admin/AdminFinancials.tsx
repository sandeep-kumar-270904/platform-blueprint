import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { DollarSign, AlertCircle, CreditCard, RefreshCcw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AdminFinancials: React.FC = () => {
  const [data, setData] = useState({ bookings: [], disputes: [], payouts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancials();
  }, []);

  const fetchFinancials = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/financials/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setData(await res.json());
      } else {
        toast.error('Failed to load financials data');
      }
    } catch (err) {
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (id: string) => {
    const resolution = prompt('Enter resolution details:');
    if (!resolution) return;

    const issueRefund = window.confirm('Do you want to issue a full refund to the mentee?');
    const banUser = window.confirm('Do you want to ban the offending user involved in this dispute?');

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/financials/disputes/${id}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, issueRefund, banUser })
      });
      if (res.ok) {
        toast.success('Dispute resolved');
        fetchFinancials();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Action failed');
      }
    } catch (err) {
      toast.error('Server error');
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading financials...</div>;

  const pendingDisputes = data.disputes.filter((d: any) => d.status === 'open');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Financials & Disputes</h2>
          <p className="text-muted-foreground">Manage payouts, refunds, and booking disputes. (Super Admin Only)</p>
        </div>
      </div>

      <Tabs defaultValue="disputes">
        <TabsList>
          <TabsTrigger value="disputes">
            Disputes {pendingDisputes.length > 0 && <Badge variant="destructive" className="ml-2">{pendingDisputes.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="payouts">Mentor Payouts</TabsTrigger>
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="disputes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Disputes</CardTitle>
              <CardDescription>Review and resolve user complaints regarding paid sessions.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingDisputes.length === 0 ? (
                <p className="text-muted-foreground">No active disputes.</p>
              ) : (
                <div className="space-y-4">
                  {pendingDisputes.map((dispute: any) => (
                    <div key={dispute._id} className="border p-4 rounded-lg flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                          <span className="font-semibold">Dispute on Booking ID: {dispute.targetId?._id}</span>
                        </div>
                        <p className="text-sm"><strong>Opened By:</strong> {dispute.openedBy?.full_name} ({dispute.openedBy?.email})</p>
                        <p className="text-sm"><strong>Reason:</strong> {dispute.reason}</p>
                        <p className="text-sm bg-gray-50 p-2 mt-2 rounded">Details: {dispute.details}</p>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[150px]">
                        <Button size="sm" onClick={() => handleResolveDispute(dispute._id)}>
                          Resolve Dispute
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Payout Tracking</CardTitle>
              <CardDescription>Monitor pending and completed mentor payouts.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.payouts.length === 0 ? (
                <p className="text-muted-foreground">No payout records found.</p>
              ) : (
                <div className="space-y-2">
                  {data.payouts.map((p: any) => (
                    <div key={p._id} className="border p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <span className="font-medium">{p.mentorId?.full_name}</span>
                        <Badge variant={p.status === 'completed' ? 'default' : 'secondary'} className="ml-2">{p.status}</Badge>
                      </div>
                      <div className="font-mono">${p.amount} {p.currency}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.bookings.map((b: any) => (
                  <div key={b._id} className="border p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{b.menteeId?.full_name}</span> booked <span className="font-medium">{b.mentorId?.full_name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">${b.price}</div>
                      <Badge variant="outline">{b.paymentStatus}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
