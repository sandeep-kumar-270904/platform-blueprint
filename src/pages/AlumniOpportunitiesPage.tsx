import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Briefcase, MapPin, Building2, Search, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AlumniOpportunitiesPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/alumni/connections/opportunities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setJobs(await res.json());
      }
    } catch (err) {
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.company?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || 
                        (filterType === 'Internships' && job.jobType === 'internship') ||
                        (filterType === 'Full-Time' && job.jobType === 'full-time');
    return matchesSearch && matchesType;
  });

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'internship': return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
      case 'full-time': return 'bg-green-100 text-green-700 hover:bg-green-200';
      case 'part-time': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
      case 'contract': return 'bg-orange-100 text-orange-700 hover:bg-orange-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alumni Opportunities</h1>
            <p className="text-muted-foreground mt-1">Jobs, internships, and referrals exclusively posted by the alumni network.</p>
          </div>
          <Button variant="outline" onClick={() => toast.info('Go to the main Jobs Portal to post a new opportunity.')}>
            Post an Opportunity
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by role or company..." 
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['All', 'Full-Time', 'Internships'].map((type) => (
              <Button 
                key={type} 
                variant={filterType === type ? 'default' : 'outline'}
                onClick={() => setFilterType(type)}
                className={filterType !== type ? 'bg-white' : ''}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-white border rounded-xl shadow-sm">
            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No opportunities found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.map((job) => (
              <Card key={job._id} className="hover:shadow-md transition-shadow flex flex-col h-full">
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-white rounded-lg border shadow-sm flex items-center justify-center p-1">
                        {job.company?.logoUrl ? (
                          <img src={job.company.logoUrl} alt={job.company.name} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <Building2 className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg leading-tight text-gray-900">{job.title}</h3>
                        <p className="text-sm font-medium text-primary mt-0.5">{job.company?.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className={`${getJobTypeColor(job.jobType)} capitalize`}>
                      {job.jobType?.replace('-', ' ')}
                    </Badge>
                    <Badge variant="outline" className="text-gray-600 capitalize bg-gray-50 border-gray-200">
                      <MapPin className="w-3 h-3 mr-1" />
                      {job.workMode || 'Remote'}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-6 flex-1">
                    {job.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t mt-auto">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6 border">
                        <AvatarImage src={job.postedBy?.avatar_url} />
                        <AvatarFallback>{(job.postedBy?.full_name || 'A').charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        Posted by <span className="font-medium text-gray-900">{job.postedBy?.full_name?.split(' ')[0]}</span>
                      </span>
                      {job.postedBy?.isAlumni && (
                        <Badge variant="outline" className="text-[10px] px-1 h-4 bg-primary/5 text-primary border-primary/20">
                          Alumni
                        </Badge>
                      )}
                    </div>
                    
                    <Button size="sm" variant={job.applyMode === 'external' ? 'outline' : 'default'} onClick={() => {
                      if (job.applyMode === 'external') {
                        window.open(job.externalUrl, '_blank');
                      } else {
                        toast.info('In-app applications coming soon!');
                      }
                    }}>
                      {job.applyMode === 'external' ? (
                        <>Apply Externally <ExternalLink className="w-3 h-3 ml-1.5" /></>
                      ) : (
                        'Apply Now'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
