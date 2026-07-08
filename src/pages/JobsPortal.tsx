import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Briefcase, MapPin, DollarSign, Clock, Search, Bookmark, Plus, Loader2 } from "lucide-react";

import { useJobs } from "@/hooks/useJobs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const JobsPortal = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { jobs, loading, applyForJob, postJob } = useJobs();
  const [newJob, setNewJob] = useState({ title: "", company: "", location: "", type: "Full-time", salary: "" });
  const [isPostOpen, setIsPostOpen] = useState(false);

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    j.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePostJob = async () => {
    await postJob(newJob);
    setIsPostOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-6 md:py-10">
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-5xl text-center">
                <Badge variant="accent" className="mb-4">
                  <Briefcase className="mr-1 h-3 w-3" />
                  Career Opportunities
                </Badge>
                <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
                  Find Your <span className="text-foreground display-font">Dream Job</span>
                </h1>
                <p className="mx-auto mb-6 max-w-2xl text-lg text-muted-foreground">
                  Discover roles that match your skills. Apply easily and track your applications in one place.
                </p>
                <Dialog open={isPostOpen} onOpenChange={setIsPostOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="gap-2"><Plus className="h-5 w-5"/> Post a Job</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Post a new Job</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <Input placeholder="Job Title" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} />
                      <Input placeholder="Company Name" value={newJob.company} onChange={e => setNewJob({...newJob, company: e.target.value})} />
                      <Input placeholder="Location" value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} />
                      <Input placeholder="Salary (e.g. ₹8-12 LPA)" value={newJob.salary} onChange={e => setNewJob({...newJob, salary: e.target.value})} />
                      <Button onClick={handlePostJob} className="w-full">Post to Feed</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <ScrollReveal delay={0.1}>
          <div className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search jobs, companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No jobs found. Be the first to post one!</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job, index) => (
              <ScrollReveal key={job.id || index} delay={0.1 * (index + 1)}>
                <Card className="hover-scale">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="text-4xl mb-2">{job.logo || "💼"}</div>
                      <Button variant="ghost" size="icon">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                    <h3 className="text-xl font-bold">{job.title}</h3>
                    <p className="text-sm font-medium text-primary">{job.company}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{job.salary}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{job.type}</Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button variant="outline" className="flex-1">Save</Button>
                    <Button className="flex-1" onClick={() => applyForJob(job.id!)}>Apply</Button>
                  </CardFooter>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsPortal;
