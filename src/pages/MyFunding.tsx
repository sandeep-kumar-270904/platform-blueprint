import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, AlertTriangle, Sparkles, TrendingUp, CheckCircle, Lightbulb, ExternalLink, Filter, Globe } from 'lucide-react';
import { FinancialAidCalculator } from '@/components/scholarships/FinancialAidCalculator';
import { PortfolioOptimizer } from '@/components/scholarships/PortfolioOptimizer';
import { SavingsGoalTracker } from '@/components/scholarships/SavingsGoalTracker';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MyFunding = () => {
  const [fundingData, setFundingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Stacking check state
  const [stackingConflicts, setStackingConflicts] = useState<any[]>([]);
  const [stackingLoading, setStackingLoading] = useState(false);
  
  // Strategy state
  const [strategy, setStrategy] = useState<string | null>(null);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [altFunding, setAltFunding] = useState<any[]>([]);
  const [altFundingLoading, setAltFundingLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Optimizer state
  const [optimization, setOptimization] = useState<string | null>(null);
  const [optimizerLoading, setOptimizerLoading] = useState(false);

  // Cached Phase 2 calculator data
  const cachedCalculatorData = React.useMemo(() => {
    try {
      const stored = sessionStorage.getItem('scholarshipCalculatorData');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/my-funding`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFundingData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStackingCheck = async () => {
    setStackingLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/my-stacking-check`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStackingConflicts(data.conflicts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStackingLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchStackingCheck();
  }, []);

  const getStrategy = async () => {
    setStrategyLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Pass calculated need if available
      const url = new URL(`${API_URL}/api/scholarships/stacking-strategy-suggestion`);
      if (cachedCalculatorData?.calculatedNeed) {
        url.searchParams.append('calculatedNeed', cachedCalculatorData.calculatedNeed.toString());
      }
      
      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setStrategy(data.suggestion);
      } else {
        toast.error('Failed to generate strategy suggestion');
      }
    } catch (err) {
      toast.error('Error generating strategy suggestion');
      } finally {
        setStrategyLoading(false);
      }
  };

  const getOptimization = async () => {
    setOptimizerLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = new URL(`${API_URL}/api/scholarships/portfolio-optimizer`);
      if (cachedCalculatorData?.calculatedNeed) {
        url.searchParams.append('calculatedNeed', cachedCalculatorData.calculatedNeed.toString());
      }
      
      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setOptimization(data.suggestion);
      } else {
        toast.error('Failed to generate portfolio optimization');
      }
    } catch (err) {
      toast.error('Error generating portfolio optimization');
    } finally {
      setOptimizerLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-primary" />
            Unified Funding Dashboard
          </h1>
          <p className="text-muted-foreground">Track your secured awards and manage pending applications.</p>
        </div>

        <div className="mb-8">
          <FinancialAidCalculator />
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <div className="space-y-8">
            <SavingsGoalTracker awardedSum={fundingData?.awardedSum || 0} />

            {/* Funding Summary */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Secured Funds */}
              <Card className="bg-green-500/10 border-green-500/20 shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-green-800 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" /> Secured Funding
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-700 dark:text-green-500">
                    ${(fundingData?.awardedSum || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-green-600/80 mt-1 font-medium">Awarded and confirmed</p>
                </CardContent>
              </Card>

              {/* Potential Funds */}
              <Card className="bg-blue-500/5 border-blue-500/20 shadow-none border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-blue-800 dark:text-blue-400 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" /> Potential Funding
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-blue-700 dark:text-blue-500">
                    ${(fundingData?.potentialSum || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-blue-600/80 mt-1">Pending decision on active applications</p>
                </CardContent>
              </Card>
            </div>

            {/* Cached Calculator Data (Context Only) */}
            {cachedCalculatorData && (
              <Card className="bg-muted/30 border-none shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Estimated Financial Need (Cached)
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">From your recent calculator session</p>
                  </div>
                  <div className="text-xl font-semibold">
                    ${(cachedCalculatorData.calculatedNeed || 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stacking Check */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Stacking & Conflicts</h3>
              
              {stackingLoading ? (
                <div className="py-4"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
              ) : stackingConflicts.length > 0 ? (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-amber-800 dark:text-amber-500">Stacking Conflict Detected</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 mb-3">
                        We detected potential conflicts between your secured/pending scholarships. Be aware that some providers do not allow stacking awards.
                      </p>
                      <ul className="space-y-2">
                        {stackingConflicts.map((conflict, idx) => (
                          <li key={idx} className="bg-white/50 dark:bg-black/20 p-2 rounded text-sm text-amber-900 dark:text-amber-200">
                            <strong>{conflict.scholarshipA}</strong> conflicts with <strong>{conflict.scholarshipB}</strong>: {conflict.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg">
                  No stacking conflicts detected between your current applications and awards.
                </p>
              )}

              {/* Strategy Suggestion */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Stacking Strategy</CardTitle>
                  <CardDescription>Get personalized advice on how to legally maximize and stack your funding without violating provider rules.</CardDescription>
                </CardHeader>
                <CardContent>
                  {!strategy ? (
                    <Button onClick={getStrategy} disabled={strategyLoading}>
                      {strategyLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Get Strategy Suggestion
                    </Button>
                  ) : (
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 text-sm whitespace-pre-wrap leading-relaxed">
                      {strategy}
                    </div>
                  )}
                  </CardContent>
                </Card>

                {/* Portfolio Optimizer */}
                <PortfolioOptimizer savedScholarships={fundingData?.applications?.map((a: any) => a.scholarshipId) || []} />
              </div>
              
              {/* Alternative Funding Section */}
              <div className="mt-12 space-y-4 pt-8 border-t">
                <div>
                  <h3 className="text-2xl font-bold">Other Funding Options</h3>
                  <p className="text-muted-foreground mt-1">Explore external resources, grants, and work-study programs curated by our admins.</p>
                </div>
                
                {fundingData?.suggestedAltFunding && fundingData.suggestedAltFunding.length > 0 && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6">
                    <h4 className="text-indigo-800 font-semibold flex items-center gap-2 mb-3">
                      <Lightbulb className="h-4 w-4" /> Suggested For Your Gap
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {fundingData.suggestedAltFunding.map((r: any) => (
                        <a key={r._id} href={r.externalUrl} target="_blank" rel="noreferrer" className="block p-3 bg-white border border-indigo-200 rounded shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-indigo-900">{r.title}</span>
                            <ExternalLink className="h-3.5 w-3.5 text-indigo-400" />
                          </div>
                          <p className="text-xs text-indigo-700/80 line-clamp-2">{r.description}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="h-4 w-4" /> Filter by Category:
                  </div>
                  <select 
                    className="text-sm border rounded-md p-1.5" 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="institutional_grant">Institutional Grant</option>
                    <option value="work_study">Work Study</option>
                    <option value="payment_plan">Payment Plan</option>
                    <option value="government_aid">Government Aid</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                {altFundingLoading ? (
                  <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {altFunding.filter(r => categoryFilter === 'all' || r.category === categoryFilter).map(r => (
                      <Card key={r._id} className="bg-slate-50/50 border-slate-200 shadow-none hover:border-slate-300 transition-colors flex flex-col">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start gap-2">
                            <CardTitle className="text-base leading-tight">{r.title}</CardTitle>
                            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-700">
                              {r.category.replace('_', ' ')}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <p className="text-sm text-muted-foreground line-clamp-3">{r.description}</p>
                        </CardContent>
                        <div className="p-4 pt-0 mt-auto">
                          <a 
                            href={r.externalUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium border border-slate-300 bg-white text-slate-700 rounded-md hover:bg-slate-50"
                          >
                            <Globe className="h-4 w-4 mr-2 text-muted-foreground" /> Learn more
                          </a>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default MyFunding;


