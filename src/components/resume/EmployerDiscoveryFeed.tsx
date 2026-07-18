import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Eye, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from 'react-router-dom';

export const EmployerDiscoveryFeed: React.FC = () => {
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes/discovery`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setResumes(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const handleView = async (resumeId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes/${resumeId}/discovery-view`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // In a real app, this would open a specific Recruiter Resume Viewer component.
      // For now, we simulate navigation.
      alert('Opened Candidate Profile (tracked view successfully)');
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = resumes.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.skills && r.skills.some((s:string) => s.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Talent Discovery Feed</h1>
          <p className="text-muted-foreground mt-1">
            Browse top candidates who have opted into visibility. Only verified recruiters can access this feed.
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-9" 
            placeholder="Search by title or skills..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline"><Filter className="h-4 w-4 mr-2"/> Filters</Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-12 border rounded-lg border-dashed">
          <p className="text-muted-foreground">No candidates found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(r => (
            <Card key={r._id} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant={r.isDiscoveryResume ? 'default' : 'secondary'} className="mb-2">
                    {r.isDiscoveryResume ? 'Featured Resume' : 'Default Resume'}
                  </Badge>
                </div>
                <CardTitle className="line-clamp-2 leading-tight">{r.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Candidate ID: {r.user_id._id.substring(0,8)}...
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm line-clamp-3 mb-4 text-muted-foreground">
                  {r.summary || "No summary provided."}
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {(r.skills || []).slice(0, 4).map((skill:string, i:number) => (
                    <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
                  ))}
                  {r.skills && r.skills.length > 4 && (
                    <Badge variant="outline" className="text-xs">+{r.skills.length - 4}</Badge>
                  )}
                </div>
                <div className="mt-auto pt-4 flex gap-2">
                  <Button className="w-full" onClick={() => handleView(r._id)}>
                    <Eye className="h-4 w-4 mr-2" /> View Candidate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
