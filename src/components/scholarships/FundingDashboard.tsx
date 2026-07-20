import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, AlertCircle, RefreshCw, Calculator, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SavingsGoalTracker } from "./SavingsGoalTracker";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const FundingDashboard = () => {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [strategy, setStrategy] = useState<string | null>(null);
    const [loadingStrategy, setLoadingStrategy] = useState(false);
    const [conflicts, setConflicts] = useState<any[]>([]);
    const [alternativeResources, setAlternativeResources] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await fetch(`${API_URL}/api/scholarships/my/analytics`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                let analyticsData = null;
                if (res.ok) {
                    analyticsData = await res.json();
                    setAnalytics(analyticsData);
                }
                
                const altRes = await fetch(`${API_URL}/api/scholarships/alternative-funding`);
                if (altRes.ok) {
                    setAlternativeResources(await altRes.json());
                }    
                    // Simple client-side conflict check for stacking rules
                    if (analyticsData && analyticsData.apps) {
                        const activeApps = analyticsData.apps.filter((a: any) => 
                            ['awarded', 'submitted', 'under_review'].includes(a.status) && a.scholarshipId
                        );
                        
                        const detectedConflicts: any[] = [];
                        activeApps.forEach((app1: any) => {
                            const rules1 = app1.scholarshipId.stackingRules;
                            if (!rules1) return;
                            
                            activeApps.forEach((app2: any) => {
                                if (app1._id === app2._id) return;
                                
                                // Check if rules1 explicitly excludes app2
                                if (rules1.excludedScholarshipIds?.includes(app2.scholarshipId._id)) {
                                    detectedConflicts.push({ s1: app1.scholarshipId.title, s2: app2.scholarshipId.title, reason: 'Explicitly excluded' });
                                }
                                
                                // Check if rules1 generally prohibits stacking
                                if (rules1.canCombineWithOthers === false) {
                                    detectedConflicts.push({ s1: app1.scholarshipId.title, s2: app2.scholarshipId.title, reason: 'Does not allow stacking' });
                                }
                            });
                        });
                        
                        // Deduplicate conflicts
                        const uniqueConflicts = detectedConflicts.filter((v,i,a)=>a.findIndex(t=>(t.s1 === v.s1 && t.s2===v.s2))===i);
                        setConflicts(uniqueConflicts);
                    }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const fetchStackingStrategy = async () => {
        setLoadingStrategy(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/scholarships/my/stacking-strategy`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStrategy(data.strategy);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingStrategy(false);
        }
    };

    if (loading) return <div className="h-48 flex items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
    if (!analytics) return null;

    // We can pull stored calculator context from localStorage for Phase 2 integration if it exists
    const storedCalculatorNeed = localStorage.getItem('lastCalculatedNeed');
    const needAmount = storedCalculatorNeed ? parseInt(storedCalculatorNeed) : null;

    return (
        <div className="space-y-6 mb-8">
            <SavingsGoalTracker totalAwardedFunding={analytics.totalAwarded} />
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                My Funding Dashboard
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-green-500/5 border-green-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> Secured Funding
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-700">
                            ${analytics.totalAwardedFunding?.toLocaleString() || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">From {analytics.statusCounts?.awarded || 0} awarded scholarships</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">In-Progress Potential</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-muted-foreground">
                            ${(analytics.totalPotentialFunding - analytics.totalAwardedFunding)?.toLocaleString() || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">From {analytics.statusCounts?.submitted || 0} active applications</p>
                    </CardContent>
                </Card>

                <Card className="bg-blue-500/5 border-blue-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                            <Calculator className="h-4 w-4" /> Estimated Need
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-700">
                            {needAmount !== null ? `$${needAmount.toLocaleString()}` : 'Not Calculated'}
                        </div>
                        {needAmount !== null ? (
                            <p className="text-xs text-blue-600/70 mt-1">Based on last aid calculator estimate</p>
                        ) : (
                            <Button variant="link" className="px-0 h-auto text-xs" onClick={() => window.location.href='/scholarships/calculator'}>
                                Run Calculator
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Stacking Conflicts */}
            {conflicts.length > 0 && (
                <Card className="border-amber-500/50 bg-amber-500/5">
                    <CardHeader>
                        <CardTitle className="text-amber-800 text-base flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Stacking Conflicts Detected
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-sm text-amber-700">Some of your active or awarded scholarships have conflicting stacking rules. This won't block your application on our platform, but it may affect your final external awards.</p>
                        <ul className="list-disc pl-5 text-sm text-amber-800">
                            {conflicts.map((c, i) => (
                                <li key={i}><strong>{c.s1}</strong> conflicts with <strong>{c.s2}</strong> ({c.reason})</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Gemini Strategy */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">AI Stacking Strategy</CardTitle>
                    <CardDescription>Get personalized advice on how to optimally stack your saved and applied scholarships.</CardDescription>
                </CardHeader>
                <CardContent>
                    {strategy ? (
                        <div className="prose prose-sm max-w-none text-muted-foreground bg-muted p-4 rounded-lg whitespace-pre-wrap">
                            {strategy}
                        </div>
                    ) : (
                        <Button onClick={fetchStackingStrategy} disabled={loadingStrategy}>
                            {loadingStrategy ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Analyzing Portfolio...</> : "Generate Strategy"}
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Alternative Funding Discovery */}
            {alternativeResources.length > 0 && (
                <Card className="border-blue-500/30">
                    <CardHeader>
                        <CardTitle className="text-lg text-blue-700">Alternative Funding Pathways</CardTitle>
                        <CardDescription>Curated resources to explore beyond traditional scholarships, especially if your need exceeds your current pipeline.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            {alternativeResources.map((res: any, idx: number) => (
                                <div key={idx} className="p-4 border rounded-md shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-semibold text-sm">{res.title}</h4>
                                        <span className="text-xs px-2 py-1 bg-muted rounded uppercase font-medium">{res.type.replace('-', ' ')}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3">{res.description}</p>
                                    {res.link && (
                                        <a href={res.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                            Learn more &rarr;
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
