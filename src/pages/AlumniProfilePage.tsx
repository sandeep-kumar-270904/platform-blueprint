import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, GraduationCap, ArrowLeft, CheckCircle2, MessageSquare, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { StructuredRequestModal } from '@/components/alumni/StructuredRequestModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AlumniProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/alumni/profile/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Profile not found');
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      toast.error('Failed to load profile');
      navigate('/alumni/connections/discover');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Header />
        <div className="flex h-[60vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      <main className="max-w-4xl mx-auto p-4 md:p-6 mt-6 pb-20">
        
        <Button variant="ghost" className="mb-6 -ml-4 text-muted-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Sidebar - Core Info & Actions */}
          <div className="md:col-span-1 space-y-6">
            <Card className="border-none shadow-sm text-center pt-8 pb-6 px-6">
              <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-white shadow-sm">
                <AvatarImage src={profile.userId?.avatar_url} />
                <AvatarFallback className="text-3xl bg-primary/5 text-primary">
                  {profile.userId?.full_name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              
              <h1 className="text-2xl font-bold flex items-center justify-center gap-2 mb-1">
                {profile.userId?.full_name}
                {profile.verificationStatus === 'verified' && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </h1>
              
              {profile.currentRole && profile.currentCompany && (
                <p className="font-medium text-gray-900 mb-2">
                  {profile.currentRole} at {profile.currentCompany}
                </p>
              )}
              
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mb-6">
                <GraduationCap className="w-4 h-4" />
                {profile.collegeId?.name} • Class of {profile.graduationYear}
              </p>

              <div className="space-y-3 w-full">
                <Button className="w-full shadow-sm" onClick={() => setIsRequestModalOpen(true)}>
                  Request Guidance
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => navigate(`/alumni/connections/messages?new=${profile.userId?._id}`)}>
                    <MessageSquare className="w-4 h-4 mr-2" /> Message
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => toast.info('Booking requires an accepted connection')}>
                    <Calendar className="w-4 h-4 mr-2" /> Book
                  </Button>
                </div>
              </div>
            </Card>

            {/* Willingness / Can help with */}
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Can Help With</h3>
                <div className="flex flex-col gap-3">
                  {profile.willingness?.openToMentoring && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span className="text-sm">Long-term Mentoring</span>
                    </div>
                  )}
                  {profile.willingness?.openToQa && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm">Quick Q&A</span>
                    </div>
                  )}
                  {profile.willingness?.openToResumeReview && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm">Resume Review</span>
                    </div>
                  )}
                  {profile.willingness?.openToMockInterviews && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span className="text-sm">Mock Interviews</span>
                    </div>
                  )}
                  {profile.willingness?.openToReferrals && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                      <span className="text-sm">Job Referrals</span>
                    </div>
                  )}
                  
                  {/* If nothing is selected */}
                  {!profile.willingness?.openToMentoring && !profile.willingness?.openToQa && !profile.willingness?.openToResumeReview && !profile.willingness?.openToMockInterviews && !profile.willingness?.openToReferrals && (
                    <span className="text-sm text-muted-foreground">No specific areas listed.</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Main Content */}
          <div className="md:col-span-2 space-y-6">
            
            <Card className="border-none shadow-sm">
              <CardContent className="p-8">
                <h2 className="text-xl font-bold mb-4">About</h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  {profile.about ? (
                    <p className="whitespace-pre-wrap">{profile.about}</p>
                  ) : profile.userId?.bio ? (
                    <p className="whitespace-pre-wrap">{profile.userId.bio}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No bio provided.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-8">
                <h2 className="text-xl font-bold mb-6">Skills & Expertise</h2>
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="px-3 py-1 font-normal text-sm bg-gray-100 hover:bg-gray-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No skills listed.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-8">
                <h2 className="text-xl font-bold mb-6">Career History</h2>
                {profile.careerHistory && profile.careerHistory.length > 0 ? (
                  <div className="space-y-8">
                    {profile.careerHistory.map((job: any, idx: number) => (
                      <div key={idx} className="relative pl-8 before:absolute before:left-3 before:top-2 before:w-0.5 before:h-full before:bg-gray-200 last:before:h-0">
                        <div className="absolute left-[9px] top-2 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-white"></div>
                        <h4 className="font-bold text-gray-900">{job.role}</h4>
                        <p className="text-sm font-medium text-gray-700">{job.company}</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(job.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} 
                          {' - '}
                          {job.isCurrent ? 'Present' : new Date(job.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                        {job.description && (
                          <p className="text-sm text-gray-600 mt-2">{job.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No career history provided.</p>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </main>

      <StructuredRequestModal 
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        alumniId={profile._id}
        alumniName={profile.userId?.full_name?.split(' ')[0] || 'Alumni'}
      />
    </div>
  );
};
