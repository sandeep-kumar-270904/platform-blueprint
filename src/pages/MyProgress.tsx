import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, DollarSign, Clock, AlertCircle, ArrowRight, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function MyProgress() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState<any>(null);
    const [focusGaps, setFocusGaps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProgress = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                // Fetch Analytics
                const resA = await fetch(`${API_URL}/api/scholarships/my-analytics`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resA.ok) {
                    setAnalytics(await resA.json());
                }

                // Fetch Focus Gaps
                const resF = await fetch(`${API_URL}/api/scholarships/focus-gaps`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resF.ok) {
                    setFocusGaps(await resF.json());
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProgress();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex justify-center items-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary/60" /></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <TrendingUp className="h-8 w-8 text-primary" /> Personal Progress Analytics
                    </h1>
                    <p className="text-muted-foreground mt-2">Track your scholarship applications, awarded funding, and discover where to focus next.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-semibold text-primary mb-1">Awarded Sum</p>
                                    <h3 className="text-3xl font-bold text-primary">${analytics?.awardedSum?.toLocaleString() || 0}</h3>
                                </div>
                                <DollarSign className="h-6 w-6 text-primary" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Potential Sum (Pending)</p>
                                    <h3 className="text-3xl font-bold text-muted-foreground">${analytics?.potentialSum?.toLocaleString() || 0}</h3>
                                </div>
                                <TrendingUp className="h-6 w-6 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Applications</p>
                                    <h3 className="text-3xl font-bold">{analytics?.totalApplications || 0}</h3>
                                </div>
                                <Target className="h-6 w-6 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Avg Time to Submit</p>
                                    <h3 className="text-3xl font-bold">{analytics?.avgTimeToSubmitDays || 0} <span className="text-base text-muted-foreground font-normal">days</span></h3>
                                </div>
                                <Clock className="h-6 w-6 text-amber-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Application Pipeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-secondary/20 rounded-md">
                                    <span className="font-medium">Drafting</span>
                                    <span className="font-bold">{analytics?.pipeline?.drafting || 0}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-md">
                                    <span className="font-medium">Under Review</span>
                                    <span className="font-bold">{analytics?.pipeline?.underReview || 0}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-green-500/10 text-green-700 dark:text-green-400 rounded-md">
                                    <span className="font-medium">Awarded</span>
                                    <span className="font-bold">{analytics?.pipeline?.awarded || 0}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-red-500/10 text-red-700 dark:text-red-400 rounded-md">
                                    <span className="font-medium">Rejected</span>
                                    <span className="font-bold">{analytics?.pipeline?.rejected || 0}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-primary" /> Where to Focus
                        </h2>
                        {focusGaps && focusGaps.length > 0 && (
                            <div className="space-y-3">
                                {focusGaps.map((gap: any, idx: number) => (
                                    <Card key={idx} className="border-primary/20 bg-primary/5 hover:shadow-md transition-shadow">
                                        <CardContent className="p-4 flex flex-col justify-between h-full">
                                            <div>
                                                <h3 className="font-bold text-sm mb-1">{gap.title}</h3>
                                                <p className="text-xs text-muted-foreground mb-3">{gap.reason}</p>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                variant="default" 
                                                className="w-full justify-between"
                                                onClick={() => gap.scholarshipId ? navigate(`/scholarships/${gap.scholarshipId}/apply`) : null}
                                            >
                                                Resume Application <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
