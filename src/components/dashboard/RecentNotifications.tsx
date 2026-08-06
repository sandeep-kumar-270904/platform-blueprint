import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { DashboardEmptyState } from "./DashboardEmptyState";

export const RecentNotifications = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/notifications/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, [user]);

  if (loading) return null;

  if (notifications.length === 0) {
    return <DashboardEmptyState tier="tertiary" icon={Bell} title="No recent notifications" />;
  }

  return (
    <div className="space-y-3">
      {notifications.slice(0, 3).map((notif) => (
        <div key={notif._id} className="flex gap-3 items-start border-b border-border/50 pb-3 last:border-0 last:pb-0">
          <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-primary' : 'bg-muted'}`} />
          <div>
            <p className={`text-sm ${!notif.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
              {notif.message}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
