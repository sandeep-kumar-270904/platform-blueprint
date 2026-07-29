import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Check, MessageSquare, Lightbulb, Users, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  action_url: string | null;
}

import { Calendar } from "lucide-react";
const typeIcons: Record<string, typeof Bell> = {
  comment: MessageSquare,
  message: MessageSquare,
  idea: Lightbulb,
  team: Users,
  event: Calendar,
  info: Info,
};

export const NotificationsPanel = ({ userId }: { userId: string }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/dashboard/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        } else {
          setNotifications([]);
        }
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  const markAsRead = async (id: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/dashboard/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/dashboard/notifications/read-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-4 w-4 text-primary" />
          Notifications
          {unread > 0 && (
            <Badge className="bg-red-500 text-white text-[10px] px-1.5">{unread}</Badge>
          )}
        </CardTitle>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs gap-1">
            <Check className="h-3 w-3" /> Mark all read
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {notifications.map((n) => {
              const Icon = typeIcons[n.type] || Bell;
              return (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                    n.is_read ? "opacity-60" : "bg-primary/5 hover:bg-primary/10"
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
