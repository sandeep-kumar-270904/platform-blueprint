import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, GraduationCap, Users, Search, Filter, ShieldCheck, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { ConnectionRequestDialog } from './ConnectionRequestDialog';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface CollegeAlumniDirectoryProps {
  collegeId: string;
}

export const CollegeAlumniDirectory = ({ collegeId }: CollegeAlumniDirectoryProps) => {
  const { user } = useAuth();
  const [alumni, setAlumni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  
  const [selectedAlumni, setSelectedAlumni] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [willingToMentor, setWillingToMentor] = useState(false);
  const [willingForQa, setWillingForQa] = useState(false);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (branchFilter) params.append('branch', branchFilter);
      if (yearFilter) params.append('gradYear', yearFilter);
      if (willingToMentor) params.append('willingToMentor', 'true');
      if (willingForQa) params.append('willingForQa', 'true');
      
      const headers: Record<string, string> = {};
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/alumni/colleges/${collegeId}?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAlumni(data.alumni);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumni();
  }, [collegeId, branchFilter, yearFilter, willingToMentor, willingForQa]);

  const filteredAlumni = alumni.filter(a => {
    if (!searchTerm) return true;
    const nameMatch = a.userId?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const roleMatch = a.currentRole?.toLowerCase().includes(searchTerm.toLowerCase());
    const companyMatch = a.currentCompany?.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || roleMatch || companyMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-lg border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search alumni by name, role, or company..." 
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Input 
          placeholder="Branch..." 
          className="w-full md:w-40 bg-background"
          value={branchFilter}
          onChange={e => setBranchFilter(e.target.value)}
        />
        <Input 
          placeholder="Grad Year..." 
          className="w-full md:w-32 bg-background"
          type="number"
          value={yearFilter}
          onChange={e => setYearFilter(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-6 px-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="mentor" 
            checked={willingToMentor} 
            onCheckedChange={(checked) => setWillingToMentor(checked as boolean)} 
          />
          <Label htmlFor="mentor" className="cursor-pointer">Open to 1:1 Mentoring</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="qa" 
            checked={willingForQa} 
            onCheckedChange={(checked) => setWillingForQa(checked as boolean)} 
          />
          <Label htmlFor="qa" className="cursor-pointer">Open to Q&A</Label>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <Card key={i} className="animate-pulse h-48 bg-muted/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlumni.map(alum => {
            const isPrivate = alum.visibility === 'private';
            const name = isPrivate ? "Anonymous Alumni" : alum.userId?.full_name;
            const role = isPrivate ? "Private Role" : (alum.currentRole || "Alumni");
            const company = isPrivate ? "Private Company" : alum.currentCompany;
            const avatar = isPrivate ? "" : alum.userId?.avatar_url;

            return (
              <Card key={alum._id} className="hover:shadow-md transition-shadow flex flex-col h-full bg-card">
                <CardHeader className="flex flex-row gap-4 items-start pb-2">
                  <Avatar className="w-14 h-14 border-2 border-primary/10">
                    <AvatarImage src={avatar} />
                    <AvatarFallback className="bg-muted">
                      {isPrivate ? <Lock className="w-5 h-5 text-muted-foreground" /> : name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <CardTitle className="text-base truncate" title={name}>{name}</CardTitle>
                    <div className="text-sm font-medium text-muted-foreground truncate" title={role}>{role}</div>
                    {company && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 truncate">
                        <Briefcase className="w-3 h-3 shrink-0" /> <span className="truncate">{company}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                    <GraduationCap className="w-3 h-3" /> {alum.branch}, Class of {alum.graduationYear}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {alum.willingness?.openToMentoring && <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">Mentoring</Badge>}
                    {alum.willingness?.openToQa && <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">Open for Q&A</Badge>}
                  </div>
                  
                  {alum.availabilityNote && !isPrivate && (
                    <div className="text-xs text-muted-foreground mb-4 bg-muted/50 p-2 rounded-md italic">
                      "{alum.availabilityNote}"
                    </div>
                  )}

                  <div className="mt-auto pt-2 flex gap-2">
                    {user ? (
                      <div className="flex flex-col flex-1 space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start"
                          onClick={() => {
                            setSelectedAlumni(alum);
                            setDialogOpen(true);
                          }}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Connect / Ask
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="w-full" asChild>
                        <Link to="/auth">Sign in to Connect</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {filteredAlumni.length === 0 && (
            <div className="col-span-full py-16 text-center border rounded-xl bg-muted/10">
              <div className="text-muted-foreground mb-2">No alumni found matching your criteria.</div>
              <Button variant="outline" onClick={() => {
                setSearchTerm(""); setBranchFilter(""); setYearFilter(""); setWillingToMentor(false); setWillingForQa(false);
              }}>Clear Filters</Button>
            </div>
          )}
        </div>
      )}

      {selectedAlumni && (
        <ConnectionRequestDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          alumniProfile={selectedAlumni}
        />
      )}
    </div>
  );
};
