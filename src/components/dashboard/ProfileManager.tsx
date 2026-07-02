import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { User, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  sessions_hosted?: number;
  sessions_attended?: number;
}

export const ProfileManager = ({ userId, email }: { userId: string; email: string }) => {
  const [profile, setProfile] = useState<Profile>({ username: null, full_name: null, avatar_url: null, sessions_hosted: 0, sessions_attended: 0 });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [profileRes, hostedRes, attendedRes] = await Promise.all([
        supabase.from("profiles").select("username, full_name, avatar_url").eq("id", userId).single(),
        supabase.from("virtual_classrooms").select("id", { count: "exact", head: true }).eq("host_id", userId),
        supabase.from("virtual_classroom_participants").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "attending")
      ]);

      if (profileRes.data) {
        setProfile({
          ...profileRes.data,
          sessions_hosted: hostedRes.count || 0,
          sessions_attended: attendedRes.count || 0,
        });
      }
      setLoading(false);
    };
    fetch();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        username: profile.username,
        full_name: profile.full_name,
      })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated!");
    }
    setSaving(false);
  };

  const initials = (profile.full_name || profile.username || email.split("@")[0])
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (loading) return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Loading...</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-primary" />
          Profile Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-primary/20">
            <AvatarFallback className="text-lg bg-primary text-primary-foreground text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{profile.full_name || profile.username || "Student"}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={profile.full_name || ""}
              onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={profile.username || ""}
              onChange={(e) => setProfile(p => ({ ...p, username: e.target.value }))}
              placeholder="your_username"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-4">
          <div className="rounded-lg border p-3 flex flex-col items-center justify-center bg-primary/5">
            <span className="text-2xl font-bold">{profile.sessions_hosted}</span>
            <span className="text-sm text-muted-foreground">Sessions Hosted</span>
          </div>
          <div className="rounded-lg border p-3 flex flex-col items-center justify-center bg-primary/5">
            <span className="text-2xl font-bold">{profile.sessions_attended}</span>
            <span className="text-sm text-muted-foreground">Sessions Attended</span>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
};
