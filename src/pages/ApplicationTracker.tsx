import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Trash2, Calendar, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/lib/api";

const STATUSES = ['Planning to Apply', 'Applied', 'Waitlisted', 'Accepted', 'Rejected', 'Enrolled'];
const STATUS_COLORS: Record<string, string> = {
  'Planning to Apply': 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  'Applied': 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
  'Waitlisted': 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
  'Accepted': 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
  'Rejected': 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
  'Enrolled': 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
};

const ApplicationTracker = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editApp, setEditApp] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [appliedDate, setAppliedDate] = useState('');
  const [decisionDate, setDecisionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/college-applications');
      setApplications(res.data);
    } catch (err) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (app: any) => {
    setEditApp(app);
    setStatus(app.status || 'Planning to Apply');
    setAppliedDate(app.appliedDate ? app.appliedDate.split('T')[0] : '');
    setDecisionDate(app.decisionDate ? app.decisionDate.split('T')[0] : '');
    setNotes(app.notes || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editApp) return;

    setSaving(true);
    try {
      const res = await api.post('/college-applications', {
        collegeId: editApp.collegeId._id,
        status,
        appliedDate: appliedDate || null,
        decisionDate: decisionDate || null,
        notes
      });
      
      setApplications(prev => prev.map(a => a._id === res.data._id ? res.data : a));
      toast.success('Application updated');
      setEditApp(null);
    } catch (err) {
      toast.error('Failed to update application');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    try {
      await api.delete(`/college-applications/${id}`);
      setApplications(prev => prev.filter(a => a._id !== id));
      toast.success('Application deleted');
    } catch (err) {
      toast.error('Failed to delete application');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <p className="text-xl font-bold">Please login to view your application tracker.</p>
        </div>
      </div>
    );
  }

  // Group applications by status
  const groupedApps: Record<string, any[]> = {};
  STATUSES.forEach(s => groupedApps[s] = []);
  applications.forEach(app => {
    if (groupedApps[app.status]) {
      groupedApps[app.status].push(app);
    } else {
      groupedApps['Planning to Apply'].push(app);
    }
  });

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Application Tracker</h1>
            <p className="text-muted-foreground mt-2">Manage and track all your college applications in one place.</p>
          </div>
          <Link to="/college-insights">
            <Button><Plus className="mr-2 h-4 w-4" /> Add College</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading tracker...</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
            <h3 className="text-2xl font-bold mb-2">No Applications Yet</h3>
            <p className="text-muted-foreground mb-6">Start exploring colleges to add them to your tracker.</p>
            <Link to="/college-insights">
              <Button>Explore Colleges</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {STATUSES.map(statusCol => (
              <div key={statusCol} className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold">{statusCol}</h3>
                  <Badge variant="outline" className="bg-muted">{groupedApps[statusCol].length}</Badge>
                </div>
                
                <div className="flex flex-col gap-3 min-h-[200px]">
                  {groupedApps[statusCol].map(app => (
                    <Card key={app._id} className="shadow-sm border-border cursor-pointer hover:border-primary/50 transition-colors" onClick={() => openEditModal(app)}>
                      <CardContent className="p-4 flex flex-col gap-3 relative group">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-sm shrink-0">
                              {app.collegeId.logoOrIcon || "🏛️"}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm leading-tight line-clamp-2">{app.collegeId.name}</h4>
                            </div>
                          </div>
                        </div>

                        <Badge className={`w-fit text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 ${STATUS_COLORS[app.status]}`} variant="secondary">
                          {app.status}
                        </Badge>
                        
                        {(app.appliedDate || app.decisionDate) && (
                          <div className="text-xs text-muted-foreground flex flex-col gap-1 mt-1">
                            {app.appliedDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> 
                                <span>Applied: {new Date(app.appliedDate).toLocaleDateString()}</span>
                              </div>
                            )}
                            {app.decisionDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-warning" /> 
                                <span>Decision: {new Date(app.decisionDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {app.notes && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 border-t pt-2 mt-1">
                            <FileText className="w-3 h-3" /> Has Notes
                          </div>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive transition-opacity bg-background/80"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(app._id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {groupedApps[statusCol].length === 0 && (
                    <div className="h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editApp} onOpenChange={(open) => !open && setEditApp(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Application</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            {editApp && (
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xl shrink-0">
                  {editApp.collegeId.logoOrIcon || "🏛️"}
                </div>
                <h3 className="font-bold text-lg leading-tight">{editApp.collegeId.name}</h3>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Applied Date</Label>
                <Input type="date" value={appliedDate} onChange={e => setAppliedDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Decision Date</Label>
                <Input type="date" value={decisionDate} onChange={e => setDecisionDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea 
                placeholder="Interview details, portal login, requirements..." 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                rows={4}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditApp(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationTracker;
