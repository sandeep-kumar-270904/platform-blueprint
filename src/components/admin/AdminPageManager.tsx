import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Save, Undo, Plus, Trash2 } from 'lucide-react';
import { SiteNavigationGroup, SiteSettings } from '@/hooks/useSiteContent';

export const AdminPageManager = () => {
  const queryClient = useQueryClient();

  // Fetch data
  const { data: siteData, isLoading } = useQuery({
    queryKey: ['adminSiteContent'],
    queryFn: async () => {
      const { data } = await api.get('/site-content');
      return data;
    }
  });

  // Local state for editing
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [announcementVisible, setAnnouncementVisible] = useState(false);
  const [announcementType, setAnnouncementType] = useState('info');

  const [navGroups, setNavGroups] = useState<SiteNavigationGroup[]>([]);
  
  // Initialize local state when data loads
  React.useEffect(() => {
    if (siteData) {
      setMaintenanceMode(siteData.settings?.maintenanceMode || false);
      setAnnouncementMsg(siteData.settings?.announcement?.message || "");
      setAnnouncementVisible(siteData.settings?.announcement?.isVisible || false);
      setAnnouncementType(siteData.settings?.announcement?.type || 'info');
      setNavGroups(siteData.navigation?.groups || []);
    }
  }, [siteData]);

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: any) => api.put('/admin/site-content/settings', newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSiteContent'] });
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      toast.success("Settings updated");
    },
    onError: () => toast.error("Failed to update settings")
  });

  const updateNavMutation = useMutation({
    mutationFn: (groups: any) => api.put('/admin/site-content/navigation', { groups }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSiteContent'] });
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      toast.success("Navigation updated");
    },
    onError: () => toast.error("Failed to update navigation")
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      maintenanceMode,
      announcement: {
        message: announcementMsg,
        isVisible: announcementVisible,
        type: announcementType
      }
    });
  };

  const handleSaveNav = () => {
    updateNavMutation.mutate(navGroups);
  };

  const handleAddNavGroup = () => {
    setNavGroups([...navGroups, { title: "New Group", items: [] }]);
  };

  const handleRemoveNavGroup = (index: number) => {
    const newGroups = [...navGroups];
    newGroups.splice(index, 1);
    setNavGroups(newGroups);
  };

  if (isLoading) return <Loader2 className="animate-spin h-8 w-8 mx-auto" />;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Global Settings</TabsTrigger>
          <TabsTrigger value="navigation">Navigation Builder</TabsTrigger>
          <TabsTrigger value="pages">Page Content (CMS)</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Mode</CardTitle>
              <CardDescription>Lock the site for all non-admin users.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center space-x-4">
              <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
              <Label>Enable Maintenance Mode</Label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Global Announcement</CardTitle>
              <CardDescription>Show a banner across the entire site.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Switch checked={announcementVisible} onCheckedChange={setAnnouncementVisible} />
                <Label>Show Announcement Banner</Label>
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Input value={announcementMsg} onChange={e => setAnnouncementMsg(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Banner Type</Label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={announcementType} 
                  onChange={e => setAnnouncementType(e.target.value)}
                >
                  <option value="info">Info (Blue)</option>
                  <option value="warning">Warning (Yellow)</option>
                  <option value="error">Error (Red)</option>
                  <option value="success">Success (Green)</option>
                </select>
              </div>
              <Button onClick={handleSaveSettings} disabled={updateSettingsMutation.isPending}>
                {updateSettingsMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Global Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="navigation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Navigation Builder</CardTitle>
              <CardDescription>Manage the main site navigation menu. (JSON mode for now, drag-and-drop later)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {navGroups.map((group, gIndex) => (
                  <div key={gIndex} className="p-4 border rounded-lg space-y-4 bg-muted/20">
                    <div className="flex gap-4 items-end">
                      <div className="flex-1 space-y-2">
                        <Label>Group Title</Label>
                        <Input 
                          value={group.title} 
                          onChange={(e) => {
                            const newG = [...navGroups];
                            newG[gIndex].title = e.target.value;
                            setNavGroups(newG);
                          }} 
                        />
                      </div>
                      <Button variant="destructive" size="icon" onClick={() => handleRemoveNavGroup(gIndex)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2 pl-4 border-l-2">
                      <Label>Items JSON Array</Label>
                      <Textarea 
                        rows={5}
                        value={JSON.stringify(group.items, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            const newG = [...navGroups];
                            newG[gIndex].items = parsed;
                            setNavGroups(newG);
                          } catch (err) {
                            // ignore parse errors while typing
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleAddNavGroup}><Plus className="h-4 w-4 mr-2" /> Add Group</Button>
                <Button onClick={handleSaveNav} disabled={updateNavMutation.isPending}>
                  {updateNavMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Navigation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Page Content Editor</CardTitle>
              <CardDescription>Select a page and section to edit its content.</CardDescription>
            </CardHeader>
            <CardContent>
               <PageContentEditor />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const PageContentEditor = () => {
  const [pageSlug, setPageSlug] = useState('quiz-hub');
  const [section, setSection] = useState('hero');
  const [contentJson, setContentJson] = useState('{}');

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['pageContentAdmin', pageSlug, section],
    queryFn: async () => {
      const { data } = await api.get(`/site-content/page/${pageSlug}`);
      const secData = data.find((d: any) => d.section === section);
      return secData || null;
    }
  });

  React.useEffect(() => {
    if (data) {
      setContentJson(JSON.stringify(data.content, null, 2));
    } else {
      setContentJson('{\n  "title": "",\n  "description": ""\n}');
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (jsonStr: string) => {
      const parsed = JSON.parse(jsonStr);
      await api.put(`/admin/site-content/content/${pageSlug}/${section}`, { content: parsed });
    },
    onSuccess: () => {
      toast.success("Content saved");
      refetch();
    },
    onError: () => toast.error("Failed to save. Ensure valid JSON.")
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <Label>Page Slug</Label>
          <Input value={pageSlug} onChange={e => setPageSlug(e.target.value)} placeholder="e.g. quiz-hub, about, home" />
        </div>
        <div className="flex-1 space-y-2">
          <Label>Section Name</Label>
          <Input value={section} onChange={e => setSection(e.target.value)} placeholder="e.g. hero, main, footer" />
        </div>
        <div className="flex items-end">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <Loader2 className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : 'hidden'}`} /> Load
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Content (JSON format)</Label>
        <Textarea 
          className="font-mono text-sm" 
          rows={15} 
          value={contentJson} 
          onChange={e => setContentJson(e.target.value)} 
        />
        <p className="text-xs text-muted-foreground">
          For Quiz Hub Hero, use: {`{"badge": "...", "titleStart": "...", "titleHighlight": "...", "description": "..."}`} <br />
          For Static Pages (/p/about), use: {`{"heroTitle": "...", "body": "# Markdown..."}`}
        </p>
      </div>

      <Button onClick={() => saveMutation.mutate(contentJson)} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save Content
      </Button>
    </div>
  );
};
