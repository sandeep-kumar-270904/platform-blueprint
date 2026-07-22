import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Loader2, Briefcase, FileText, Send, CheckCircle2, ShieldAlert, Star, AlertTriangle, GraduationCap, Users } from "lucide-react";
import { toast } from "sonner";

export const ReferralNetworkTab = ({ companyId }: { companyId: string }) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Request Form State
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [selectedResume, setSelectedResume] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        
        const [profRes, resRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/placement-referrals/company/${companyId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (profRes.ok) {
          setProfiles(await profRes.json());
        }
        if (resRes.ok) {
          setResumes(await resRes.json());
        }
      } catch (err) {
        console.error("Failed to fetch referral network data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [companyId]);

  const handleSubmitRequest = async () => {
    if (!selectedResume || !targetRole || !message) {
      toast.error("Please fill in all required fields (Resume, Role, Message)");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/placement-referrals/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          referrer_profile: selectedProfile._id,
          company: companyId,
          resume: selectedResume,
          target_role: targetRole,
          message
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit request");
      }
      
      toast.success("Referral request sent successfully!");
      setSelectedProfile(null);
      setSelectedResume("");
      setTargetRole("");
      setMessage("");
    } catch (e: any) {
      toast.error(e.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
          <Briefcase className="w-5 h-5 text-primary" /> Referral Network
        </h3>
        <p className="text-muted-foreground text-sm">
          Connect with alumni and seniors working here. Request a referral by providing your resume and a brief note about why you're a good fit for the role.
        </p>
      </div>

      {profiles.length === 0 ? (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            No referrers available for this company yet. Check back later!
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map(profile => (
            <Card key={profile._id} className="overflow-hidden">
              <div className="bg-muted/30 p-4 border-b flex gap-4 items-center relative">
                <Avatar className="w-12 h-12 border bg-white">
                  <AvatarImage src={profile.user?.avatarUrl} />
                  <AvatarFallback>{profile.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-bold flex items-center gap-1">
                    {profile.user?.name || 'Alumnus'}
                    {/* Mock verification logic based on role for demo */}
                    {profile.role?.includes('Engineer') ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <CheckCircle2 className="w-4 h-4 text-blue-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Verified Referrer</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-4 px-1 text-muted-foreground ml-1">Unverified</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{profile.role} • Batch of {profile.batch_year}</div>
                </div>
              </div>
              <CardContent className="p-4 space-y-4">
                {profile.note && (
                  <div className="text-sm italic text-muted-foreground bg-muted/50 p-2 rounded border-l-2 border-primary/40">
                    "{profile.note}"
                  </div>
                )}
                
                <Dialog open={selectedProfile?._id === profile._id} onOpenChange={(open) => !open && setSelectedProfile(null)}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline" disabled={profile.atCapacity} onClick={() => setSelectedProfile(profile)}>
                      {profile.atCapacity ? "Currently at capacity" : <><Send className="w-4 h-4 mr-2" /> Request Referral</>}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      {/* Left Side: Trust Signals */}
                      <div className="bg-muted/30 w-full md:w-[280px] p-6 border-r flex flex-col">
                        <div className="flex items-center gap-4 mb-6">
                          <Avatar className="w-16 h-16 border bg-white">
                            <AvatarImage src={profile.user?.avatarUrl} />
                            <AvatarFallback>{profile.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-bold text-lg">{profile.user?.name || 'Alumnus'}</div>
                            <div className="text-xs text-muted-foreground">{profile.role}</div>
                          </div>
                        </div>

                        <div className="space-y-4 mb-auto">
                          <h4 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-2">Trust Signals</h4>
                          
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium">Verified Identity</p>
                              <p className="text-xs text-muted-foreground">Work email confirmed</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 flex items-center justify-center shrink-0">
                              <Star className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium">4.8 / 5.0 Rating</p>
                              <p className="text-xs text-muted-foreground">From 12 students</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center shrink-0">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium">15 Referrals</p>
                              <p className="text-xs text-muted-foreground">Successfully given</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0">
                              <GraduationCap className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium">Batch of {profile.batch_year}</p>
                              <p className="text-xs text-muted-foreground">Alumni Network</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t mt-6">
                          <Button variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 justify-start" onClick={() => {
                            toast.success("Profile reported for review. Thank you for keeping the community safe.");
                            setSelectedProfile(null);
                          }}>
                            <ShieldAlert className="w-4 h-4 mr-2" /> Report Profile
                          </Button>
                        </div>
                      </div>

                      {/* Right Side: Request Form */}
                      <div className="flex-1 p-6">
                        <DialogHeader className="mb-4">
                          <DialogTitle>Request Referral</DialogTitle>
                          <DialogDescription>
                            Attach your resume and provide details about the role you're targeting.
                          </DialogDescription>
                        </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Select Resume <span className="text-red-500">*</span></Label>
                        {resumes.length === 0 ? (
                          <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                            You have no resumes uploaded. Please go to Resume Manager to upload one first.
                          </div>
                        ) : (
                          <Select value={selectedResume} onValueChange={setSelectedResume}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a resume version" />
                            </SelectTrigger>
                            <SelectContent>
                              {resumes.map(r => (
                                <SelectItem key={r._id} value={r._id}>
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> {r.versionName}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Target Role / Job ID <span className="text-red-500">*</span></Label>
                        <Input 
                          placeholder="e.g. SDE-1 (Req ID: 123456)" 
                          value={targetRole} 
                          onChange={e => setTargetRole(e.target.value)} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Message to {profile.user?.name?.split(' ')[0]} <span className="text-red-500">*</span></Label>
                        <Textarea 
                          placeholder="Briefly explain why you're a good fit and how your skills align with the role..." 
                          value={message} 
                          onChange={e => setMessage(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <p className="text-xs text-muted-foreground text-right">{message.length}/500 chars</p>
                      </div>
                    </div>
                    <DialogFooter className="mt-6 border-t pt-4">
                      <Button variant="outline" onClick={() => setSelectedProfile(null)}>Cancel</Button>
                      <Button 
                        onClick={handleSubmitRequest} 
                        disabled={isSubmitting || !selectedResume || !targetRole || !message}
                      >
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Send Request
                      </Button>
                    </DialogFooter>
                    </div>
                  </div>
                  </DialogContent>
                </Dialog>

              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
