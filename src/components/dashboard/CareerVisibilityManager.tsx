import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, Eye, Search, Briefcase, MapPin, DollarSign, Clock } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const CareerVisibilityManager = () => {
  const [visibility, setVisibility] = useState({
    openToWork: false,
    visibleToRecruiters: false,
    visiblePreferredRoles: [] as string[],
    visiblePreferredLocations: [] as string[],
    expectedCTC: { min: 0, max: 0, currency: 'INR' },
    noticePeriod: 'Immediate'
  });
  
  const [analytics, setAnalytics] = useState({
    profileViewCount: 0,
    recentViewers: [] as any[],
    topSearchKeywords: [] as string[]
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roleInput, setRoleInput] = useState("");
  const [locationInput, setLocationInput] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/api/users/me/visibility-analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setAnalytics({
          profileViewCount: data.profileViewCount,
          recentViewers: data.recentViewers,
          topSearchKeywords: data.topSearchKeywords
        });
        
        // We also need the user's current settings. Let's fetch them from profile or use the analytics endpoint which returns them.
        // Wait, I should fetch the user profile to get the careerVisibility object.
        const profRes = await fetch(`${API_URL}/api/dashboard/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profRes.ok) {
          const profData = await profRes.json();
          if (profData.careerVisibility) {
            setVisibility({
              openToWork: profData.careerVisibility.openToWork || false,
              visibleToRecruiters: profData.careerVisibility.visibleToRecruiters || false,
              visiblePreferredRoles: profData.careerVisibility.visiblePreferredRoles || [],
              visiblePreferredLocations: profData.careerVisibility.visiblePreferredLocations || [],
              expectedCTC: profData.careerVisibility.expectedCTC || { min: 0, max: 0, currency: 'INR' },
              noticePeriod: profData.careerVisibility.noticePeriod || 'Immediate'
            });
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/users/me/visibility`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(visibility)
      });
      if (res.ok) {
        toast.success("Visibility settings updated!");
        fetchData(); // Refresh to get updated keywords
      } else {
        toast.error("Failed to update settings");
      }
    } catch {
      toast.error("Error updating settings");
    } finally {
      setSaving(false);
    }
  };

  const addRole = () => {
    if (roleInput.trim() && !visibility.visiblePreferredRoles.includes(roleInput.trim())) {
      setVisibility({ ...visibility, visiblePreferredRoles: [...visibility.visiblePreferredRoles, roleInput.trim()] });
      setRoleInput("");
    }
  };

  const removeRole = (role: string) => {
    setVisibility({ ...visibility, visiblePreferredRoles: visibility.visiblePreferredRoles.filter(r => r !== role) });
  };

  const addLocation = () => {
    if (locationInput.trim() && !visibility.visiblePreferredLocations.includes(locationInput.trim())) {
      setVisibility({ ...visibility, visiblePreferredLocations: [...visibility.visiblePreferredLocations, locationInput.trim()] });
      setLocationInput("");
    }
  };

  const removeLocation = (loc: string) => {
    setVisibility({ ...visibility, visiblePreferredLocations: visibility.visiblePreferredLocations.filter(l => l !== loc) });
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading visibility settings...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings Column */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-4 w-4 text-primary" />
                Visibility Settings
              </CardTitle>
              <CardDescription>Control how recruiters find your profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="space-y-0.5">
                  <Label className="text-base">Visible to Recruiters</Label>
                  <p className="text-sm text-muted-foreground">
                    If off, your profile will never appear in recruiter searches.
                  </p>
                </div>
                <Switch 
                  checked={visibility.visibleToRecruiters} 
                  onCheckedChange={(c) => setVisibility({...visibility, visibleToRecruiters: c})} 
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="space-y-0.5">
                  <Label className="text-base">Open To Work</Label>
                  <p className="text-sm text-muted-foreground">
                    Adds an "Open to Work" badge to your profile.
                  </p>
                </div>
                <Switch 
                  checked={visibility.openToWork} 
                  onCheckedChange={(c) => setVisibility({...visibility, openToWork: c})} 
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Briefcase className="h-4 w-4"/> Preferred Roles</Label>
                  <div className="flex gap-2">
                    <Input value={roleInput} onChange={e => setRoleInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addRole()} placeholder="e.g. Frontend Developer" />
                    <Button type="button" onClick={addRole} variant="secondary">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {visibility.visiblePreferredRoles.map(role => (
                      <Badge key={role} variant="secondary" className="cursor-pointer hover:bg-destructive/20 hover:text-destructive" onClick={() => removeRole(role)}>
                        {role} &times;
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><MapPin className="h-4 w-4"/> Preferred Locations</Label>
                  <div className="flex gap-2">
                    <Input value={locationInput} onChange={e => setLocationInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLocation()} placeholder="e.g. Bangalore, Remote" />
                    <Button type="button" onClick={addLocation} variant="secondary">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {visibility.visiblePreferredLocations.map(loc => (
                      <Badge key={loc} variant="secondary" className="cursor-pointer hover:bg-destructive/20 hover:text-destructive" onClick={() => removeLocation(loc)}>
                        {loc} &times;
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><DollarSign className="h-4 w-4"/> Expected CTC (Min)</Label>
                    <Input 
                      type="number" 
                      value={visibility.expectedCTC.min || ''} 
                      onChange={e => setVisibility({...visibility, expectedCTC: { ...visibility.expectedCTC, min: Number(e.target.value) }})} 
                      placeholder="e.g. 500000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Clock className="h-4 w-4"/> Notice Period</Label>
                    <Select 
                      value={visibility.noticePeriod} 
                      onValueChange={val => setVisibility({...visibility, noticePeriod: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Immediate">Immediate</SelectItem>
                        <SelectItem value="15 days">15 days</SelectItem>
                        <SelectItem value="30 days">30 days</SelectItem>
                        <SelectItem value="60 days">60 days</SelectItem>
                        <SelectItem value="90 days">90 days</SelectItem>
                        <SelectItem value="Currently a student">Currently a student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-lg">Profile Analytics</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="text-center">
                <p className="text-5xl font-bold text-primary mb-1">{analytics.profileViewCount}</p>
                <p className="text-sm text-muted-foreground">Total Profile Views</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  Recent Viewers
                </h4>
                {analytics.recentViewers.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No recent views</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.recentViewers.map((viewer, i) => (
                      <div key={i} className="flex flex-col text-sm border-l-2 pl-3 pb-2 last:border-0 border-muted">
                        <span className="font-medium text-foreground">{viewer.name}</span>
                        {viewer.company && <span className="text-xs text-muted-foreground">{viewer.company}</span>}
                        <span className="text-xs text-muted-foreground/70">{new Date(viewer.viewedAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                Search Keywords
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Recruiters searching these keywords may find you
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {analytics.topSearchKeywords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Add skills and preferred roles to generate keywords.</p>
                ) : (
                  analytics.topSearchKeywords.map((keyword, i) => (
                    <Badge key={i} variant="outline" className="bg-background">
                      {keyword}
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
