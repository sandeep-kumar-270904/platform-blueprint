import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/badge';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface CompanyFollow {
  _id: string;
  companyName: string;
  createdAt: string;
}

const FollowedCompanies: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [followed, setFollowed] = useState<CompanyFollow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowed();
  }, []);

  const fetchFollowed = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/companies/followed`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFollowed(data);
      }
    } catch (err) {
      console.error('Failed to fetch followed companies', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (companyName: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/companies/${encodeURIComponent(companyName)}/follow`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFollowed(followed.filter(f => f.companyName !== companyName));
        toast({
          title: "Unfollowed",
          description: `You are no longer following ${companyName}.`
        });
      }
    } catch (err) {
      console.error('Failed to unfollow', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/jobs')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Followed Companies</h1>
          <p className="text-gray-500">Companies you receive notifications for when they post new jobs.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Card key={i} className="h-32 animate-pulse" />)}
        </div>
      ) : followed.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-12 w-12 text-gray-300" />}
          title="No followed companies"
          description="Follow companies on their job postings to get notified about their future opportunities."
          action={{ label: 'Explore Jobs', onClick: () => navigate('/jobs') }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {followed.map(company => (
            <Card key={company._id} className="flex flex-col">
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">{company.companyName}</CardTitle>
                  <p className="text-xs text-gray-500">Followed since {new Date(company.createdAt).toLocaleDateString()}</p>
                </div>
              </CardHeader>
              <CardFooter className="mt-auto pt-4 border-t flex justify-between">
                <Button variant="outline" size="sm" onClick={() => navigate(`/jobs?search=${encodeURIComponent(company.companyName)}`)}>
                  View Jobs
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleUnfollow(company.companyName)}>
                  Unfollow
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowedCompanies;
