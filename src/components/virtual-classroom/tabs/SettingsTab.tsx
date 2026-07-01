import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Users, Lock, MicOff, MessageSquareOff, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export const SettingsTab = ({ classroomId, jitsiApi }: { classroomId: string, jitsiApi?: any }) => {
  const [settings, setSettings] = useState<any>({
    chat_enabled: true,
    is_locked: false,
    require_hand_raise: false,
    mute_all: false
  });
  
  const [kickUserId, setKickUserId] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("virtual_classrooms")
        .select("room_settings")
        .eq("id", classroomId)
        .single();
        
      if (data?.room_settings) {
        setSettings(data.room_settings);
      }
    };
    fetchSettings();
  }, [classroomId]);

  const updateSetting = async (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Update DB
    const { error } = await supabase
      .from("virtual_classrooms")
      .update({ room_settings: newSettings })
      .eq("id", classroomId);
      
    if (error) {
      toast.error("Failed to update setting");
    } else {
      toast.success("Setting updated");
      
      // Execute Jitsi commands if API is available
      if (jitsiApi) {
        try {
          if (key === 'mute_all' && value) {
            jitsiApi.executeCommand('muteEveryone');
          }
          if (key === 'is_locked') {
            jitsiApi.executeCommand('toggleLobby', value);
          }
        } catch (e) {
          console.error("Jitsi command error", e);
        }
      }
    }
  };
  
  const handleKick = () => {
    if (!kickUserId.trim() || !jitsiApi) return;
    try {
      jitsiApi.executeCommand('kickParticipant', kickUserId);
      toast.success("Participant kicked");
      setKickUserId("");
    } catch (e) {
      toast.error("Failed to kick participant. Ensure ID is correct.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Room Security</h4>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2"><Lock className="h-4 w-4" /> Lock Room (Lobby)</Label>
            <p className="text-xs text-muted-foreground">Require host approval to join.</p>
          </div>
          <Switch 
            checked={settings.is_locked} 
            onCheckedChange={(v) => updateSetting("is_locked", v)} 
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Participant Controls</h4>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2"><MessageSquareOff className="h-4 w-4" /> Disable Chat</Label>
            <p className="text-xs text-muted-foreground">Prevent participants from sending messages.</p>
          </div>
          <Switch 
            checked={!settings.chat_enabled} 
            onCheckedChange={(v) => updateSetting("chat_enabled", !v)} 
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2"><MicOff className="h-4 w-4" /> Mute Everyone</Label>
            <p className="text-xs text-muted-foreground">Force mute all current participants.</p>
          </div>
          <Switch 
            checked={settings.mute_all} 
            onCheckedChange={(v) => updateSetting("mute_all", v)} 
          />
        </div>
      </div>
      
      <div className="space-y-3 pt-4 border-t">
        <h4 className="font-semibold text-sm text-destructive uppercase tracking-wider flex items-center gap-1">
          <UserMinus className="h-4 w-4" /> Moderation
        </h4>
        <p className="text-xs text-muted-foreground">Kick a participant from the room using their Jitsi Participant ID.</p>
        <div className="flex gap-2">
          <Input 
            placeholder="Participant ID" 
            value={kickUserId} 
            onChange={(e) => setKickUserId(e.target.value)} 
            className="flex-1"
          />
          <Button variant="destructive" size="sm" onClick={handleKick}>Kick</Button>
        </div>
      </div>
    </div>
  );
};
