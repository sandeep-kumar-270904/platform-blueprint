import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Upload, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

export default function AdminAlumniPanel() {
  const [queue, setQueue] = useState<any[]>([]);
  const [registry, setRegistry] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  
  // CSV Upload State
  const [selectedCollegeId, setSelectedCollegeId] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadColleges();
    loadQueue();
    loadRegistry();
  }, []);

  const loadColleges = async () => {
    try {
      const res = await fetch(`${API_URL}/api/colleges`);
      if (res.ok) {
        const data = await res.json();
        setColleges(data);
      }
    } catch (err) {
      console.error("Failed to load colleges");
    }
  };

  const loadQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/alumni/admin/queue`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error("Failed to load queue");
      const data = await res.json();
      setQueue(data);
    } catch (err) {
      toast.error("Failed to load alumni verification queue");
    } finally {
      setLoading(false);
    }
  };

  const loadRegistry = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/alumni-registry`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRegistry(data.records || []);
      }
    } catch (err) {
      console.error("Failed to load registry");
    }
  };

  const handleVerify = async (id: string, status: 'verified' | 'rejected') => {
    try {
      const res = await fetch(`${API_URL}/api/alumni/admin/${id}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ status, rejectionReason: status === 'rejected' ? rejectionReason : undefined })
      });
      
      if (!res.ok) throw new Error("Action failed");
      
      toast.success(`Alumni profile ${status}`);
      setQueue(prev => prev.filter(p => p._id !== id));
      setIsRejectModalOpen(false);
      setRejectionReason("");
    } catch (err) {
      toast.error(`Failed to ${status} profile`);
    }
  };

  const handleUploadCSV = async () => {
    if (!csvFile || !selectedCollegeId) {
      return toast.error("Please select a college and a CSV file.");
    }
    const formData = new FormData();
    formData.append("file", csvFile);
    formData.append("collegeId", selectedCollegeId);

    try {
      setUploading(true);
      const res = await fetch(`${API_URL}/api/admin/alumni-registry/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
      });
      
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      toast.success(`Upload complete! Imported: ${data.summary.imported}, Created: ${data.summary.created}, Duplicates: ${data.summary.duplicates}, Invalid: ${data.summary.invalid}`);
      setCsvFile(null);
      loadRegistry();
    } catch (err) {
      toast.error("Failed to upload CSV");
    } finally {
      setUploading(false);
    }
  };

  const handleSendInvite = async (registryId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/alumni-registry/${registryId}/invite`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send invite");
      }
      toast.success("Invitation sent successfully!");
      loadRegistry(); // Refresh to update status
    } catch (err: any) {
      toast.error(err.message || "Failed to send invite");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      <main className="max-w-6xl mx-auto p-4 md:p-6 mt-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-serif text-foreground">Alumni Management</h1>
            <p className="text-muted-foreground mt-1">Review manual registrations or import alumni via CSV.</p>
          </div>
        </div>

        <Tabs defaultValue="registry" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="registry">Alumni Registry (CSV)</TabsTrigger>
            <TabsTrigger value="queue">
              Manual Verification Queue
              {queue.length > 0 && (
                <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">{queue.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registry" className="space-y-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Import Alumni CSV
                </CardTitle>
                <CardDescription>
                  Upload a CSV file containing `full_name`, `email`, `graduation_year`, `degree`, and `branch`.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="space-y-2 flex-1">
                    <label className="text-sm font-medium">Select College</label>
                    <Select value={selectedCollegeId} onValueChange={setSelectedCollegeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a college" />
                      </SelectTrigger>
                      <SelectContent>
                        {colleges.map(c => (
                          <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="text-sm font-medium">CSV File</label>
                    <Input 
                      type="file" 
                      accept=".csv" 
                      onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
                    />
                  </div>
                  <Button onClick={handleUploadCSV} disabled={uploading || !csvFile || !selectedCollegeId}>
                    {uploading ? "Uploading..." : "Upload & Import"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Registry List */}
            <Card>
              <CardHeader>
                <CardTitle>Registry Records</CardTitle>
              </CardHeader>
              <CardContent>
                {registry.length === 0 ? (
                   <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                     No registry records found. Upload a CSV to populate.
                   </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          <th className="p-3">Name / Email</th>
                          <th className="p-3">College</th>
                          <th className="p-3">Grad Year</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registry.map(record => (
                          <tr key={record._id} className="border-t hover:bg-muted/30 transition-colors">
                            <td className="p-3">
                              <p className="font-medium">{record.fullName}</p>
                              <p className="text-xs text-muted-foreground">{record.institutionalEmail || 'N/A'}</p>
                            </td>
                            <td className="p-3">{record.collegeId?.name}</td>
                            <td className="p-3">{record.graduationYear}</td>
                            <td className="p-3">
                              <Badge variant={record.status === 'VERIFIED' ? 'default' : 'secondary'}>
                                {record.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">
                              {record.status !== 'VERIFIED' && record.institutionalEmail && (
                                <Button size="sm" variant="outline" onClick={() => handleSendInvite(record._id)}>
                                  <Mail className="w-4 h-4 mr-2" /> Send Invite
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="queue">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Pending Verifications
                </CardTitle>
                <CardDescription>
                  These users registered manually and require verification.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">Loading queue...</div>
                ) : queue.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    No pending verifications.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          <th className="p-3">User</th>
                          <th className="p-3">College</th>
                          <th className="p-3">Branch & Year</th>
                          <th className="p-3">Role</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {queue.map(profile => (
                          <tr key={profile._id} className="border-t hover:bg-muted/30 transition-colors">
                            <td className="p-3">
                              <p className="font-medium text-foreground">{profile.userId?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{profile.userId?.email}</p>
                            </td>
                            <td className="p-3">{profile.collegeId?.name}</td>
                            <td className="p-3">
                              {profile.branch} <br/> Class of {profile.graduationYear}
                            </td>
                            <td className="p-3">
                              {profile.currentRole} at {profile.currentCompany}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleVerify(profile._id, 'verified')}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                </Button>
                                
                                <Dialog open={isRejectModalOpen && selectedProfile?._id === profile._id} onOpenChange={(open) => {
                                  setIsRejectModalOpen(open);
                                  if(open) setSelectedProfile(profile);
                                }}>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="destructive">
                                      <XCircle className="w-4 h-4 mr-1" /> Reject
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Reject Verification</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <p className="text-sm text-muted-foreground">
                                        Provide a reason for rejecting {profile.userId?.full_name}'s alumni application.
                                      </p>
                                      <Textarea 
                                        placeholder="e.g. Cannot verify your employment or graduation..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                      />
                                    </div>
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
                                      <Button variant="destructive" onClick={() => handleVerify(profile._id, 'rejected')} disabled={!rejectionReason}>
                                        Confirm Rejection
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
