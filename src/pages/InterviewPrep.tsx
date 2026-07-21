import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInterviewCompanies } from "@/hooks/useInterviewPrep";
import { Loader2, Search, Building2, BookOpen, Users, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const InterviewPrep = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");

  const { data: companies, isLoading } = useInterviewCompanies(search, type);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/placement')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Interview Prep</h1>
            <p className="text-muted-foreground mt-1">Company-specific interview guides, experiences, and technical questions.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search companies (e.g. Google, TCS)..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Company Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Product-based">Product-based</SelectItem>
              <SelectItem value="Service-based">Service-based</SelectItem>
              <SelectItem value="Startup">Startup</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Company Grid */}
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : companies?.length === 0 ? (
          <div className="text-center p-12 text-muted-foreground border rounded-lg bg-card">
            No companies found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies?.map((company) => (
              <Card key={company._id} className="hover:shadow-md transition-all group">
                <CardHeader className="pb-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border bg-white">
                        <AvatarImage src={company.logoUrl} className="object-contain p-1" />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {company.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-lg">{company.name}</h3>
                        <Badge variant="secondary" className="text-[10px] font-normal">{company.companyType}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {company.experienceCount || 0} Experiences
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      {company.guideCount || 0} Guides
                    </div>
                  </div>
                  
                  <Button className="w-full group-hover:bg-primary/90" asChild>
                    <Link to={`/placement/interview-prep/${company._id}`}>View Guide</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default InterviewPrep;
