import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Save, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio?: string | null;
  sessions_hosted?: number;
  sessions_attended?: number;
}

export const ProfileManager = ({ userId, email }: { userId: string; email: string }) => {
  const [profile, setProfile] = useState<Profile>({ username: null, full_name: null, avatar_url: null, bio: null, sessions_hosted: 0, sessions_attended: 0 });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/dashboard/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: profile.username,
          full_name: profile.full_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url
        })
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(prev => ({...prev, ...data.user}));
        toast.success("Profile updated!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch {
      toast.error("Failed to update profile");
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/uploads`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(p => ({ ...p, avatar_url: data.url }));
        toast.success("Avatar uploaded! Remember to save changes.");
      } else {
        toast.error("Failed to upload avatar");
      }
    } catch (err) {
      toast.error("Error uploading avatar");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const initials = (profile.full_name || profile.username || email.split("@")[0])
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (loading) return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Loading...</CardContent></Card>;

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-4 w-4 text-primary" />
          Profile Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20">
              {profile.avatar_url && (
                <AvatarImage 
                  src={profile.avatar_url.startsWith('http') ? profile.avatar_url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${profile.avatar_url}`} 
                  alt="Avatar" 
                  className="object-cover"
                />
              )}
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              title="Upload new avatar"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleAvatarUpload}
            />
          </div>
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

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Input
            id="bio"
            value={profile.bio || ""}
            onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
            placeholder="Tell us a little about yourself"
            maxLength={160}
          />
          <p className="text-xs text-muted-foreground text-right">
            {(profile.bio || "").length}/160
          </p>
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
