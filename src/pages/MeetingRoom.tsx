import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { MeetingSidebar } from "@/components/virtual-classroom/MeetingSidebar";
import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  const [socket, setSocket] = useState<Socket | null>(null);

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
      try {
        const res = await fetch(`${API_URL}/api/classrooms/${id}`);
        if (!res.ok) throw new Error("Classroom not found");
        const data = await res.json();
        
        // In a full implementation, we'd check participant status here
        // For migration demo, we assume the user is allowed to join if they know the link
        
        setClassroom(data);
      } catch (err) {
        toast({ title: "Classroom not found", variant: "destructive" });
        navigate("/virtual-classroom");
      } finally {
        setLoading(false);
      }
    };

    fetchClassroom();
  }, [id, user, navigate]);

  // Subscribe to room_settings changes via Socket.io
  useEffect(() => {
    if (!id || !jitsiApi) return;
    
    const newSocket = io(API_URL);
    setSocket(newSocket);
    newSocket.emit('join_classroom', id);

    newSocket.on('settings_updated', (newSettings: any) => {
      try {
        if (newSettings.mute_all && classroom?.host_id === user?.id) {
          jitsiApi.executeCommand('muteEveryone');
        }
        if (newSettings.is_locked !== undefined && classroom?.host_id === user?.id) {
          jitsiApi.executeCommand('toggleLobby', newSettings.is_locked);
        }
      } catch (e) {
        console.error("Error executing Jitsi synced command", e);
      }
    });

    return () => {
      newSocket.emit('leave_classroom', id);
      newSocket.disconnect();
    };
  }, [id, jitsiApi, classroom?.host_id, user?.id]);

  if (loading || !classroom) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            transcribingEnabled: true,
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
              ? ['microphone', 'camera', 'chat', 'raisehand', 'tileview', 'hangup', 'closedcaptions']
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
        <MeetingSidebar classroomId={classroom._id || classroom.id} isHost={isHost} isWebinar={isWebinar} jitsiApi={jitsiApi} />
      )}
    </div>
  );
};

export default MeetingRoom;
