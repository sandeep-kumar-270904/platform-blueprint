import { useState, useEffect } from "react";
import { Bell, Check, X, MessageSquare, Users, Calendar, Lightbulb, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import io from 'socket.io-client';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
  metadata?: any;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "message":
      return MessageSquare;
    case "team":
      return Users;
    case "event":
      return Calendar;
    case "idea":
      return Lightbulb;
    case "achievement":
      return Trophy;
    default:
      return Bell;
  }
};

export const NotificationCenter = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // API returns { notifications: [...] }
          setNotifications(data.notifications || []);
        }
      } catch {}
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(API_URL);
    socket.emit('join_user_room', user.id);
    socket.on('notification:new', (newNotification: any) => {
      setNotifications(prev => {
        const id = newNotification.id || newNotification._id;
        const existingIdx = prev.findIndex(n => (n.id || (n as any)._id) === id);
        if (existingIdx !== -1) {
          const newArr = [...prev];
          newArr.splice(existingIdx, 1);
          return [newNotification, ...newArr];
        }
        return [newNotification, ...prev];
      });
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [user]);

  const markAsRead = async (notification: Notification) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/notifications/${notification.id || (notification as any)._id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications((prev) =>
        prev.map((n) => ((n.id || (n as any)._id) === (notification.id || (notification as any)._id) ? { ...n, isRead: true } : n))
      );
      
      // Navigate to actionUrl if present
      const actionUrl = (notification as any).actionUrl;
      if (actionUrl) {
        setIsOpen(false);
        window.location.href = actionUrl; // or use navigate from react-router-dom if we add the hook
      }
    } catch {}
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, isRead: true }))
    );
    } catch {}
  };

  const groupedNotifications = notifications;

  const unreadCount = notifications.filter((n) => !n.is_read && !(n as any).isRead).length;

  const latestDigest = notifications.find(n => n.type === 'weekly_digest');
  const digestData = latestDigest?.metadata || { newFollowers: 0, postReactions: 0, topPostText: 'Check back next week for your first digest!' };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Notifications</h4>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-primary">Weekly Digest</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Your Week in Review</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary/5 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary">{digestData.newFollowers || 0}</p>
                      <p className="text-xs text-muted-foreground">New Followers</p>
                    </div>
                    <div className="bg-primary/5 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary">{digestData.postReactions || 0}</p>
                      <p className="text-xs text-muted-foreground">Post Reactions</p>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium mb-2">Most Engaged Post</h5>
                    <div className="p-3 border rounded-lg bg-muted/20 text-xs text-muted-foreground">
                      {digestData.topPostText ? `"${digestData.topPostText}"` : "No posts this week."}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setIsOpen(false); window.location.href = '/settings/notifications'; }}>
              <Bell className="h-3 w-3" />
            </Button>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-muted-foreground"
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {groupedNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                return (
                    <motion.div
                    key={notification.id || (notification as any)._id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                      !notification.is_read && !(notification as any).isRead ? "bg-primary/5" : ""
                    }`}
                    onClick={() => markAsRead(notification)}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          !notification.is_read && !(notification as any).isRead
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            !notification.is_read && !(notification as any).isRead ? "" : "text-muted-foreground"
                          }`}
                        >
                          {notification.title || (notification as any).type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at || (notification as any).createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {(!notification.is_read && !(notification as any).isRead) && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
