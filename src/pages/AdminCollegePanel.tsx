import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Building2, Plus, Edit, Trash2, Shield, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminCollegePanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Default Form State
  const defaultForm = {
    name: "",
    location: { city: "", state: "" },
    type: "Private",
    logoOrIcon: "🏛️",
    establishedYear: 2000,
    website: "",
    fees: { tuition: 0, hostel: 0, other: 0 },
    avgPackage: "",
    highestPackage: "",
    placementPercentage: 0,
    draft: true
  };
  
  const [formData, setFormData] = useState(defaultForm);

  // We should check if user is admin. Since we don't have role explicitly in useAuth type yet, 
  // we check if it's there. Actually, the user's role might be on user.role.
  // For now, let's just assume we have user.role === 'admin' or just protect via middleware.
  
  const fetchColleges = async () => {
    try {
      const res = await fetch(`${API_URL}/api/colleges`);
      const data = await res.json();
      setColleges(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load colleges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If not admin, redirect. (Assuming user.role is how we check)
    // If auth state isn't loaded yet, wait.
    if (user && user.role !== "admin") {
      // In a real app we might redirect to "/" if not admin
      // For this demo, let's just let it load or we can enforce it if the backend returns 403
    }
    fetchColleges();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const url = editingId 
        ? `${API_URL}/api/colleges/${editingId}`
        : `${API_URL}/api/colleges`;
      
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error("Failed to save college");
      
      toast.success(`College ${editingId ? 'updated' : 'created'} successfully`);
      setOpen(false);
      fetchColleges();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/colleges/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete college");
      toast.success("College deleted");
      fetchColleges();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleDraft = async (id: string, currentDraft: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/colleges/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ draft: !currentDraft })
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success("Status updated");
      fetchColleges();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openEdit = (college: any) => {
    setFormData(college);
    setEditingId(college._id);
    setOpen(true);
  };

  const openCreate = () => {
    setFormData(defaultForm);
    setEditingId(null);
    setOpen(true);
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-12 text-center">
          <Shield className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-8 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" /> Manage Colleges
            </h1>
            <p className="text-muted-foreground mt-1">Add, edit, and moderate college insights data</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add College</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit College" : "Add New College"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>College Name *</Label>
                    <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <Input required placeholder="IIT, NIT, Private, etc" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Input required value={formData.location.city} onChange={e => setFormData({...formData, location: {...formData.location, city: e.target.value}})} />
                  </div>
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Input required value={formData.location.state} onChange={e => setFormData({...formData, location: {...formData.location, state: e.target.value}})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Established Year</Label>
                    <Input type="number" min="1800" max={new Date().getFullYear()} value={formData.establishedYear} onChange={e => setFormData({...formData, establishedYear: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Website URL</Label>
                    <Input type="url" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-4 border p-4 rounded-lg">
                  <h4 className="font-semibold text-sm">Fees (Per Year)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tuition</Label>
                      <Input type="number" min="0" required value={formData.fees.tuition} onChange={e => setFormData({...formData, fees: {...formData.fees, tuition: Number(e.target.value)}})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Hostel</Label>
                      <Input type="number" min="0" required value={formData.fees.hostel} onChange={e => setFormData({...formData, fees: {...formData.fees, hostel: Number(e.target.value)}})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Other</Label>
                      <Input type="number" min="0" required value={formData.fees.other} onChange={e => setFormData({...formData, fees: {...formData.fees, other: Number(e.target.value)}})} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label>Placement Percentage</Label>
                    <Input type="number" min="0" max="100" value={formData.placementPercentage} onChange={e => setFormData({...formData, placementPercentage: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Average Package</Label>
                    <Input placeholder="e.g. 12 LPA" value={formData.avgPackage} onChange={e => setFormData({...formData, avgPackage: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Highest Package</Label>
                    <Input placeholder="e.g. 50 LPA" value={formData.highestPackage} onChange={e => setFormData({...formData, highestPackage: e.target.value})} />
                  </div>
                  <div className="space-y-2 flex flex-col justify-end">
                    <div className="flex items-center space-x-2 border p-2 rounded-md">
                      <Switch 
                        checked={!formData.draft} 
                        onCheckedChange={(c) => setFormData({...formData, draft: !c})} 
                        id="published" 
                      />
                      <Label htmlFor="published">{!formData.draft ? "Published (Visible)" : "Draft (Hidden)"}</Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit">{editingId ? "Update College" : "Create College"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>College Database</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : colleges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No colleges found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>College</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {colleges.map((college) => (
                    <TableRow key={college._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{college.logoOrIcon}</span>
                          {college.name}
                        </div>
                      </TableCell>
                      <TableCell>{college.location?.city}, {college.location?.state}</TableCell>
                      <TableCell><Badge variant="outline">{college.type}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={college.draft ? "secondary" : "default"} className="flex w-fit items-center gap-1 cursor-pointer" onClick={() => toggleDraft(college._id, college.draft)}>
                          {college.draft ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          {college.draft ? "Draft" : "Published"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(college)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(college._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCollegePanel;
