import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Calendar as CalendarIcon, Users, Settings, Trash2 } from "lucide-react";

export default function HostDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [openTemplate, setOpenTemplate] = useState(false);
  const [form, setForm] = useState<any>({ title: "", duration_minutes: 60, max_participants: 50, visibility: "public", type: "interactive", is_paid: false, price: 0 });
  
  // Bulk schedule state
  const [scheduleModalOpen, setScheduleModalOpen] = useState<string | null>(null);
  const [bulkConfig, setBulkConfig] = useState({ instances: 4, intervalDays: 7, startDate: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      setLoading(true);
      const [sessRes, tempRes] = await Promise.all([
        supabase.from("virtual_classrooms").select("*").eq("host_id", user.id).order("scheduled_at", { ascending: true }),
        supabase.from("virtual_classroom_templates").select("*").eq("host_id", user.id).order("created_at", { ascending: false })
      ]);
      
      if (sessRes.data) setSessions(sessRes.data);
      if (tempRes.data) setTemplates(tempRes.data);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleCreateTemplate = async () => {
    if (!user || !form.title) return;
    
    const { data, error } = await supabase.from("virtual_classroom_templates").insert({
      host_id: user.id,
      ...form
    }).select().single();
    
    if (error) {
      toast({ title: "Failed to create template", description: error.message, variant: "destructive" });
    } else if (data) {
      toast({ title: "Template saved!" });
      setTemplates([data, ...templates]);
      setOpenTemplate(false);
      setForm({ title: "", duration_minutes: 60, max_participants: 50, visibility: "public", type: "interactive", is_paid: false, price: 0 });
    }
  };

  const handleBulkSchedule = async (templateId: string) => {
    if (!user) return;
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // Generate N instances
    const newSessions = [];
    let currentDate = new Date(bulkConfig.startDate);
    
    for (let i = 0; i < bulkConfig.instances; i++) {
      newSessions.push({
        host_id: user.id,
        title: `${template.title} (Session ${i + 1})`,
        subject: template.subject,
        description: template.description,
        duration_minutes: template.duration_minutes,
        max_participants: template.max_participants,
        visibility: template.visibility,
        type: template.type,
        is_paid: template.is_paid,
        price: template.price,
        scheduled_at: currentDate.toISOString()
      });
      // advance interval
      currentDate.setDate(currentDate.getDate() + bulkConfig.intervalDays);
    }

    const { error } = await supabase.from("virtual_classrooms").insert(newSessions);
    if (error) {
      toast({ title: "Failed to bulk schedule", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bulk scheduling complete!", description: `Created ${bulkConfig.instances} sessions.` });
      setScheduleModalOpen(null);
      // reload
      const { data } = await supabase.from("virtual_classrooms").select("*").eq("host_id", user.id).order("scheduled_at", { ascending: true });
      if (data) setSessions(data);
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <h1 className="text-3xl font-bold mb-6">Host Dashboard</h1>
        
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
            <TabsTrigger value="templates">Templates & Bulk</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.filter(s => new Date(s.scheduled_at) > new Date()).map(s => (
                <Card key={s.id}>
                  <CardHeader className="pb-2">
                    <h3 className="font-bold">{s.title}</h3>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" /> {new Date(s.scheduled_at).toLocaleString()}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">Manage Co-hosts</Button>
                      <Button size="sm" variant="outline" className="flex-1 text-destructive hover:text-destructive">Cancel Session</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {sessions.filter(s => new Date(s.scheduled_at) > new Date()).length === 0 && (
                <p className="text-muted-foreground">No upcoming sessions.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Templates</h2>
              <Dialog open={openTemplate} onOpenChange={setOpenTemplate}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Template</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Session Template</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Label>Title Pattern</Label>
                    <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Weekly Math Prep" />
                    <Label>Duration (min)</Label>
                    <Input type="number" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: +e.target.value})} />
                  </div>
                  <DialogFooter><Button onClick={handleCreateTemplate}>Save Template</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(t => (
                <Card key={t.id}>
                  <CardHeader className="pb-2">
                    <h3 className="font-bold">{t.title}</h3>
                    <p className="text-xs text-muted-foreground">{t.duration_minutes} min • {t.max_participants} max</p>
                  </CardHeader>
                  <CardContent>
                    <Dialog open={scheduleModalOpen === t.id} onOpenChange={(o) => setScheduleModalOpen(o ? t.id : null)}>
                      <DialogTrigger asChild>
                        <Button className="w-full mt-2" variant="secondary"><CalendarIcon className="h-4 w-4 mr-2" /> Bulk Schedule</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Bulk Schedule: {t.title}</DialogTitle></DialogHeader>
                        <div className="space-y-3 py-4">
                          <div>
                            <Label>Start Date/Time (First Session)</Label>
                            <Input type="datetime-local" onChange={e => setBulkConfig({...bulkConfig, startDate: new Date(e.target.value).toISOString()})} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Number of Sessions</Label>
                              <Input type="number" value={bulkConfig.instances} onChange={e => setBulkConfig({...bulkConfig, instances: +e.target.value})} />
                            </div>
                            <div>
                              <Label>Interval (Days)</Label>
                              <Input type="number" value={bulkConfig.intervalDays} onChange={e => setBulkConfig({...bulkConfig, intervalDays: +e.target.value})} />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            This will create {bulkConfig.instances} sessions, one every {bulkConfig.intervalDays} days starting on the selected date.
                          </p>
                        </div>
                        <DialogFooter><Button onClick={() => handleBulkSchedule(t.id)}>Generate Schedule</Button></DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
              {templates.length === 0 && <p className="text-muted-foreground">No templates saved.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
