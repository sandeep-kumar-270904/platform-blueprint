import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Users, ArrowRight, Link, Loader2, Target, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function MyCircles() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [circles, setCircles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', sharedGoal: '' });
    const [createdCode, setCreatedCode] = useState('');

    const [isJoinOpen, setIsJoinOpen] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joinError, setJoinError] = useState('');

    const fetchCircles = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/scholarship-circles`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCircles(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchCircles();
    }, [user]);

    const handleCreate = async () => {
        if (!createForm.name) {
            toast.error("Name is required");
            return;
        }
        try {
            const res = await fetch(`${API_URL}/api/scholarship-circles`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(createForm)
            });
            
            if (res.ok) {
                const data = await res.json();
                setCreatedCode(data.inviteCode);
                fetchCircles();
                toast.success("Circle created successfully!");
            } else {
                toast.error("Failed to create circle");
            }
        } catch (err) {
            console.error(err);
            toast.error("Network error");
        }
    };

    const handleJoin = async () => {
        setJoinError('');
        if (!joinCode) return;
        try {
            const res = await fetch(`${API_URL}/api/scholarship-circles/join`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ inviteCode: joinCode })
            });
            
            if (res.ok) {
                toast.success("Joined circle successfully!");
                setIsJoinOpen(false);
                setJoinCode('');
                fetchCircles();
            } else {
                const errorData = await res.json();
                setJoinError(errorData.message || "Failed to join circle");
            }
        } catch (err) {
            console.error(err);
            setJoinError("Network error");
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(createdCode);
        toast.success("Copied to clipboard!");
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Users className="h-8 w-8 text-primary" /> My Circles
                        </h1>
                        <p className="text-muted-foreground mt-2">Team up with peers, share scholarships, and track progress together securely.</p>
                    </div>
                    <div className="flex gap-2">
                        <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Link className="h-4 w-4" /> Join Circle
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Join a Circle</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label>Invite Code</Label>
                                        <Input 
                                            value={joinCode} 
                                            onChange={e => { setJoinCode(e.target.value); setJoinError(''); }}
                                            placeholder="Enter 6-character code" 
                                            className="uppercase"
                                        />
                                        {joinError && <p className="text-sm text-red-500">{joinError}</p>}
                                    </div>
                                    <Button onClick={handleJoin} className="w-full">Join</Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2" onClick={() => setCreatedCode('')}>
                                    <Plus className="h-4 w-4" /> Create Circle
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create Application Circle</DialogTitle>
                                </DialogHeader>
                                {!createdCode ? (
                                    <div className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <Label>Circle Name</Label>
                                            <Input 
                                                value={createForm.name} 
                                                onChange={e => setCreateForm({...createForm, name: e.target.value})} 
                                                placeholder="e.g., Computer Science 2027" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Shared Goal (Optional)</Label>
                                            <Input 
                                                value={createForm.sharedGoal} 
                                                onChange={e => setCreateForm({...createForm, sharedGoal: e.target.value})} 
                                                placeholder="e.g., Apply to 10 scholarships this month" 
                                            />
                                        </div>
                                        <Button onClick={handleCreate} className="w-full">Create Circle</Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 pt-4 text-center">
                                        <ShieldCheck className="h-12 w-12 mx-auto text-green-500 mb-2" />
                                        <h3 className="text-lg font-bold">Circle Created!</h3>
                                        <p className="text-muted-foreground text-sm">Share this invite code with your peers. (Max 6 members)</p>
                                        <div className="flex items-center gap-2 max-w-sm mx-auto mt-4">
                                            <Input readOnly value={createdCode} className="text-center font-mono text-lg tracking-wider" />
                                            <Button onClick={copyToClipboard} variant="secondary">Copy</Button>
                                        </div>
                                        <Button className="w-full mt-4" onClick={() => setIsCreateOpen(false)}>Done</Button>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary/60" /></div>
                ) : circles.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-lg bg-card/50">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <h3 className="font-semibold text-lg mb-1">No circles yet</h3>
                        <p className="mb-4 text-sm max-w-md mx-auto">Application Circles let you track aggregate progress with friends without exposing your private application materials or exact financial details.</p>
                        <Button onClick={() => setIsCreateOpen(true)} variant="outline">Create a Circle</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {circles.map((circle) => (
                            <Card key={circle._id} className="hover:shadow-md transition-shadow cursor-pointer flex flex-col" onClick={() => navigate(`/scholarships/circles/${circle._id}`)}>
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-start">
                                        <span className="line-clamp-1">{circle.name}</span>
                                    </CardTitle>
                                    {circle.sharedGoal && (
                                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                            <Target className="h-3 w-3" /> {circle.sharedGoal}
                                        </p>
                                    )}
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="flex -space-x-2 overflow-hidden mb-3">
                                        {circle.memberIds.slice(0, 5).map((m: any, i: number) => (
                                            <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-secondary flex items-center justify-center text-xs font-bold" title={m.name}>
                                                {m.profilePicture ? (
                                                    <img src={m.profilePicture} alt={m.name} className="h-full w-full rounded-full object-cover" />
                                                ) : (
                                                    m.name?.charAt(0) || 'U'
                                                )}
                                            </div>
                                        ))}
                                        {circle.memberIds.length > 5 && (
                                            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-secondary flex items-center justify-center text-xs font-bold">
                                                +{circle.memberIds.length - 5}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {circle.memberIds.length} / 6 members
                                    </p>
                                </CardContent>
                                <CardFooter className="pt-0 justify-between items-center border-t px-6 py-3 bg-secondary/10">
                                    <span className="text-xs text-muted-foreground font-mono">Code: {circle.inviteCode}</span>
                                    <ArrowRight className="h-4 w-4 text-primary" />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
