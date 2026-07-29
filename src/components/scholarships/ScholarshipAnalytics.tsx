import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp, DollarSign, Clock, Target, AlertCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function ScholarshipAnalytics() {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/scholarships/my/analytics`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAnalytics(data);
                }
            } catch (err) {
                console.error("Failed to fetch scholarship analytics", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
    }

    if (!analytics) return null;

    const { statusCounts, totalPotentialFunding, totalAwardedFunding, averageCompletionTimeDays, mostCommonAbandonReason, whereToFocus } = analytics;

    return (
        <div className="space-y-6 mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Your Progress Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Applications Started</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statusCounts.started}</div>
                        <p className="text-xs text-muted-foreground">Drafts & opened links</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Submitted</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statusCounts.submitted}</div>
                        <p className="text-xs text-muted-foreground">Pending review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Potential Funding</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalPotentialFunding.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">From all active apps</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{averageCompletionTimeDays.toFixed(1)} days</div>
                        <p className="text-xs text-muted-foreground">From start to submit</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <Target className="h-5 w-5" />
                            Where to Focus
                        </CardTitle>
                        <CardDescription>Saved scholarships with upcoming deadlines</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {whereToFocus && whereToFocus.length > 0 ? (
                            <div className="space-y-4">
                                {whereToFocus.map((scholarship: any) => (
                                    <div key={scholarship._id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                                        <div>
                                            <p className="font-semibold text-sm">{scholarship.title}</p>
                                            <p className="text-xs text-muted-foreground">Due {new Date(scholarship.applicationDeadline).toLocaleDateString()}</p>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => navigate(`/scholarships/${scholarship._id}`)}>
                                            View <ArrowRight className="h-3 w-3 ml-1" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-4 text-sm text-muted-foreground">
                                You're all caught up! No urgent saved scholarships right now.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-muted-foreground" />
                            Insights
                        </CardTitle>
                        <CardDescription>Personalized application metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-sm text-muted-foreground">Awarded Funding</span>
                            <span className="font-bold text-green-500">${totalAwardedFunding.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-sm text-muted-foreground">Win Rate</span>
                            <span className="font-bold">
                                {statusCounts.submitted > 0 
                                    ? Math.round((statusCounts.awarded / (statusCounts.submitted + statusCounts.awarded + statusCounts.rejected)) * 100) 
                                    : 0}%
                            </span>
                        </div>
                        {mostCommonAbandonReason && (
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Most Common Barrier</span>
                                <span className="font-bold text-sm capitalize">{mostCommonAbandonReason.replace(/_/g, ' ')}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
