import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Share2, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function ShareToCircleModal({ scholarshipId }: { scholarshipId: string }) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [circles, setCircles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [sharing, setSharing] = useState<string | null>(null);
    const [sharingBuddy, setSharingBuddy] = useState(false);
    const [hasBuddy, setHasBuddy] = useState(false);

    useEffect(() => {
        if (open && user) {
            fetchCircles();
            fetchBuddyStatus();
        }
    }, [open, user]);

    const fetchBuddyStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/api/scholarship-buddies/my-pairing`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.pairing) setHasBuddy(true);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchCircles = async () => {
        setLoading(true);
        try {
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

    const handleBuddyShare = async () => {
        setSharingBuddy(true);
        try {
            const res = await fetch(`${API_URL}/api/scholarship-buddies/share`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ scholarshipId })
            });
            if (res.ok) {
                toast.success("Shared with your buddy!");
                setOpen(false);
            } else {
                toast.error("Failed to share with buddy");
            }
        } catch (err) {
            console.error(err);
            toast.error("Network error");
        } finally {
            setSharingBuddy(false);
        }
    };

    const handleShare = async (circleId: string) => {
        setSharing(circleId);
        try {
            const res = await fetch(`${API_URL}/api/scholarship-circles/${circleId}/share`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ scholarshipId })
            });
            if (res.ok) {
                toast.success("Shared with circle!");
                setOpen(false);
            } else {
                toast.error("Failed to share");
            }
        } catch (err) {
            console.error(err);
            toast.error("Network error");
        } finally {
            setSharing(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
           <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
                    <Share2 className="h-4 w-4" /> Share
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" /> Share Scholarship
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    {hasBuddy && (
                        <div className="flex justify-between items-center p-3 border rounded-md border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 transition-colors mb-4">
                            <div>
                                <h4 className="font-semibold text-sm text-indigo-900 flex items-center gap-1"><UserPlus className="w-4 h-4" /> Application Buddy</h4>
                                <p className="text-xs text-indigo-700/80">Share directly with your 1:1 accountability partner</p>
                            </div>
                            <Button size="sm" variant="default" className="bg-indigo-600 hover:bg-indigo-700" onClick={handleBuddyShare} disabled={sharingBuddy}>
                                {sharingBuddy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Share"}
                            </Button>
                        </div>
                    )}
                    <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2">Your Circles</h4>
                    {loading ? (
                        <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary/60" /></div>
                    ) : circles.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            <p>You aren't in any application circles yet.</p>
                            <Button className="mt-4" onClick={() => { setOpen(false); window.location.href='/scholarships/circles' }}>Find or Create a Circle</Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {circles.map(circle => (
                                <div key={circle._id} className="flex justify-between items-center p-3 border rounded-md hover:bg-secondary/20 transition-colors">
                                    <div>
                                        <h4 className="font-semibold text-sm">{circle.name}</h4>
                                        <p className="text-xs text-muted-foreground">{circle.memberIds?.length || 0} members</p>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        variant="secondary"
                                        onClick={() => handleShare(circle._id)}
                                        disabled={sharing === circle._id}
                                    >
                                        {sharing === circle._id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Share"}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

