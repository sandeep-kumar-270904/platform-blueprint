import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlayCircle, Clock } from "lucide-react";
import axios from "axios";

export const OASimulationTab = ({ companyId, companyName }: { companyId: string, companyName: string }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [definition, setDefinition] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [defRes, histRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/oa/company/${companyId}`, { headers }).catch(() => ({ data: null })),
          axios.get(`http://localhost:5000/api/oa/history/${companyId}`, { headers })
        ]);
        
        setDefinition(defRes.data);
        setHistory(histRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [companyId]);

  const handleStart = async () => {
    if (!definition) return;
    setStarting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`http://localhost:5000/api/oa/start/${definition._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/placement/oa/simulate/${res.data._id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to start OA Simulation. Please try again.");
      setStarting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  if (!definition) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground mb-2">No OA Simulation Available</h3>
          <p>We don't currently have the Official OA pattern data for {companyName}.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-bold">{definition.name}</h3>
            <p className="text-muted-foreground max-w-xl">{definition.description}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
              <Badge variant="secondary" className="text-sm"><Clock className="w-4 h-4 mr-1"/> {definition.totalDurationMinutes} mins total</Badge>
              {definition.sections.map((s:any, i:number) => (
                <span key={i} className="text-sm font-medium border rounded px-2 py-1 bg-background">{s.type} Section</span>
              ))}
            </div>
          </div>
          <div className="shrink-0 text-center">
            <Button size="lg" className="w-full md:w-auto h-14 text-lg px-8" onClick={handleStart} disabled={starting}>
              {starting ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <PlayCircle className="w-5 h-5 mr-2"/>}
              Start Simulation
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Requires uninterrupted 90 mins</p>
          </div>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader><h3 className="text-lg font-bold">Past Attempts</h3></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map((h, i) => (
                <div key={i} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium">Attempt on {new Date(h.endTime).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">Time taken: {Math.floor(h.timeSpentSeconds / 60)} mins</p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="font-bold text-lg text-primary">{h.overallScore} / {h.maxScore}</p>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/placement/oa/results/${h._id}`)}>View Results</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
