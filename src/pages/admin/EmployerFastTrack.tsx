import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Briefcase, Mail, Download, ArrowRight, User } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function EmployerFastTrack() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                const res = await fetch(`${API_URL}/api/employer/scholarship-fast-track-candidates`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCandidates(data);
                } else if (res.status === 403) {
                    toast.error("Unauthorized. Employer access required.");
                    navigate('/');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchCandidates();
        }
    }, [user, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex justify-center items-center h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Briefcase className="h-8 w-8 text-primary" /> Fast-Track Candidates
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            View scholarship awardees who have explicitly consented to share their profiles with your hiring team.
                        </p>
                    </div>
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" /> Export CSV
                    </Button>
                </div>

                {candidates.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-lg text-muted-foreground bg-card/50">
                        <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-bold mb-2">No candidates available</h3>
                        <p className="max-w-md mx-auto text-sm">
                            There are currently no candidates who have consented to share their profiles for your sponsored scholarships. Candidates must explicitly opt-in upon receiving an award.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {candidates.map((candidate, idx) => (
                            <Card key={idx} className="flex flex-col">
                                <CardHeader className="pb-3 border-b border-border/50">
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold overflow-hidden">
                                            {candidate.userId?.profilePicture ? (
                                                <img src={candidate.userId.profilePicture} alt={candidate.userId.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <User className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-base">{candidate.userId?.name || 'Unknown Candidate'}</p>
                                            <p className="text-xs text-muted-foreground font-normal">{candidate.userId?.email}</p>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 flex-1 space-y-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Scholarship Awarded</p>
                                        <p className="font-medium text-sm">{candidate.scholarshipId?.title}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Location</p>
                                            <p>{candidate.userId?.location || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Education</p>
                                            <p className="line-clamp-1">{candidate.userId?.institution || 'Not specified'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="p-4 border-t bg-secondary/10 flex gap-2">
                                    <Button className="w-full gap-2" variant="default" onClick={() => window.location.href=`mailto:${candidate.userId?.email}`}>
                                        <Mail className="h-4 w-4" /> Contact
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => navigate(`/profile/${candidate.userId?._id}/skills`)}>
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
