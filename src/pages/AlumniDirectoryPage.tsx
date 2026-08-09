import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { AlumniCard } from '@/components/alumni/AlumniCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AlumniDirectoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [alumni, setAlumni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [intent, setIntent] = useState(searchParams.get('intent') || '');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [skills, setSkills] = useState('');
  const [willingToMentor, setWillingToMentor] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // If intent was passed from dashboard, we might want to map it to skills or role
    // For now we just use it as a keyword in the UI
    fetchDirectory();
  }, []);

  const fetchDirectory = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (role) params.append('role', role);
      if (company) params.append('company', company);
      if (skills) params.append('skills', skills);
      if (willingToMentor) params.append('willingToMentor', 'true');
      
      const res = await fetch(`${API_URL}/api/alumni/directory?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch alumni');
      const data = await res.json();
      setAlumni(data.alumni || []);
    } catch (err) {
      toast.error('Failed to load alumni directory');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDirectory();
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      <main className="max-w-6xl mx-auto p-4 md:p-6 mt-6 pb-20">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Discover Alumni</h1>
            <p className="text-muted-foreground mt-1">Find the right people to help you achieve your career goals.</p>
          </div>
          
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex gap-2">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-8">
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  value={intent || role}
                  onChange={(e) => {
                    setIntent(e.target.value);
                    setRole(e.target.value);
                  }}
                  placeholder="Search by role, goal, or keywords..." 
                  className="pl-9 bg-gray-50/50"
                />
              </div>
              <Button type="submit">Search</Button>
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t mt-2">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Google, Microsoft" />
                </div>
                <div className="space-y-2">
                  <Label>Skills (comma separated)</Label>
                  <Input value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. React, Python, ML" />
                </div>
                <div className="space-y-2 flex flex-col justify-center">
                  <div className="flex items-center space-x-2 mt-6">
                    <Switch 
                      id="mentorship" 
                      checked={willingToMentor}
                      onCheckedChange={setWillingToMentor}
                    />
                    <Label htmlFor="mentorship">Available for Mentorship</Label>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        ) : alumni.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alumni.map(profile => (
              <AlumniCard key={profile._id} profile={profile} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed">
            <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No alumni found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your filters to see more results.</p>
            <Button variant="outline" className="mt-4" onClick={() => {
              setRole(''); setCompany(''); setSkills(''); setWillingToMentor(false); setIntent('');
              setTimeout(fetchDirectory, 0);
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};
