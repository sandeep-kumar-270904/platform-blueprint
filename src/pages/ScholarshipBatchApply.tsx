import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ScholarshipBatchApply = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const idsParam = searchParams.get('ids');
  
  const [compatible, setCompatible] = useState<any[]>([]);
  const [divergent, setDivergent] = useState<{ scholarship: any, reason: string }[]>([]);
  const [flags, setFlags] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{ id: string, success: boolean, reason?: string }[]>([]);

  const [sharedResponses, setSharedResponses] = useState({
    firstGeneration: false,
    lgbtq: false,
    disability: false
  });
  
  const [divergentResponses, setDivergentResponses] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    if (!idsParam) return navigate('/scholarships');
    
    const fetchBatchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const ids = idsParam.split(',');
        
        const res = await fetch(`${API_URL}/api/scholarships/batch-check-compatibility`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ scholarshipIds: ids })
        });
        
        if (res.ok) {
          const data = await res.json();
          setCompatible(data.compatible || []);
          setDivergent(data.divergent || []);
          setFlags(data.flags || 'No flags.');
        } else {
          toast.error("Failed to load batch data");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBatchData();
  }, [idsParam, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${API_URL}/api/scholarships/batch-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          compatibleIds: compatible.map(s => s._id),
          divergentData: divergent.map(d => ({
            id: d.scholarship._id,
            responses: divergentResponses[d.scholarship._id] || {}
          })),
          sharedResponses,
          fastTrackOptIn: false
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        toast.success("Batch processing complete");
      } else {
        toast.error("Failed to submit batch");
      }
    } catch (err) {
      toast.error("An error occurred during batch submission");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDivergentChange = (scholarshipId: string, fieldKey: string, value: string) => {
    setDivergentResponses(prev => ({
      ...prev,
      [scholarshipId]: {
        ...(prev[scholarshipId] || {}),
        [fieldKey]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Batch Apply</h1>
        <p className="text-muted-foreground mb-8">Apply to multiple compatible scholarships at once.</p>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : results.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Submission Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {compatible.concat(divergent.map(d => d.scholarship)).map(sch => {
                const result = results.find(r => r.id === sch._id);
                const isSuccess = result?.success;
                return (
                  <div key={sch._id} className="flex flex-col justify-center p-4 border rounded-lg bg-card">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{sch.title}</span>
                      {isSuccess ? (
                        <span className="flex items-center text-green-600 font-semibold"><CheckCircle2 className="h-4 w-4 mr-1"/> Success</span>
                      ) : (
                        <span className="flex items-center text-red-600 font-semibold"><AlertCircle className="h-4 w-4 mr-1"/> Failed</span>
                      )}
                    </div>
                    {!isSuccess && result?.reason && (
                      <div className="mt-2 text-sm text-red-500 bg-red-500/10 p-2 rounded">
                        {result.reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate('/scholarships/my-scholarships')} className="w-full">
                Go to My Scholarships
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-amber-500/50 bg-amber-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-amber-600 text-lg">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Gemini Requirements Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{flags}</p>
              </CardContent>
            </Card>

            {compatible.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Compatible Scholarships ({compatible.length})</CardTitle>
                  <CardDescription>These applications share identical core requirements.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {compatible.map(sch => (
                    <div key={sch._id} className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
                      <span className="font-medium">{sch.title}</span>
                      <span className="text-xs text-muted-foreground">{sch.provider}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Consolidated Demographics</CardTitle>
                <CardDescription>This information will be shared across all selected applications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="firstGen" 
                    checked={sharedResponses.firstGeneration}
                    onCheckedChange={(c) => setSharedResponses(prev => ({...prev, firstGeneration: !!c}))}
                  />
                  <Label htmlFor="firstGen" className="text-sm">I am a First-Generation College Student</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="lgbtq" 
                    checked={sharedResponses.lgbtq}
                    onCheckedChange={(c) => setSharedResponses(prev => ({...prev, lgbtq: !!c}))}
                  />
                  <Label htmlFor="lgbtq" className="text-sm">I identify as LGBTQ+</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="disability" 
                    checked={sharedResponses.disability}
                    onCheckedChange={(c) => setSharedResponses(prev => ({...prev, disability: !!c}))}
                  />
                  <Label htmlFor="disability" className="text-sm">I have a registered disability</Label>
                </div>
              </CardContent>
            </Card>

            {divergent.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mt-8 mb-4">Divergent Requirements</h2>
                {divergent.map((div) => (
                  <Card key={div.scholarship._id} className="border-primary/30">
                    <CardHeader>
                      <CardTitle className="text-lg">{div.scholarship.title}</CardTitle>
                      <CardDescription className="bg-amber-500/10 text-amber-700 p-2 rounded flex items-start gap-2 mt-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{div.reason}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {div.scholarship.inAppRequirements?.map((req: any) => (
                        <div key={req.fieldKey} className="space-y-2">
                          <Label>{req.label}</Label>
                          {req.essayPromptText && (
                            <p className="text-sm text-muted-foreground italic mb-2">{req.essayPromptText}</p>
                          )}
                          <Textarea 
                            placeholder="Write your response here..."
                            value={divergentResponses[div.scholarship._id]?.[req.fieldKey] || ''}
                            onChange={(e) => handleDivergentChange(div.scholarship._id, req.fieldKey, e.target.value)}
                            className="min-h-[100px]"
                          />
                        </div>
                      ))}
                      {(!div.scholarship.inAppRequirements || div.scholarship.inAppRequirements.length === 0) && (
                        <div className="space-y-2">
                          <Label>Additional Essay</Label>
                          <Textarea 
                            placeholder="Write your response here..."
                            value={divergentResponses[div.scholarship._id]?.['essay'] || ''}
                            onChange={(e) => handleDivergentChange(div.scholarship._id, 'essay', e.target.value)}
                            className="min-h-[100px]"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="pt-6">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Submit {compatible.length + divergent.length} Applications <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ScholarshipBatchApply;
