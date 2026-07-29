import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, BarChart2, Link as LinkIcon, Settings, AlertTriangle, Bot, Activity } from "lucide-react";
import { ResourcesTab } from "./tabs/ResourcesTab";
import { PollsTab } from "./tabs/PollsTab";
import { QATab } from "./tabs/QATab";
import { SettingsTab } from "./tabs/SettingsTab";
import { AITab } from "./tabs/AITab";
import { ChatTab } from "./tabs/ChatTab";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const MeetingSidebar = ({ classroomId, isHost, isWebinar, jitsiApi }: { classroomId: string, isHost: boolean, isWebinar: boolean, jitsiApi?: any, onDuplicate?: () => void }) => {
  const { user } = useAuth();

  const [elapsed, setElapsed] = useState("");
  React.useEffect(() => {
    const timer = setInterval(() => {
      // Just a mock running timer for the current session duration
      const d = new Date();
      setElapsed(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [chatMode, setChatMode] = useState('everyone');
  const [socket, setSocket] = useState<any>(null);

  
  React.useEffect(() => {
    import('socket.io-client').then((module) => {
      const io = module.io;
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const newSocket = io(API_URL);
      setSocket(newSocket);
      newSocket.emit('join_classroom', { classroomId, userId: user?.id });

      newSocket.on('already_connected', () => {
        if (onDuplicate) onDuplicate();
      });

      newSocket.on('chat_permissions_changed', (mode: string) => {
        setChatMode(mode);
      });
      
      newSocket.on('session_ended', () => {
        // Force redirect to recap if the host ends it
        if (!isHost) {
          window.location.href = `/classroom/${classroomId}/recap`;
        }
      });

      return () => {
        newSocket.emit('leave_classroom', classroomId);
        newSocket.disconnect();
      };
    });
  }, [classroomId, isHost]);

  const handleReport = async () => {
    if (!reportReason.trim() || !user) return;
    setIsReporting(true);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/classrooms/${classroomId}/report`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason })
      });
      
      if (res.ok) {
        toast.success("Report submitted successfully");
        setReportOpen(false);
        setReportReason("");
      } else {
        toast.error("Failed to submit report");
      }
    } catch {
      toast.error("Failed to submit report");
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="w-80 border-l bg-background h-full flex flex-col">
      <div className="p-4 border-b shrink-0 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">Session <span className="text-xs bg-muted px-2 py-0.5 rounded border">{elapsed}</span></h3>
        <div className="flex gap-1">
          {isHost && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-green-500 hover:text-green-600 hover:bg-green-500/10" title="Engagement Level: High (Based on chat velocity)">
              <Activity className="h-4 w-4 mr-1 animate-pulse" /> Good
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setReportOpen(true)}>
            <AlertTriangle className="h-4 w-4 mr-1" />
            Report
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b shrink-0 px-2 h-12 bg-transparent overflow-x-auto hide-scrollbar">
                    <TabsTrigger value="chat" className="flex-1 min-w-fit gap-2 data-[state=active]:shadow-none data-[state=active]:bg-muted">
            <MessageSquare className="h-4 w-4" /> Chat
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex-1 min-w-fit gap-2 data-[state=active]:shadow-none data-[state=active]:bg-muted">
            <Bot className="h-4 w-4" /> AI
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex-1 min-w-fit gap-2 data-[state=active]:shadow-none data-[state=active]:bg-muted">
            <LinkIcon className="h-4 w-4" /> Resources
          </TabsTrigger>
          <TabsTrigger value="polls" className="flex-1 min-w-fit gap-2 data-[state=active]:shadow-none data-[state=active]:bg-muted">
            <BarChart2 className="h-4 w-4" /> Polls
          </TabsTrigger>
          {isWebinar && (
            <TabsTrigger value="qa" className="flex-1 min-w-fit gap-2 data-[state=active]:shadow-none data-[state=active]:bg-muted">
              <MessageSquare className="h-4 w-4" /> Q&A
            </TabsTrigger>
          )}
          {isHost && (
            <TabsTrigger value="settings" className="flex-1 min-w-fit gap-2 data-[state=active]:shadow-none data-[state=active]:bg-muted">
              <Settings className="h-4 w-4" /> Settings
            </TabsTrigger>
          )}
        </TabsList>
        
        <div className="flex-1 overflow-y-auto p-4">
                    <TabsContent value="chat" className="mt-0 h-full">
            <ChatTab classroomId={classroomId} isHost={isHost} socket={socket} chatMode={chatMode} />
          </TabsContent>
          <TabsContent value="ai" className="mt-0 h-full">
            <AITab classroomId={classroomId} isHost={isHost} />
          </TabsContent>
          <TabsContent value="resources" className="mt-0 h-full">
            <ResourcesTab classroomId={classroomId} isHost={isHost} />
          </TabsContent>
          <TabsContent value="polls" className="mt-0 h-full">
            <PollsTab classroomId={classroomId} isHost={isHost} />
          </TabsContent>
          {isWebinar && (
            <TabsContent value="qa" className="mt-0 h-full">
              <QATab classroomId={classroomId} isHost={isHost} />
            </TabsContent>
          )}
          {isHost && (
            <TabsContent value="settings" className="mt-0 h-full">
              <SettingsTab classroomId={classroomId} jitsiApi={jitsiApi} />
            </TabsContent>
          )}
        </div>
      </Tabs>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              If you are experiencing inappropriate behavior or safety issues in this session, please describe the situation below.
            </p>
            <Textarea 
              placeholder="What happened?" 
              value={reportReason} 
              onChange={e => setReportReason(e.target.value)} 
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)} disabled={isReporting}>Cancel</Button>
            <Button variant="destructive" onClick={handleReport} disabled={isReporting || !reportReason.trim()}>
              {isReporting ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
