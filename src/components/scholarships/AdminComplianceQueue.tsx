import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AdminComplianceQueue: React.FC = () => {
  const [checks, setChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchChecks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/admin/compliance-checks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChecks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecks();
  }, []);

  const handleAction = async (id: string, action: 'verify' | 'flag-at-risk') => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem('token');
      const actionParam = action === 'flag-at-risk' ? 'flag' : 'verify';
      const res = await fetch(`${API_URL}/api/scholarships/admin/compliance-checks/${id}/${actionParam}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(`Compliance check ${action === 'verify' ? 'verified' : 'flagged'}`);
        fetchChecks();
      } else {
        toast.error(`Failed to ${action}`);
      }
    } catch (err) {
      toast.error(`Error: ${err}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Review Queue</CardTitle>
        <CardDescription>Review post-award proof submitted by students.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : checks.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">Queue Empty</h3>
            <p className="text-muted-foreground">No compliance submissions require review at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {checks.map((check) => (
              <div key={check._id} className="border p-4 rounded-lg flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card hover:border-border transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{check.applicationId?.scholarshipId?.title || 'Unknown Scholarship'}</span>
                    <Badge variant={check.status === 'submitted' ? 'secondary' : 'destructive'}>
                      {check.status === 'submitted' ? 'Pending Review' : 'At Risk'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Awardee: {check.applicationId?.userId?.name || 'Unknown User'} | Due Date: {format(new Date(check.dueDate), 'MMM d, yyyy')}
                  </p>
                  
                  {check.userSubmittedProof?.text && (
                    <div className="bg-muted p-2 rounded text-sm mt-2">
                      <span className="font-semibold">Submitted Proof:</span> {check.userSubmittedProof.text}
                    </div>
                  )}
                  {check.userSubmittedProof?.fileUrl && (
                    <a href={check.userSubmittedProof.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center mt-1">
                      <ExternalLink className="h-3 w-3 mr-1" /> View Attached File
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2 md:mt-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleAction(check._id, 'flag-at-risk')}
                    disabled={actionLoading === check._id}
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    {actionLoading === check._id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
                    Flag At Risk
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => handleAction(check._id, 'verify')}
                    disabled={actionLoading === check._id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {actionLoading === check._id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Verify Proof
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
