import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Download, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AccountSettings() {
  const { user } = useAuth();
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Referral State
  const [companies, setCompanies] = useState<any[]>([]);
  const [referrerProfiles, setReferrerProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // New Profile Form State
  const [selectedCompany, setSelectedCompany] = useState("");
  const [role, setRole] = useState("");
  const [batchYear, setBatchYear] = useState(new Date().getFullYear());
  const [note, setNote] = useState("");
  const [limit, setLimit] = useState(5);
  const [isOptingIn, setIsOptingIn] = useState(false);

  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        const [compRes, profRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/interview-prep/companies`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/placement-referrals/my-profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (compRes.ok) {
          const compData = await compRes.json();
          setCompanies(compData);
        }
        if (profRes.ok) {
          const profData = await profRes.json();
          setReferrerProfiles(profData);
        }
      } catch (err) {
        console.error("Failed to fetch referral data", err);
      } finally {
        setLoadingProfiles(false);
      }
    };
    fetchReferralData();
  }, []);

  const handleOptIn = async () => {
    if (!selectedCompany || !role || !batchYear) {
      toast.error("Please fill required fields (Company, Role, Batch Year)");
      return;
    }
    setIsOptingIn(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/placement-referrals/opt-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          company: selectedCompany,
          role,
          batch_year: batchYear,
          note,
          limit,
          is_active: true
        })
      });
      if (!res.ok) throw new Error("Failed to opt in");
      const newProfile = await res.json();
      
      // Update local state (if it already exists, replace, else add)
      setReferrerProfiles(prev => {
        const exists = prev.find(p => p.company?._id === selectedCompany || p.company === selectedCompany);
        if (exists) {
          return prev.map(p => (p._id === newProfile._id ? newProfile : p));
        }
        // fetch full company details to mock populate
        const comp = companies.find(c => c._id === selectedCompany);
        return [...prev, { ...newProfile, company: comp }];
      });
      toast.success("Successfully joined the Referral Network!");
      setSelectedCompany("");
      setRole("");
      setNote("");
    } catch (e) {
      toast.error("Failed to opt in");
    } finally {
      setIsOptingIn(false);
    }
  };
  
  const toggleProfileStatus = async (profileId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      // For simplicity, we can pass the company id to the same route
      const profile = referrerProfiles.find(p => p._id === profileId);
      if (!profile) return;
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/placement-referrals/opt-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          company: profile.company._id || profile.company,
          is_active: !currentStatus
        })
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setReferrerProfiles(prev => prev.map(p => p._id === profileId ? { ...p, is_active: !currentStatus } : p));
      toast.success(currentStatus ? "Paused referrals" : "Resumed referrals");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settings/request-data-export`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-activity.json';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Data export downloaded successfully");
    } catch (e) {
      toast.error("Failed to export data");
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteEmail !== user?.email) {
      toast.error("Email does not match");
      return;
    }
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settings/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: deleteEmail })
      });
      if (!res.ok) throw new Error("Deletion failed");
      toast.success("Account anonymized successfully");
      setTimeout(() => window.location.href = "/", 1000);
    } catch (e) {
      toast.error("Failed to delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>Download a copy of your community activity and repair & maintenance requests.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExportData} disabled={exportLoading}>
                {exportLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                Download My Activity
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Placement Referral Program</CardTitle>
              <CardDescription>Opt-in to refer students for roles at your current or past companies.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProfiles ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading profiles...</div>
              ) : (
                <div className="space-y-6">
                  {referrerProfiles.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Your Active Profiles</h3>
                      <div className="grid gap-4">
                        {referrerProfiles.map(profile => (
                          <div key={profile._id} className="p-4 border rounded-lg flex justify-between items-center bg-gray-50/50">
                            <div>
                              <div className="font-bold text-lg">{profile.company?.name || 'Company'}</div>
                              <div className="text-sm text-muted-foreground">{profile.role} • Batch of {profile.batch_year}</div>
                              <div className="text-xs text-muted-foreground mt-1">Limit: {profile.limit} requests at a time</div>
                            </div>
                            <Button 
                              variant={profile.is_active ? "default" : "secondary"}
                              onClick={() => toggleProfileStatus(profile._id, profile.is_active)}
                            >
                              {profile.is_active ? "Active" : "Paused"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 border rounded-lg space-y-4 bg-primary/5">
                    <h3 className="font-semibold">Add New Referral Profile</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Company</label>
                        <select 
                          className="w-full p-2 border rounded-md"
                          value={selectedCompany}
                          onChange={e => setSelectedCompany(e.target.value)}
                        >
                          <option value="">Select a company</option>
                          {companies.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Role (e.g. SDE I)</label>
                        <Input value={role} onChange={e => setRole(e.target.value)} placeholder="Software Engineer" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Batch Year</label>
                        <Input type="number" value={batchYear} onChange={e => setBatchYear(parseInt(e.target.value) || 2024)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Max Active Requests</label>
                        <Input type="number" value={limit} onChange={e => setLimit(parseInt(e.target.value) || 5)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Note to Students (Optional)</label>
                      <Input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Happy to refer, please include your portfolio." />
                    </div>

                    <Button onClick={handleOptIn} disabled={isOptingIn || !selectedCompany || !role}>
                      {isOptingIn && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Opt-in as Referrer
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Danger Zone</CardTitle>
              <CardDescription>
                Permanently delete your account. Your community posts and comments will be retained but anonymized as "Deleted User".
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showDeleteConfirm ? (
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>Delete Account</Button>
              ) : (
                <div className="space-y-4 p-4 border rounded-lg bg-red-50/50">
                  <p className="text-sm font-medium">Please type <strong>{user?.email}</strong> to confirm.</p>
                  <Input 
                    value={deleteEmail} 
                    onChange={e => setDeleteEmail(e.target.value)} 
                    placeholder="Enter your email"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteLoading || deleteEmail !== user?.email}>
                      {deleteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Confirm Deletion
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
