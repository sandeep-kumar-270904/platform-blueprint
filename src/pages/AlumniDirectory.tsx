import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, Briefcase, GraduationCap, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function AlumniDirectory() {
  const [alumni, setAlumni] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [pastCompanyFilter, setPastCompanyFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  useEffect(() => {
    fetchAlumni();
  }, [companyFilter, pastCompanyFilter, yearFilter]);

  const fetchAlumni = async () => {
    try {
      const params = new URLSearchParams();
      if (companyFilter) params.append('company', companyFilter);
      if (pastCompanyFilter) params.append('pastCompany', pastCompanyFilter);
      if (yearFilter) params.append('year', yearFilter);
      
      const res = await api.get(`/alumni/directory?${params.toString()}`);
      setAlumni(res.data.alumni);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredAlumni = alumni.filter(a => 
    a.userId?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.currentRole?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Alumni Directory</h1>
          <p className="text-muted-foreground mt-1">Find and connect with alumni from your network.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-lg border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or role..." 
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Input 
          placeholder="Company..." 
          className="w-full md:w-48"
          value={companyFilter}
          onChange={e => setCompanyFilter(e.target.value)}
        />
        <Input 
          placeholder="Past Company (Career Path)..." 
          className="w-full md:w-64"
          value={pastCompanyFilter}
          onChange={e => setPastCompanyFilter(e.target.value)}
        />
        <Input 
          placeholder="Grad Year..." 
          className="w-full md:w-32"
          type="number"
          value={yearFilter}
          onChange={e => setYearFilter(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAlumni.map(alum => (
          <Card key={alum._id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row gap-4 items-start">
              <Avatar className="w-16 h-16 border-2 border-primary/20">
                <AvatarImage src={alum.userId?.avatar_url} />
                <AvatarFallback>{alum.userId?.full_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <CardTitle className="text-lg">{alum.userId?.full_name}</CardTitle>
                <div className="text-sm text-muted-foreground font-medium">{alum.currentRole}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Briefcase className="w-3 h-3" /> {alum.currentCompany || alum.company}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <GraduationCap className="w-3 h-3" /> {alum.collegeId?.name} - Class of {alum.graduationYear}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {alum.willingToRefer && <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">Open to Referrals</Badge>}
                {alum.openToInformalChat && <Badge variant="secondary" className="bg-green-500/10 text-green-600">Open to Chat</Badge>}
              </div>
              <div className="flex gap-2 w-full mt-auto">
                <Button variant="outline" className="flex-1" asChild>
                  <Link to={`/mentors/${alum._id}`}>Profile</Link>
                </Button>
                {alum.openToInformalChat && (
                  <Button className="flex-1 gap-2">
                    <MessageCircle className="w-4 h-4" /> Message
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredAlumni.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No alumni found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
