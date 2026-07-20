import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, ArrowRight, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface OptimizerResult {
  scholarshipId: string;
  priority: number;
  rationale: string;
}

export const PortfolioOptimizer = ({ savedScholarships }: { savedScholarships: any[] }) => {
  const [optimizing, setOptimizing] = useState(false);
  const [results, setResults] = useState<OptimizerResult[]>([]);
  const navigate = useNavigate();

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const token = localStorage.getItem('token');
      // For demo purposes, we will pass a static financial need. 
      // In a real scenario, this would come from the user's saved calculator profile.
      const financialNeed = '$15,000 / year'; 
      
      const res = await fetch(`${API_URL}/api/scholarships/my/portfolio-optimizer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          savedScholarshipIds: savedScholarships.map(s => s._id),
          financialNeed
        })
      });
      if (res.ok) {
        setResults(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOptimizing(false);
    }
  };

  if (savedScholarships.length < 2) {
    return null; // Don't show if not enough to optimize
  }

  return (
    <Card className="mb-8 border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <TrendingUp className="h-5 w-5" />
          Portfolio Optimizer
        </CardTitle>
        <CardDescription>
          Use AI to analyze your saved scholarships and historical competition data to suggest a prioritized application plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <Button onClick={handleOptimize} disabled={optimizing} className="w-full sm:w-auto font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 shadow-md hover:shadow-lg">
            {optimizing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing Portfolio...</>
            ) : (
              <><Zap className="w-4 h-4 mr-2 text-yellow-300" /> Generate Strategy</>
            )}
          </Button>
        ) : (
          <div className="space-y-4 mt-4">
            {results.map((rec, idx) => {
              const schol = savedScholarships.find(s => s._id === rec.scholarshipId);
              if (!schol) return null;
              return (
                <div key={rec.scholarshipId} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-background rounded-lg border">
                  <div className="flex-1 mb-4 md:mb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={idx === 0 ? 'default' : 'secondary'}>Priority {rec.priority}</Badge>
                      <h4 className="font-bold text-lg">{schol.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.rationale}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/scholarships/${schol._id}`)}>
                    Review <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              );
            })}
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setResults([])}>
              Reset Strategy
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
