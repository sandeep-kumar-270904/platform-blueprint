import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileCheck, UploadCloud, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ComplianceCheck {
  _id: string;
  scholarshipId: {
    _id: string;
    title: string;
    provider: string;
    renewalRequirements?: any;
  };
  dueDate: string;
  status: 'pending' | 'submitted' | 'verified' | 'at_risk';
  submittedDocuments: string[];
}

const ComplianceTracker = () => {
  const { user } = useAuth();
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchChecks = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/scholarships/my/compliance`, {
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
    fetchChecks();
  }, []);

  const handleFileUpload = async (checkId: string) => {
    setUploadingId(checkId);
    try {
      const token = localStorage.getItem('token');
      // Simulated upload for demo purposes
      const fakeDocUrl = `https://example.com/proof_${Date.now()}.pdf`;
      const res = await fetch(`${API_URL}/api/scholarships/compliance/${checkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ documentUrl: fakeDocUrl })
      });
      if (res.ok) {
        const updated = await res.json();
        setChecks(prev => prev.map(c => c._id === checkId ? updated : c));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'verified': return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</Badge>;
      case 'submitted': return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Under Review</Badge>;
      case 'at_risk': return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> At Risk</Badge>;
      default: return <Badge variant="outline">Action Required</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Compliance Tracker</h1>
          <p className="text-muted-foreground">Manage renewal requirements and submit proof for your active scholarships.</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : checks.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed rounded-lg bg-muted/20">
            <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No pending requirements</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">You don't have any active compliance checks right now.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {checks.map(check => (
              <Card key={check._id} className={check.status === 'at_risk' ? 'border-red-500' : ''}>
                <CardHeader className="flex flex-row items-start justify-between bg-muted/30">
                  <div>
                    <CardTitle>{check.scholarshipId?.title || 'Unknown Scholarship'}</CardTitle>
                    <CardDescription>{check.scholarshipId?.provider}</CardDescription>
                  </div>
                  {getStatusBadge(check.status)}
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Due Date</h4>
                        <p className="font-semibold">{format(new Date(check.dueDate), 'MMMM d, yyyy')}</p>
                      </div>
                      
                      {check.scholarshipId?.renewalRequirements && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Requirements</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {check.scholarshipId.renewalRequirements.minGPAToMaintain && (
                              <li>Maintain {check.scholarshipId.renewalRequirements.minGPAToMaintain} GPA</li>
                            )}
                            {check.scholarshipId.renewalRequirements.reportingRequired && (
                              <li>Submit {check.scholarshipId.renewalRequirements.reportingFrequency} progress report</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-center space-y-4 border-l pl-6">
                      {check.status === 'pending' || check.status === 'at_risk' ? (
                        <>
                          <p className="text-sm text-muted-foreground">Please upload your transcript or progress report to maintain eligibility.</p>
                          <Button onClick={() => handleFileUpload(check._id)} disabled={uploadingId === check._id}>
                            {uploadingId === check._id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <UploadCloud className="w-4 h-4 mr-2" />
                            )}
                            Upload Document
                          </Button>
                        </>
                      ) : (
                        <>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Submitted Documents</h4>
                          {check.submittedDocuments.map((doc, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-blue-500 hover:underline cursor-pointer">
                              <FileCheck className="w-4 h-4" /> Document {idx + 1}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceTracker;
