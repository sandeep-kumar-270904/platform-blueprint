import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, Info, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { io } from "socket.io-client";
import { useAuth } from "@/hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface Notification {
  _id: string;
  type: string;
  message: string;
  isRead: boolean;
  relatedCollegeId?: string;
  relatedContentId?: string;
  createdAt: string;
  metadata?: any;
}

export const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/unread-count`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.status === 401) {
        // Silently fail if not logged in or token expired
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch (err) {
      console.error("Error fetching unread count", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications?limit=10`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.status === 401) return;
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();

    let newSocket: any = null;
    if (user) {
      newSocket = io(API_URL);
      newSocket.emit('join_user_room', user.id);
      
      newSocket.on('notification:new', (newNotification: Notification) => {
        setUnreadCount(prev => prev + 1);
        if (isOpen) {
          setNotifications(prev => [newNotification, ...prev]);
        }
      });
    }

    // Fallback Poll every 60 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
      if (isOpen) {
        fetchNotifications();
      }
    }, 60000);

    return () => {
      clearInterval(interval);
      if (newSocket) newSocket.disconnect();
    };
  }, [isOpen, user]);

  // When popover opens, fetch the actual notifications list
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all read", err);
    }
  };

  const getNotificationLink = (n: Notification) => {
    if (n.type.startsWith('team_')) {
      return n.relatedContentId ? `/team-hunt/${n.relatedContentId}` : '/team-hunt/dashboard';
    }
    if (n.type.startsWith('ama_')) {
      if (n.type === 'ama_cancelled') return '/mentors/amas';
      return n.relatedContentId ? `/mentors/amas/${n.relatedContentId}` : '/mentors/amas';
    }
    if (n.type === 'session_reminder') {
      return n.relatedContentId ? `/mentors/amas/${n.relatedContentId}` : '/dashboard';
    }
    if (n.type.startsWith('mentor_booking_')) {
      return '/dashboard'; // assuming mentor bookings are on the dashboard
    }
    if (n.type === 'mentor_application_status' || n.type === 'mentor_application_rejected') {
      return '/dashboard';
    }
    
    if (n.type === 'communityForums') {
      return '/community';
    }
    
    if (n.type.startsWith('creator_')) {
      return n.relatedContentId ? `/creators?contentId=${n.relatedContentId}` : '/creators';
    }
    
    if (n.type.startsWith('group_')) {
      const groupId = n.relatedContentId;
      if (!groupId) return '/study-groups';
      if (n.type === 'group_join_request') return `/study-groups/${groupId}?tab=manage`;
      if (n.type === 'group_new_message') return `/study-groups/${groupId}?tab=chat`;
      if (n.type === 'group_session_scheduled' || n.type === 'group_session_starting') return `/study-groups/${groupId}?tab=sessions`;
      return `/study-groups/${groupId}`;
    }
    
    if (n.relatedCollegeId) {
      return `/colleges/${n.relatedCollegeId}`;
    }
    // Fallback
    return "/dashboard";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-2 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background">
              <span className="sr-only">{unreadCount} unread notifications</span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
              onClick={markAllAsRead}
            >
              <Check className="mr-1 h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div
                  key={n._id}
                  className={`flex flex-col gap-1 border-b p-4 transition-colors hover:bg-muted/50 ${
                    !n.isRead ? "bg-muted/30" : ""
                  }`}
                  onClick={() => {
                    if (!n.isRead) markAsRead(n._id);
                  }}
                >
                  <Link
                    to={getNotificationLink(n)}
                    className="flex items-start gap-3"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className={`mt-0.5 shrink-0 rounded-full p-1.5 ${!n.isRead ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Info className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col flex-1 gap-1">
                      <p className={`text-sm leading-snug ${!n.isRead ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {n.message}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </Link>
                  {n.metadata?.secondChanceMatches?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-purple-500/20 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{n.metadata.secondChanceMatches.length} other {n.metadata.secondChanceMatches.length === 1 ? 'team is' : 'teams are'} looking for someone like you:</span>
                      </div>
                      <div className="grid gap-1.5 mt-1">
                        {n.metadata.secondChanceMatches.map((match: any) => (
                          <Link
                            key={match.teamId}
                            to={`/team-hunt/${match.teamId}`}
                            className="flex items-center justify-between p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-colors text-xs"
                            onClick={() => setIsOpen(false)}
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="font-semibold text-foreground truncate">{match.title}</span>
                              {match.description && <span className="text-[10px] text-muted-foreground truncate">{match.description}</span>}
                            </div>
                            <Badge variant="outline" className="bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[10px] shrink-0 font-bold">
                              {match.matchScore}% Match
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
