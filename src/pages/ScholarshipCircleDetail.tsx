import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Users, Loader2, LogOut, CheckCircle2, Clock, Share2, Target, CalendarDays, BookOpen } from "lucide-react";
import { SharedCalendar } from "@/components/scholarships/SharedCalendar";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ScholarshipCircleDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [circle, setCircle] = useState<any>(null);
    const [aggregate, setAggregate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isLeaveOpen, setIsLeaveOpen] = useState(false);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        const fetchCircleDetails = async () => {
            try {
                const res = await fetch(`${API_URL}/api/scholarship-circles/${id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCircle(data.circle);
                    setAggregate(data.aggregate);
                } else {
                    toast.error("Failed to load circle details");
                    navigate("/scholarships/circles");
                }
            } catch (err) {
                console.error(err);
                toast.error("Network error");
            } finally {
                setLoading(false);
            }
        };
        fetchCircleDetails();
    }, [id, navigate]);

    const handleLeave = async () => {
        setLeaving(true);
        try {
            // Note: If the backend implemented 'leave', it typically is a DELETE or POST.
            const res = await fetch(`${API_URL}/api/scholarship-circles/${id}/leave`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                toast.success("Left circle successfully");
                navigate("/scholarships/circles");
            } else {
                toast.error("Failed to leave circle");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLeaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="flex justify-center items-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary/60" /></div>
        </div>
    );

    if (!circle) return null;

    const memberCount = circle.memberIds.length;
    const submittedCount = aggregate?.membersWithAtLeastOneSubmission || 0;
    const startedCount = aggregate?.membersWithAtLeastOneStarted || 0;

    return (
        <div className="min-h-screen bg-background pb-12">
            <Header />
            <div className="border-b bg-card">
                <div className="container mx-auto px-4 py-8 max-w-5xl">
                    <Button variant="ghost" onClick={() => navigate('/scholarships/circles')} className="mb-4 -ml-4 gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" /> Back to Circles
                    </Button>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">{circle.name}</h1>
                            {circle.sharedGoal && (
                                <p className="text-muted-foreground mt-2 flex items-center gap-2">
                                    <Target className="h-4 w-4" /> Goal: {circle.sharedGoal}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2 items-center">
                            <span className="text-sm font-mono bg-secondary/50 px-3 py-1.5 rounded-md">
                                Code: {circle.inviteCode}
                            </span>
                            <Dialog open={isLeaveOpen} onOpenChange={setIsLeaveOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="destructive" size="icon" title="Leave Circle">
                                        <LogOut className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Leave Circle?</DialogTitle>
                                    </DialogHeader>
                                    <p className="py-4 text-muted-foreground">Are you sure you want to leave {circle.name}? You will lose access to the shared scholarships and progress tracking.</p>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsLeaveOpen(false)}>Cancel</Button>
                                        <Button variant="destructive" onClick={handleLeave} disabled={leaving}>
                                            {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Leave Circle"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
                {/* Aggregate Progress strictly no individual data */}
                <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" /> Aggregate Progress
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6">Individual progress is kept strictly private. These stats represent the entire circle.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                                <h3 className="text-3xl font-bold">{submittedCount} <span className="text-base text-muted-foreground font-normal">/ {memberCount}</span></h3>
                                <p className="text-sm text-muted-foreground mt-1">Members Submitted</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <Clock className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                                <h3 className="text-3xl font-bold">{startedCount} <span className="text-base text-muted-foreground font-normal">/ {memberCount}</span></h3>
                                <p className="text-sm text-muted-foreground mt-1">Members Started Drafts</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <BookOpen className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                                <h3 className="text-3xl font-bold">{aggregate?.totalApplicationsStarted || 0}</h3>
                                <p className="text-sm text-muted-foreground mt-1">Total Active Applications</p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <section className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Share2 className="h-5 w-5 text-primary" /> Shared Scholarships
                        </h2>
                        {circle.sharedScholarships && circle.sharedScholarships.length > 0 ? (
                            <div className="space-y-3">
                                {circle.sharedScholarships.map((ss: any, idx: number) => {
                                    const sch = ss.scholarshipId;
                                    if (!sch) return null;
                                    return (
                                        <Card key={idx} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/scholarships/${sch._id}`)}>
                                            <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                                <div>
                                                    <h3 className="font-bold line-clamp-1">{sch.title}</h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-1">{sch.provider}</p>
                                                </div>
                                                <div className="flex gap-2 whitespace-nowrap">
                                                    <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-md">
                                                        ${sch.amount?.min === sch.amount?.max ? sch.amount?.max : `${sch.amount?.min}-${sch.amount?.max}`}
                                                    </span>
                                                    {sch.applicationDeadline && (
                                                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                                                            Due {new Date(sch.applicationDeadline).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                                <Share2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p>No scholarships shared yet.</p>
                                <p className="text-sm">Share scholarships from your dashboard to collaborate here.</p>
                            </div>
                        )}
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-primary" /> Upcoming Deadlines
                        </h2>
                        {circle.sharedScholarships && circle.sharedScholarships.length > 0 ? (
                            <SharedCalendar 
                                deadlines={circle.sharedScholarships
                                    .filter((ss: any) => ss.scholarshipId && ss.scholarshipId.applicationDeadline)
                                    .map((ss: any) => ({
                                        title: ss.scholarshipId.title,
                                        date: new Date(ss.scholarshipId.applicationDeadline),
                                        type: "Deadline"
                                    }))}
                            />
                        ) : (
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-sm text-muted-foreground text-center py-4">No deadlines to track.</p>
                                </CardContent>
                            </Card>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
