import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MapPin, Briefcase, GraduationCap, Building2, UserPlus, Clock } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Candidate {
  _id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  degree?: string;
  university?: string;
  bio?: string;
  skills: { skillName: string }[];
  verifiedSkills?: { skill: string; score: number }[];
  institutionVerified?: boolean;
  matchScore: number;
  careerVisibility: {
    noticePeriod?: string;
    profileLastUpdatedForVisibility?: string;
    visiblePreferredRoles: string[];
  };
}

const CandidateSearch = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    skills: "",
    preferredRole: "",
    location: "",
    department: "",
    noticePeriod: "",
    sort: "relevance"
  });
  
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviting, setInviting] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    fetchCandidates();
    fetchMyJobs();
  }, [filters.sort]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const query = new URLSearchParams();
      if (filters.skills) query.append('skills', filters.skills);
      if (filters.preferredRole) query.append('preferredRole', filters.preferredRole);
      if (filters.location) query.append('location', filters.location);
      if (filters.department) query.append('department', filters.department);
      if (filters.noticePeriod && filters.noticePeriod !== "Any") query.append('noticePeriod', filters.noticePeriod);
      query.append('sort', filters.sort);

      const res = await fetch(`${API_URL}/api/recruiter/candidates?${query.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyJobs = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/jobs/admin/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || data);
      }
    } catch (error) {}
  };

  const fetchCandidateProfile = async (userId: string) => {
    setProfileLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/recruiter/candidates/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCandidateProfile(data);
      } else {
        toast.error("Failed to load candidate profile");
      }
    } catch (error) {
      toast.error("Error loading profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!selectedCandidate || !selectedJob) return;
    
    setInviting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/recruiter/candidates/${selectedCandidate._id}/invite`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: selectedJob,
          message: inviteMessage
        })
      });
      
      if (res.ok) {
        toast.success("Invitation sent successfully!");
        setSelectedCandidate(null);
        setInviteMessage("");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to send invite");
      }
    } catch (error) {
      toast.error("Error sending invite");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Candidate Database</h1>
              <p className="text-muted-foreground mt-1">Search and invite top students for your roles.</p>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Filters</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="skills">Skills (comma separated)</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="skills"
                          placeholder="React, Node, Python..."
                          className="pl-9"
                          value={filters.skills}
                          onChange={(e) => setFilters({...filters, skills: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Preferred Role</Label>
                      <Input
                        id="role"
                        placeholder="e.g. Frontend Developer"
                        value={filters.preferredRole}
                        onChange={(e) => setFilters({...filters, preferredRole: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="location"
                          placeholder="City or Remote"
                          className="pl-9"
                          value={filters.location}
                          onChange={(e) => setFilters({...filters, location: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="department">Department / Degree</Label>
                      <div className="relative">
                        <GraduationCap className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="department"
                          placeholder="e.g. Computer Science"
                          className="pl-9"
                          value={filters.department}
                          onChange={(e) => setFilters({...filters, department: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notice Period</Label>
                      <Select
                        value={filters.noticePeriod}
                        onValueChange={(val) => setFilters({...filters, noticePeriod: val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Notice Period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Any">Any</SelectItem>
                          <SelectItem value="Immediate">Immediate</SelectItem>
                          <SelectItem value="15 days">15 days</SelectItem>
                          <SelectItem value="30 days">30 days</SelectItem>
                          <SelectItem value="Currently a student">Currently a student</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={fetchCandidates} className="w-full">
                      <Search className="mr-2 h-4 w-4" /> Apply Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="flex justify-between items-center bg-card p-3 rounded-lg border">
              <p className="text-sm text-muted-foreground">
                Showing {candidates.length} candidates
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Sort by:</span>
                <Select value={filters.sort} onValueChange={(val) => setFilters({...filters, sort: val})}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="recentlyActive">Recently Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading candidates...</div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border">
                <h3 className="text-lg font-medium">No candidates found</h3>
                <p className="text-muted-foreground">Try adjusting your filters.</p>
              </div>
            ) : (
              candidates.map((candidate, i) => {
                const isRecentlyActive = candidate.careerVisibility?.profileLastUpdatedForVisibility 
                  && (new Date().getTime() - new Date(candidate.careerVisibility.profileLastUpdatedForVisibility).getTime()) < 14 * 24 * 60 * 60 * 1000;
                  
                return (
                  <ScrollReveal key={candidate._id} delay={i * 0.05}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={candidate.avatar_url} />
                            <AvatarFallback>{candidate.full_name?.[0] || 'S'}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-lg">{candidate.full_name || candidate.username}</h3>
                                  {candidate.institutionVerified && (
                                    <Badge className="bg-blue-500 text-white" title="Institution Verified">Verified Student</Badge>
                                  )}
                                  {isRecentlyActive && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                      Recently Active
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                  <GraduationCap className="h-4 w-4" />
                                  {candidate.degree || "Student"} {candidate.university ? `at ${candidate.university}` : ""}
                                </p>
                              </div>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  fetchCandidateProfile(candidate._id);
                                  setSelectedCandidate(candidate);
                                }}
                              >
                                View Profile
                              </Button>
                            </div>

                            {candidate.careerVisibility?.visiblePreferredRoles?.length > 0 && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Roles: </span>
                                {candidate.careerVisibility.visiblePreferredRoles.join(", ")}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-2">
                              {candidate.verifiedSkills?.map(vs => (
                                <Badge key={`v-${vs.skill}`} className="bg-green-100 text-green-800 border-green-300">
                                  {vs.skill} ✓
                                </Badge>
                              ))}
                              {candidate.skills?.filter(s => !candidate.verifiedSkills?.some(vs => vs.skill.toLowerCase() === s.skillName.toLowerCase())).slice(0, 5).map(skill => (
                                <Badge key={skill.skillName} variant="secondary">
                                  {skill.skillName}
                                </Badge>
                              ))}
                              {((candidate.skills?.length || 0) + (candidate.verifiedSkills?.length || 0)) > 5 && (
                                <Badge variant="outline">+{((candidate.skills?.length || 0) + (candidate.verifiedSkills?.length || 0)) - 5} more</Badge>
                              )}
                            </div>
                            
                            {candidate.matchScore > 0 && (
                              <div className="text-xs text-green-600 font-medium pt-1">
                                {candidate.matchScore} matching skills found
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                )
              })
            )}
          </div>
        </div>
      </main>



      <Dialog open={!!selectedCandidate} onOpenChange={(open) => !open && setSelectedCandidate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidate Profile</DialogTitle>
          </DialogHeader>
          
          {profileLoading ? (
             <div className="py-8 text-center text-muted-foreground">Loading profile...</div>
          ) : candidateProfile ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={candidateProfile.avatar_url} />
                  <AvatarFallback>{candidateProfile.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{candidateProfile.full_name}</h3>
                    {candidateProfile.institutionVerified && (
                      <Badge className="bg-blue-500 text-white" title="Institution Verified">Verified Student</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{candidateProfile.degree} {candidateProfile.university ? `@ ${candidateProfile.university}` : ""}</p>
                </div>
              </div>
              
              {candidateProfile.bio && (
                <div className="text-sm">
                  <h4 className="font-semibold mb-1">Bio</h4>
                  <p className="text-muted-foreground">{candidateProfile.bio}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-1 flex items-center gap-1"><Briefcase className="h-4 w-4"/> Preferred Roles</h4>
                  <p className="text-muted-foreground">
                    {candidateProfile.careerVisibility?.visiblePreferredRoles?.join(', ') || 'Not specified'}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1 flex items-center gap-1"><MapPin className="h-4 w-4"/> Locations</h4>
                  <p className="text-muted-foreground">
                    {candidateProfile.careerVisibility?.visiblePreferredLocations?.join(', ') || 'Not specified'}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1 flex items-center gap-1"><Clock className="h-4 w-4"/> Notice Period</h4>
                  <p className="text-muted-foreground">
                    {candidateProfile.careerVisibility?.noticePeriod || 'Not specified'}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {candidateProfile.verifiedSkills?.map((vs: any) => (
                    <Badge key={`v-${vs.skill}`} className="bg-green-100 text-green-800 border-green-300">{vs.skill} ✓</Badge>
                  ))}
                  {candidateProfile.skills?.filter((s: any) => !candidateProfile.verifiedSkills?.some((vs: any) => vs.skill.toLowerCase() === s.skillName.toLowerCase())).map((s: any) => (
                    <Badge key={s.skillName}>{s.skillName}</Badge>
                  ))}
                </div>
              </div>
              
              {candidateProfile.videoIntroUrl && (
                <div>
                  <h4 className="font-semibold mb-2">Video Pitch</h4>
                  <video 
                    controls 
                    className="w-full rounded-lg border bg-black/5 max-h-64"
                    src={candidateProfile.videoIntroUrl.startsWith('http') ? candidateProfile.videoIntroUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${candidateProfile.videoIntroUrl}`}
                  />
                </div>
              )}
              
              <div className="border-t pt-4 space-y-4">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Invite to Apply
                </h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Select Job</Label>
                    <Select value={selectedJob} onValueChange={setSelectedJob}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a job..." />
                      </SelectTrigger>
                      <SelectContent>
                        {jobs.map(job => (
                          <SelectItem key={job._id} value={job._id}>{job.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Personal Message (Optional)</Label>
                    <Textarea 
                      placeholder="Hi! I came across your profile and think you'd be a great fit for this role..."
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleInvite} disabled={inviting || !selectedJob} className="w-full">
                    {inviting ? "Sending..." : "Send Invitation"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-red-500">Could not load profile.</div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CandidateSearch;
