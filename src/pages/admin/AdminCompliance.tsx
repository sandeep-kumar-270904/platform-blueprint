import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ComplianceCheck {
  _id: string;
  scholarshipId: {
    _id: string;
    title: string;
    provider: string;
  };
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  dueDate: string;
  status: 'pending' | 'submitted' | 'verified' | 'at_risk';
  submittedDocuments: string[];
}

const AdminCompliance = () => {
  const { user } = useAuth();
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChecks();
  }, []);

  const fetchChecks = async () => {
    try {
      const token = localStorage.getItem('token');
      // Assume a generic endpoint for admin to get all checks
      // In a real app this would be restricted and paginated
      const res = await fetch(`${API_URL}/api/scholarships/admin/compliance`, {
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

  const handleUpdateStatus = async (checkId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/compliance/${checkId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Status updated to ${status}`);
        setChecks(prev => prev.map(c => c._id === checkId ? { ...c, status: status as any } : c));
      } else {
        toast.error('Failed to update status');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Compliance Administration</h1>
          <p className="text-muted-foreground">Verify submitted proofs and monitor at-risk scholarships.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Submitted Compliance Checks</CardTitle>
            <CardDescription>Review documents submitted by awardees to maintain their scholarships.</CardDescription>
          </CardHeader>
          <CardContent>
            {checks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No compliance checks found.</p>
            ) : (
              <div className="space-y-4">
                {checks.map(check => (
                  <div key={check._id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1 space-y-1 mb-4 md:mb-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{check.userId?.name || 'Unknown User'}</h4>
                        <Badge variant={check.status === 'verified' ? 'default' : check.status === 'at_risk' ? 'destructive' : 'secondary'}>
                          {check.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{check.userId?.email}</p>
                      <p className="text-sm font-medium">Scholarship: {check.scholarshipId?.title}</p>
                      <p className="text-xs text-muted-foreground">Due: {format(new Date(check.dueDate), 'MMM d, yyyy')}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="mr-4">
                        {check.submittedDocuments.map((doc, idx) => (
                          <a key={idx} href={doc} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1 mb-1">
                            <Eye className="w-3 h-3" /> View Doc {idx + 1}
                          </a>
                        ))}
                        {check.submittedDocuments.length === 0 && (
                          <span className="text-xs text-muted-foreground">No docs</span>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(check._id, 'verified')} disabled={check.status === 'verified'}>
                        <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" /> Verify
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(check._id, 'at_risk')} disabled={check.status === 'at_risk'}>
                        <AlertCircle className="w-4 h-4 mr-1 text-red-500" /> Flag Risk
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCompliance;
