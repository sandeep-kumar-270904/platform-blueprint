import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, DollarSign, Users, ArrowLeft, CheckCircle2, AlertTriangle, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const InstitutionAllocation = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Award Modal State
  const [awardModalOpen, setAwardModalOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [awardAmount, setAwardAmount] = useState<string>('');
  const [awarding, setAwarding] = useState(false);

  const fetchData = async () => {
    if (!user?.institutionId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/institutions/${user.institutionId._id || user.institutionId}/scholarships/${id}/allocation-dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setData(await res.json());
      } else {
        toast.error("Failed to load allocation dashboard");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading allocation dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, user]);

  const handleOpenAwardModal = (applicant: any) => {
    if (!data) return;
    setSelectedApplicant(applicant);
    // Suggest an even split based on remaining applicants who haven't been awarded yet
    const pendingCount = data.applicants.filter((a: any) => a.status === 'pending_allocation' || a.status === 'approved').length;
    const suggested = pendingCount > 0 ? Math.floor(data.remainingPool / pendingCount) : data.remainingPool;
    setAwardAmount(suggested.toString());
    setAwardModalOpen(true);
  };

  const handleAwardSubmit = async () => {
    if (!selectedApplicant || !data || !user?.institutionId) return;
    
    const amountNum = Number(awardAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amountNum > data.remainingPool) {
      toast.error(`Amount exceeds remaining pool of $${data.remainingPool.toLocaleString()}`);
      return;
    }

    setAwarding(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/institutions/${user.institutionId._id || user.institutionId}/scholarships/${id}/award`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          applicationId: selectedApplicant._id,
          amount: amountNum
        })
      });

      const responseData = await res.json();
      
      if (res.ok) {
        toast.success(`Successfully awarded $${amountNum.toLocaleString()} to ${selectedApplicant.applicantName}`);
        setAwardModalOpen(false);
        // Refresh data to get true remaining pool
        await fetchData();
      } else {
        toast.error(responseData.error || "Failed to award");
        // Always refresh on error to ensure client state isn't stale (e.g. race condition)
        await fetchData();
      }
    } catch (err) {
      toast.error("Server error while awarding");
      await fetchData();
    } finally {
      setAwarding(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex justify-center pt-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!data) {
    return <div className="min-h-screen bg-background flex justify-center pt-24">Failed to load data.</div>;
  }

  const isFullyAllocated = data.remainingPool <= 0 || data.scholarship.status === 'archived';

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" className="mb-6 pl-0" onClick={() => navigate('/institution-dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{data.scholarship.title}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Users className="h-4 w-4" /> Allocation Dashboard
            </p>
          </div>
          {isFullyAllocated && (
            <Badge className="bg-green-500 py-1.5 px-3">
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Fully Allocated
            </Badge>
          )}
        </div>

        {/* Pool Progress Indicator */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">Remaining Pool</p>
                <div className="text-3xl font-bold">
                  ${data.remainingPool.toLocaleString()} <span className="text-lg text-muted-foreground font-normal">of ${data.totalPool.toLocaleString()}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{data.awardedCount} of {data.applicants.length} awards made</p>
              </div>
            </div>
            
            <div className="w-full bg-muted rounded-full h-3 mt-4 overflow-hidden">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${Math.min(100, (data.awardedSum / data.totalPool) * 100)}%` }}
              />
            </div>
            
            {isFullyAllocated && (
              <div className="mt-4 flex items-center text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 p-3 rounded-md text-sm">
                <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
                This scholarship has been fully allocated and automatically archived.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Applicants Table */}
        <Card>
          <CardHeader>
            <CardTitle>Approved Applicants</CardTitle>
            <CardDescription>Review and allocate funds to approved applicants.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.applicants.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No applicants found for allocation.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Awarded Amount</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.applicants.map((app: any) => (
                    <TableRow key={app._id}>
                      <TableCell className="font-medium">{app.applicantName}</TableCell>
                      <TableCell>
                        {app.status === 'awarded' ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Awarded</Badge>
                        ) : app.status === 'pending_allocation' || app.status === 'approved' ? (
                          <Badge variant="secondary">Pending Allocation</Badge>
                        ) : (
                          <Badge variant="outline">{app.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {app.awardedAmount ? (
                          <span className="font-semibold text-green-600">${app.awardedAmount.toLocaleString()}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {app.status !== 'awarded' && !isFullyAllocated && (
                          <Button size="sm" onClick={() => handleOpenAwardModal(app)}>
                            <Coins className="h-4 w-4 mr-2" /> Award
                          </Button>
                        )}
                        {app.status === 'awarded' && (
                          <span className="text-sm text-muted-foreground">Allocated</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Award Modal */}
      <Dialog open={awardModalOpen} onOpenChange={setAwardModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award Scholarship</DialogTitle>
            <DialogDescription>
              Allocate funds to {selectedApplicant?.applicantName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-muted p-3 rounded-md flex justify-between items-center">
              <span className="text-sm font-medium">Available Pool:</span>
              <span className="font-bold text-primary">${data?.remainingPool?.toLocaleString()}</span>
            </div>

            <div className="space-y-2">
              <Label>Award Amount ($)</Label>
              <Input 
                type="number" 
                value={awardAmount} 
                onChange={(e) => setAwardAmount(e.target.value)} 
                min={0}
                max={data?.remainingPool}
              />
              <p className="text-xs text-muted-foreground">
                We've pre-filled a suggested even split, but you can adjust this amount.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setAwardModalOpen(false)} disabled={awarding}>Cancel</Button>
            <Button onClick={handleAwardSubmit} disabled={awarding || !awardAmount || Number(awardAmount) <= 0 || Number(awardAmount) > (data?.remainingPool || 0)}>
              {awarding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Award
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstitutionAllocation;
