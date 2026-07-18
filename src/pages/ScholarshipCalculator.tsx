import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calculator, AlertTriangle, Shield, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ScholarshipCalculator = () => {
  const navigate = useNavigate();
  const [coa, setCoa] = useState<number | ''>('');
  const [efc, setEfc] = useState<number | ''>('');
  const [otherAid, setOtherAid] = useState<number | ''>('');
  
  const [savedScholarships, setSavedScholarships] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchSaves = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/scholarships/saved`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            setSavedScholarships(await res.json());
        }
      } catch (err) {
        console.error("Error fetching saves", err);
      }
    };
    fetchSaves();
  }, []);

  const cost = Number(coa) || 0;
  const contribution = Number(efc) || 0;
  const aid = Number(otherAid) || 0;
  
  const gap = Math.max(0, cost - contribution - aid);

  // Simple knapsack-like suggestion logic using saved scholarships to fill the gap
  let currentGap = gap;
  const suggested = [];
  
  // Sort saved scholarships by amount descending to minimize number of applications
  const sortedSaves = [...savedScholarships].sort((a, b) => (b.amount || 0) - (a.amount || 0));
  
  for (const sch of sortedSaves) {
      if (currentGap <= 0) break;
      if (sch.amount) {
          suggested.push(sch);
          currentGap -= sch.amount;
      }
  }

  const remainingGap = Math.max(0, currentGap);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 text-center max-w-2xl mx-auto">
            <Calculator className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold tracking-tight mb-2">Financial Need Estimator</h1>
            <p className="text-muted-foreground">Calculate your funding gap and see how your saved scholarships stack up.</p>
        </div>

        <Alert className="mb-8 max-w-4xl mx-auto bg-primary/5 border-primary/20">
            <Shield className="h-4 w-4 text-primary" />
            <AlertTitle>Strict Privacy & Ephemeral Session</AlertTitle>
            <AlertDescription className="text-sm">
                This is a calculation utility only. The financial numbers you enter here are <strong>never</strong> saved, tracked, or sent to our servers. They exist solely in your browser memory for this session.
            </AlertDescription>
        </Alert>

        <Alert variant="destructive" className="mb-8 max-w-4xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Disclaimer</AlertTitle>
            <AlertDescription className="text-sm">
                This tool provides an estimation and is not official financial aid guidance. It does not replace the Free Application for Federal Student Aid (FAFSA) or your institution's financial aid office.
            </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Enter Your Estimates</CardTitle>
                    <CardDescription>Input expected costs and aid for the academic year.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Cost of Attendance (COA)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                            <Input 
                                type="number" 
                                className="pl-7" 
                                placeholder="e.g. 50000"
                                value={coa} 
                                onChange={e => setCoa(Number(e.target.value) || '')} 
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Tuition, fees, room, board, and materials.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Expected Family Contribution (EFC) / SAI</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                            <Input 
                                type="number" 
                                className="pl-7" 
                                placeholder="e.g. 10000"
                                value={efc} 
                                onChange={e => setEfc(Number(e.target.value) || '')} 
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">The amount you and your family expect to pay.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Other Aid Secured</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                            <Input 
                                type="number" 
                                className="pl-7" 
                                placeholder="e.g. 5000"
                                value={otherAid} 
                                onChange={e => setOtherAid(Number(e.target.value) || '')} 
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Grants, institutional scholarships, or loans already secured.</p>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-8">
                <Card className="bg-primary text-primary-foreground">
                    <CardContent className="p-8 text-center">
                        <h3 className="text-lg font-medium opacity-90 mb-2">Estimated Funding Gap</h3>
                        <div className="text-5xl font-bold tracking-tighter">
                            ${gap.toLocaleString()}
                        </div>
                        <p className="text-sm opacity-80 mt-2">Cost - Contribution - Other Aid</p>
                    </CardContent>
                </Card>

                {gap > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Closing the Gap</CardTitle>
                            <CardDescription>Based on your saved scholarships</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {savedScholarships.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-muted-foreground text-sm mb-4">You haven't saved any scholarships yet.</p>
                                    <Button size="sm" variant="outline" onClick={() => navigate('/scholarships')}>Browse Scholarships</Button>
                                </div>
                            ) : suggested.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-muted-foreground text-sm mb-4">Your saved scholarships don't list explicit amounts.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm font-medium">Applying to these could cover your need:</p>
                                    {suggested.map(sch => (
                                        <div key={sch._id} className="flex justify-between items-center text-sm p-3 bg-muted rounded-md cursor-pointer hover:bg-muted/80" onClick={() => navigate(`/scholarships/${sch._id}`)}>
                                            <div className="font-semibold truncate pr-4">{sch.title}</div>
                                            <div className="text-primary font-bold shrink-0">+${sch.amount.toLocaleString()}</div>
                                        </div>
                                    ))}
                                    
                                    {remainingGap > 0 ? (
                                        <div className="pt-4 border-t flex justify-between items-center text-sm font-bold text-destructive">
                                            <span>Still Needed:</span>
                                            <span>${remainingGap.toLocaleString()}</span>
                                        </div>
                                    ) : (
                                        <div className="pt-4 border-t flex items-center text-sm font-bold text-green-600 gap-2">
                                            <CheckCircle2 className="h-4 w-4" /> Gap Fully Covered!
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipCalculator;
