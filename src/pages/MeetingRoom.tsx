import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { MeetingSidebar } from "@/components/virtual-classroom/MeetingSidebar";

const MeetingRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classroom, setClassroom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [jitsiApi, setJitsiApi] = useState<any>(null);
  const [focusMode, setFocusMode] = useState(() => localStorage.getItem("focusMode") === "true");
  const [lowBandwidth, setLowBandwidth] = useState(false);

  useEffect(() => {
    // Basic network detection
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn && conn.downlink < 1.0) {
        setLowBandwidth(true);
        toast({ title: "Low Bandwidth Detected", description: "Video quality has been reduced to preserve stability." });
      }
      
      const updateConn = () => {
        if (conn.downlink < 1.0 && !lowBandwidth) {
          setLowBandwidth(true);
          toast({ title: "Low Bandwidth Detected", description: "Video quality has been reduced to preserve stability." });
        } else if (conn.downlink >= 1.0 && lowBandwidth) {
          setLowBandwidth(false);
          toast({ title: "Network Restored", description: "Normal video quality resumed." });
        }
      };
      
      conn.addEventListener('change', updateConn);
      return () => conn.removeEventListener('change', updateConn);
    }
  }, [lowBandwidth]);

  useEffect(() => {
    localStorage.setItem("focusMode", focusMode.toString());
  }, [focusMode]);

  useEffect(() => {
    const fetchClassroom = async () => {
      if (!id || !user) return;
      const { data, error } = await supabase
        .from("virtual_classrooms")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error || !data) {
        toast({ title: "Classroom not found", variant: "destructive" });
        navigate("/virtual-classroom");
        return;
      }
      
      const { data: p } = await supabase
        .from("virtual_classroom_participants")
        .select("*")
        .eq("classroom_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
        
      if (!p && data.host_id !== user.id) {
        toast({ title: "Not joined or Waitlisted", description: "You must RSVP and not be on the waitlist.", variant: "destructive" });
        navigate("/virtual-classroom");
        return;
      }

      if (p && p.status === "waitlisted") {
        toast({ title: "You are on the waitlist", description: "Wait until a spot opens up.", variant: "default" });
        navigate("/virtual-classroom");
        return;
      }

      setClassroom(data);
      setLoading(false);
      
      // Log attendance
      const { data: logData } = await supabase
        .from("virtual_classroom_attendance_log")
        .insert({ classroom_id: id, user_id: user.id })
        .select("id")
        .single();
        
      if (logData) {
        setAttendanceId(logData.id);
      }
    };

    fetchClassroom();
    
    return () => {
      // Best effort cleanup if component unmounts unexpectedly
      if (attendanceId) {
        supabase.from("virtual_classroom_attendance_log").update({ left_at: new Date().toISOString() }).eq("id", attendanceId);
      }
    }
  }, [id, user, navigate]);

  // Subscribe to room_settings changes
  useEffect(() => {
    if (!id || !jitsiApi) return;
    
    const channel = supabase.channel(`classroom_settings_${id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'virtual_classrooms',
        filter: `id=eq.${id}`
      }, (payload) => {
        const newSettings = payload.new.room_settings;
        if (!newSettings) return;
        
        // Execute real-time jitsi commands based on sync
        try {
          if (newSettings.mute_all && classroom?.host_id === user?.id) {
            // Only host needs to execute muteEveryone command to mute all others
            jitsiApi.executeCommand('muteEveryone');
          }
          if (newSettings.is_locked !== undefined && classroom?.host_id === user?.id) {
            jitsiApi.executeCommand('toggleLobby', newSettings.is_locked);
          }
        } catch (e) {
          console.error("Error executing Jitsi synced command", e);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, jitsiApi, classroom?.host_id, user?.id]);

  if (loading || !classroom) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const isHost = classroom.host_id === user?.id;
  const isWebinar = classroom.type === "webinar";
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Student";
  const userEmail = user?.email || "";

  return (
    <div className="h-screen w-full flex bg-black">
      <div className="flex-1 min-w-0 h-full relative">
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={`studynexus-${classroom.join_code}`}
          configOverwrite={{
            startWithAudioMuted: !isHost,
            startWithVideoMuted: !isHost || lowBandwidth,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            resolution: lowBandwidth ? 180 : 720,
            constraints: {
              video: {
                height: { ideal: lowBandwidth ? 180 : 720, max: lowBandwidth ? 180 : 720, min: 180 }
              }
            },
            remoteVideoMenu: {
              disableKick: !isHost,
              disableGrantModerator: !isHost
            }
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            TOOLBAR_BUTTONS: isWebinar && !isHost 
              ? ['microphone', 'camera', 'chat', 'raisehand', 'tileview', 'hangup']
              : ['microphone', 'camera', 'closedcaptions', 'desktop', 'embedmeeting', 'fullscreen',
                'fodeviceselection', 'profile', 'chat', 'recording', 'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts', 'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone', 'security', 'whiteboard', 'participants-pane'
              ]
          }}
          userInfo={{
            displayName,
            email: userEmail
          }}
          onApiReady={(externalApi) => {
            setJitsiApi(externalApi);
            externalApi.addListener('videoConferenceLeft', async () => {
              if (attendanceId) {
                await supabase.from("virtual_classroom_attendance_log").update({ left_at: new Date().toISOString() }).eq("id", attendanceId);
              }
              navigate(`/classroom/${id}/recap`);
            });
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
          }}
        />
        
        <button 
          onClick={() => setFocusMode(!focusMode)}
          className="absolute bottom-4 left-4 z-50 bg-black/50 hover:bg-black/80 text-white px-3 py-1.5 rounded text-sm backdrop-blur transition"
        >
          {focusMode ? "Show Sidebar" : "Focus Mode"}
        </button>
      </div>
      {!focusMode && (
        <MeetingSidebar classroomId={classroom.id} isHost={isHost} isWebinar={isWebinar} jitsiApi={jitsiApi} />
      )}
    </div>
  );
};

export default MeetingRoom;
