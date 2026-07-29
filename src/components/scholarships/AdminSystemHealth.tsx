import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Activity, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ConsistencyReport {
  timestamp: string;
  checks: {
    name: string;
    description: string;
    passed: boolean;
    mismatches: string[];
    affectedCount: number;
  }[];
  overallPassed: boolean;
}

export const AdminSystemHealth: React.FC = () => {
  const [report, setReport] = useState<ConsistencyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/scholarships/admin/consistency-check`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setReport(await res.json());
        toast.success("Consistency check completed");
      } else {
        setError("Failed to run consistency check");
        toast.error("Failed to run check");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-lg border">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Activity className="text-primary h-5 w-5" /> System Health</h2>
          <p className="text-sm text-muted-foreground">Run cross-phase data consistency checks to ensure data integrity.</p>
        </div>
        <Button onClick={runCheck} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
          Run Diagnostics
        </Button>
      </div>

      {loading && !report ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded border border-red-200">
          <AlertCircle className="h-5 w-5 inline mr-2" /> {error}
        </div>
      ) : report ? (
        <div className="space-y-4">
          {report.checks.map((check, idx) => (
            <Card key={idx} className={check.passed ? 'border-green-200' : 'border-red-200'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {check.passed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                  {check.name}
                </CardTitle>
                <CardDescription>{check.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {!check.passed && (
                  <div className="mt-2">
                    <p className="font-semibold text-red-600 text-sm mb-2">{check.affectedCount} issue(s) detected:</p>
                    <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                      {check.mismatches.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {check.passed && (
                  <p className="text-sm text-green-700 bg-green-50 p-2 rounded inline-block mt-2">All records consistent.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
};
