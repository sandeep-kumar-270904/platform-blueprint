import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, ArrowRight, Loader2, List, LayoutGrid, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MyScholarships = () => {
  const navigate = useNavigate();
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        // Fetch both saves and apps, then merge and sort
        const [savesRes, appsRes] = await Promise.all([
            fetch(`${API_URL}/api/scholarships/saved`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/api/scholarships/applications`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        let saved = [];
        let applied = [];
        if (savesRes.ok) saved = await savesRes.json();
        if (appsRes.ok) applied = (await appsRes.json()).map((a: any) => ({ ...a.scholarshipId, applicationStatus: a.status }));

        const mergedMap = new Map();
        saved.forEach((s: any) => mergedMap.set(s._id, { ...s, applicationStatus: 'saved' }));
        applied.forEach((a: any) => {
            if (a._id) mergedMap.set(a._id, { ...mergedMap.get(a._id), ...a });
        });

        const mergedArray = Array.from(mergedMap.values());
        
        // Sort by real deadline proximity
        mergedArray.sort((a, b) => new Date(a.applicationDeadline).getTime() - new Date(b.applicationDeadline).getTime());

        setScholarships(mergedArray);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getUrgencyIndicator = (dateString: string) => {
      const days = differenceInDays(new Date(dateString), new Date());
      if (days < 0) return <Badge variant="destructive">Expired</Badge>;
      if (days === 0) return <Badge variant="destructive">Due Today!</Badge>;
      if (days <= 3) return <Badge variant="destructive" className="bg-orange-500">Due in {days} days</Badge>;
      if (days <= 14) return <Badge variant="secondary" className="text-yellow-600 bg-yellow-100">Due in {days} days</Badge>;
      return <Badge variant="outline">{days} days left</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Scholarships</h1>
                <p className="text-muted-foreground">Track your saved and active scholarship applications.</p>
            </div>
            <div className="flex bg-muted p-1 rounded-md">
                <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
                    <List className="h-4 w-4 mr-2" /> List
                </Button>
                <Button variant={viewMode === 'calendar' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('calendar')}>
                    <CalendarDays className="h-4 w-4 mr-2" /> Calendar
                </Button>
            </div>
        </div>

        {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : scholarships.length === 0 ? (
            <div className="text-center py-24 border-2 border-dashed rounded-lg bg-muted/20">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No scholarships tracked yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">You haven't saved or started any scholarship applications. Browse the directory to find opportunities.</p>
                <Button onClick={() => navigate('/scholarships')}>Browse Scholarships</Button>
            </div>
        ) : viewMode === 'list' ? (
            <div className="grid gap-4">
                {scholarships.map(sch => (
                    <Card key={sch._id} className="hover:border-primary/50 transition-colors">
                        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold">{sch.title}</h3>
                                    {getUrgencyIndicator(sch.applicationDeadline)}
                                </div>
                                <p className="text-muted-foreground text-sm">{sch.provider}</p>
                                <div className="flex items-center gap-4 text-sm mt-4">
                                    <div className="flex items-center gap-1">
                                        <CalendarIcon className="h-4 w-4" />
                                        <span>Deadline: {format(new Date(sch.applicationDeadline), 'MMM d, yyyy')}</span>
                                    </div>
                                    <Badge variant={sch.applicationStatus === 'saved' ? 'outline' : 'secondary'}>
                                        Status: {sch.applicationStatus.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </div>
                            <Button variant="default" onClick={() => navigate(`/scholarships/${sch._id}`)}>
                                View Details <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="border rounded-lg p-6 bg-card">
                {/* Simplified Calendar View Plotting */}
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" /> Timeline View
                </h3>
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {scholarships.map((sch, i) => (
                        <div key={sch._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-white font-bold text-xs">
                                {format(new Date(sch.applicationDeadline), 'd')}
                            </div>
                            <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate(`/scholarships/${sch._id}`)}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm font-bold text-primary">{format(new Date(sch.applicationDeadline), 'MMMM yyyy')}</div>
                                        {getUrgencyIndicator(sch.applicationDeadline)}
                                    </div>
                                    <h4 className="font-bold">{sch.title}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">{sch.provider}</p>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default MyScholarships;
