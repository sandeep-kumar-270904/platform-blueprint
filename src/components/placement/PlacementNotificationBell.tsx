import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, Clock, Zap, Star, Calendar, MessageSquare, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { NotificationSettingsModal } from "./NotificationSettingsModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface PlacementNotification {
  _id: string;
  type: string;
  message: string;
  isRead: boolean;
  relatedContentId?: string;
  createdAt: string;
}

const placementTypes = [
  'placement_mock_reminder',
  'placement_streak_alert',
  'placement_new_content',
  'placement_booking_status',
  'placement_feedback_prompt',
  'placement_milestone'
];

export const PlacementNotificationBell = () => {
  const [notifications, setNotifications] = useState<PlacementNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      // We fetch more to filter client-side if API doesn't support type filtering directly
      const res = await fetch(`${API_URL}/api/notifications?limit=50`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.status === 401) return;
      if (res.ok) {
        const data = await res.json();
        const filtered = data.notifications.filter((n: any) => placementTypes.includes(n.type));
        setNotifications(filtered.slice(0, 15)); // Keep top 15
        setUnreadCount(filtered.filter((n: any) => !n.isRead).length);
      }
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) fetchNotifications();
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
      // Note: this marks ALL global notifications as read in the current backend
      // In a real app we'd want an endpoint like /api/notifications/read-all?types=placement...
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

  const getIcon = (type: string, isRead: boolean) => {
    const className = `h-4 w-4 ${!isRead ? 'text-primary' : 'text-muted-foreground'}`;
    switch (type) {
      case 'placement_mock_reminder': return <Clock className={className} />;
      case 'placement_streak_alert': return <Zap className={className} />;
      case 'placement_new_content': return <Star className={className} />;
      case 'placement_booking_status': return <Calendar className={className} />;
      case 'placement_feedback_prompt': return <MessageSquare className={className} />;
      case 'placement_milestone': return <Award className={className} />;
      default: return <Bell className={className} />;
    }
  };

  const getLink = (type: string) => {
    switch (type) {
      case 'placement_mock_reminder':
      case 'placement_booking_status':
      case 'placement_feedback_prompt':
        return "/placement/mock-interviews";
      case 'placement_new_content':
        return "/placement/interview-prep";
      case 'placement_milestone':
      case 'placement_streak_alert':
      default:
        return "/placement/dashboard";
    }
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative h-9 w-9 border-primary/20 hover:bg-primary/10 transition-colors">
            <Bell className="h-4 w-4 text-primary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive border-2 border-background">
                <span className="sr-only">{unreadCount} unread notifications</span>
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
            <h4 className="font-semibold text-sm">Placement Alerts</h4>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                onClick={() => {
                  setIsOpen(false);
                  setIsSettingsOpen(true);
                }}
              >
                Settings
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                  onClick={markAllAsRead}
                >
                  <Check className="mr-1 h-3 w-3" /> Mark read
                </Button>
              )}
            </div>
          </div>
          <ScrollArea className="h-[350px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No placement alerts yet</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`flex flex-col gap-1 border-b p-4 transition-colors hover:bg-muted/50 ${
                      !n.isRead ? "bg-primary/5" : ""
                    }`}
                    onClick={() => {
                      if (!n.isRead) markAsRead(n._id);
                    }}
                  >
                    <Link
                      to={getLink(n.type)}
                      className="flex items-start gap-3"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className={`mt-0.5 shrink-0 rounded-full p-1.5 ${!n.isRead ? 'bg-primary/10' : 'bg-muted'}`}>
                        {getIcon(n.type, n.isRead)}
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
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <NotificationSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
};
