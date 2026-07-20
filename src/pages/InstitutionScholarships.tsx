import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, ArrowRight, Building, CheckCircle2, Clock, XCircle, Users, BookOpen, Trophy, RefreshCw, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const InstitutionScholarships = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [scholarships, setScholarships] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ title: '', provider: '', amount: '', totalPoolAmount: '' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const fetchInstitutionData = async () => {
            const token = localStorage.getItem('token');
            if (!token || !user?.institutionId) return;
            try {
                // Fetch Scholarships
                const resSch = await fetch(`${API_URL}/api/scholarships/institution/my-scholarships`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resSch.ok) {
                    const data = await resSch.json();
                    setScholarships(data);
                }

                // Fetch Analytics
                const resAnal = await fetch(`${API_URL}/api/institutions/${user.institutionId}/scholarship-analytics`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resAnal.ok) {
                    const analData = await resAnal.json();
                    setAnalytics(analData);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (user?.institutionId) {
            fetchInstitutionData();
        } else {
            setLoading(false);
        }
    }, [user]);


    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>;
            case 'pending':
                return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Under Review</Badge>;
            case 'rejected':
                return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Needs Revision</Badge>;
            case 'archived':
                return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Archived</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const handleRelaunch = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/scholarships/${id}/relink-cycle`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Scholarship relaunched successfully");
                window.location.reload();
            } else {
                toast.error("Failed to relaunch scholarship");
            }
        } catch (err) {
            toast.error("Error relaunching scholarship");
        }
    };

    const handleCreate = async () => {
        if (!createForm.title || !createForm.amount || !createForm.totalPoolAmount) {
            toast.error("Please fill required fields");
            return;
        }
        setCreating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/institutions/${user?.institutionId}/scholarships/pooled`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...createForm,
                    provider: user?.institutionId?.name || "Institution Name", // Usually we fetch the org name but keeping simple
                    amount: { min: Number(createForm.amount), max: Number(createForm.amount) },
                    totalPoolAmount: Number(createForm.totalPoolAmount),
                    applicationMode: 'in_app',
                    inAppRequirements: [{ type: 'essay', label: 'Why do you deserve this scholarship?', fieldKey: 'essay_1', required: true }]
                })
            });
            if (res.ok) {
                toast.success('Scholarship created successfully');
                setIsCreateOpen(false);
                window.location.reload();
            } else {
                toast.error('Failed to create scholarship');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Building className="h-8 w-8 text-primary" /> Institution Portal
                        </h1>
                        <p className="text-muted-foreground mt-1">Manage your scholarships and track applications.</p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" /> Fast-Path Create
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Pooled Scholarship</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Scholarship Title</Label>
                                    <Input value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})} placeholder="e.g. CS Excellence Grant" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Award per Student ($)</Label>
                                        <Input type="number" value={createForm.amount} onChange={e => setCreateForm({...createForm, amount: e.target.value})} placeholder="1000" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Total Pool Funding ($)</Label>
                                        <Input type="number" value={createForm.totalPoolAmount} onChange={e => setCreateForm({...createForm, totalPoolAmount: e.target.value})} placeholder="10000" />
                                    </div>
                                </div>
                                <Button onClick={handleCreate} disabled={creating} className="w-full">
                                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Launch Scholarship'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Students</p>
                                        <h3 className="text-3xl font-bold">{analytics.studentCount || 0}</h3>
                                    </div>
                                    <Users className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Bookmarks</p>
                                        <h3 className="text-3xl font-bold">{analytics.savedCount || 0}</h3>
                                    </div>
                                    <BookOpen className="h-5 w-5 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Applications</p>
                                        <h3 className="text-3xl font-bold">{analytics.appliedCount || 0}</h3>
                                    </div>
                                    <Plus className="h-5 w-5 text-purple-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Awarded</p>
                                        <h3 className="text-3xl font-bold">{analytics.awardedCount || 0}</h3>
                                    </div>
                                    <Trophy className="h-5 w-5 text-amber-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Your Scholarships</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                            </div>
                        ) : scholarships.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                                <Building className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <h3 className="font-semibold text-lg mb-1">No scholarships yet</h3>
                                <p className="mb-4 text-sm">Post a scholarship for your institution to attract the best talent.</p>
                                <Button onClick={() => navigate('/scholarships/submit')} variant="outline">
                                    Create Your First Scholarship
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Deadline</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Views</TableHead>
                                        <TableHead>Apps</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {scholarships.map((s) => (
                                        <TableRow key={s._id}>
                                            <TableCell className="font-medium">{s.title}</TableCell>
                                            <TableCell>
                                                {s.amountType === 'fixed' ? `$${s.amount.min?.toLocaleString()}` : 
                                                 s.amountType === 'range' ? `$${s.amount.min?.toLocaleString()} - $${s.amount.max?.toLocaleString()}` : 
                                                 s.amountType === 'full_tuition' ? 'Full Tuition' : 'Varies'}
                                            </TableCell>
                                            <TableCell>{new Date(s.applicationDeadline).toLocaleDateString()}</TableCell>
                                            <TableCell>{getStatusBadge(s.status)}</TableCell>
                                            <TableCell>{s.viewCount || 0}</TableCell>
                                            <TableCell>{s.applicationCount || 0}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {s.status === 'archived' && (
                                                        <Button variant="outline" size="sm" onClick={() => handleRelaunch(s._id)}>
                                                            <RefreshCw className="h-3 w-3 mr-1" /> Relaunch
                                                        </Button>
                                                    )}
                                                    {s.status === 'published' && s.totalPoolAmount > 0 && (
                                                        <Button variant="outline" size="sm" onClick={() => navigate(`/institution/scholarships/${s._id}/allocation`)}>
                                                            <Coins className="h-3 w-3 mr-1" /> Allocate
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => navigate(`/scholarships/${s._id}`)}>
                                                        View <ArrowRight className="h-3 w-3" />
                                                    </Button>
                                                </div>
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

export default InstitutionScholarships;
