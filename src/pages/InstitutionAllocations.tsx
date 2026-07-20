import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Loader2, Users, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Scholarship } from "@/hooks/useScholarships";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Application {
  _id: string;
  status: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
}

const InstitutionAllocations = () => {
  const { institutionId, scholarshipId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [awarding, setAwarding] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch scholarship
        const resSchol = await fetch(`${API_URL}/api/scholarships/${scholarshipId}`);
        if (resSchol.ok) {
          setScholarship(await resSchol.json());
        }

        // Fetch applications
        const resApps = await fetch(`${API_URL}/api/scholarships/institutions/${institutionId}/scholarships/${scholarshipId}/applications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resApps.ok) {
          const data = await resApps.json();
          // Filter to only those not yet awarded/rejected
          setApplications(data.filter((app: Application) => app.status === 'submitted' || app.status === 'under_review'));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [institutionId, scholarshipId]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkAward = async () => {
    if (selectedIds.size === 0) return;
    setAwarding(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/institutions/${institutionId}/scholarships/${scholarshipId}/bulk-award`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ applicationIds: Array.from(selectedIds) })
      });
      if (res.ok) {
        const { scholarship: updatedScholarship } = await res.json();
        setScholarship(updatedScholarship);
        setSelectedIds(new Set());
        // Remove awarded from list
        setApplications(apps => apps.filter(app => !selectedIds.has(app._id)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAwarding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin" /></div>
      </div>
    );
  }

  if (!scholarship) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p>Scholarship not found.</p>
        </div>
      </div>
    );
  }

  const pool = scholarship.fundingPool;
  const amountPerAward = scholarship.amount?.min || 0;
  
  const selectedCount = selectedIds.size;
  const potentialSpend = selectedCount * amountPerAward;
  const currentAwarded = pool?.awardedAmount || 0;
  const currentGranted = pool?.awardsGranted || 0;
  
  const willExceedBudget = pool?.totalAmount ? (currentAwarded + potentialSpend > pool.totalAmount) : false;
  const willExceedCount = pool?.awardsTarget ? (currentGranted + selectedCount > pool.awardsTarget) : false;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Allocate Awards</h1>
            <p className="text-muted-foreground">{scholarship.title}</p>
          </div>
          {scholarship.status === 'closed' && (
            <Badge variant="outline" className="bg-muted px-3 py-1 text-sm">Pool Exhausted</Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Funding Pool</p>
                  <p className="text-2xl font-bold">
                    ${currentAwarded.toLocaleString()} / {pool?.totalAmount ? `$${pool.totalAmount.toLocaleString()}` : 'Unlimited'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Awards Granted</p>
                  <p className="text-2xl font-bold">
                    {currentGranted} / {pool?.awardsTarget || 'Unlimited'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={(willExceedBudget || willExceedCount) ? "border-red-500" : "border-primary"}>
            <CardContent className="p-6 flex flex-col justify-center">
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleBulkAward}
                disabled={selectedCount === 0 || willExceedBudget || willExceedCount || awarding || scholarship.status === 'closed'}
              >
                {awarding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Award {selectedCount} Applicant{selectedCount !== 1 ? 's' : ''}
              </Button>
              {(willExceedBudget || willExceedCount) && (
                <p className="text-xs text-red-500 mt-2 text-center flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Exceeds pool limits
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">Pending Applicants ({applications.length})</h2>
          {applications.map(app => (
            <Card key={app._id} className="hover:border-primary transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Checkbox 
                    checked={selectedIds.has(app._id)}
                    onCheckedChange={() => toggleSelect(app._id)}
                  />
                  <div>
                    <h3 className="font-semibold">{app.userId?.name || 'Anonymous User'}</h3>
                    <p className="text-sm text-muted-foreground">{app.userId?.email}</p>
                  </div>
                </div>
                <Badge variant="secondary">{app.status}</Badge>
              </CardContent>
            </Card>
          ))}
          {applications.length === 0 && (
            <div className="text-center p-8 text-muted-foreground border rounded-lg">
              No pending applications to award.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default InstitutionAllocations;
