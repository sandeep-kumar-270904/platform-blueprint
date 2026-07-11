import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const Personalization = () => {
  const { user } = useAuth();
  const [data, setData] = useState<{ recentlyViewed: any[], recommended: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchPersonalization = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/colleges/personalization`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPersonalization();
  }, [user]);

  // Hide entirely if logged out, or loading, or no history
  if (!user || loading || !data || data.recentlyViewed.length === 0) {
    return null;
  }

  const renderCompactCard = (college: any, reason?: string) => (
    <Link to={`/colleges/${college._id}`} key={college._id} className="block shrink-0 w-[240px] group">
      <Card className="h-full border-border hover:border-primary/50 transition-colors overflow-hidden flex flex-col">
        <div className="h-24 relative overflow-hidden bg-muted">
          {college.images?.[0] ? (
             <img src={college.images[0]} alt={college.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-4xl">{college.logoOrIcon || "🏛️"}</div>
          )}
          <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1 shadow-sm">
            <Star className="h-3 w-3 fill-warning text-warning" /> {college.rating?.toFixed(1) || "N/A"}
          </div>
        </div>
        <CardContent className="p-3 flex flex-col flex-1">
          {reason && (
            <div className="mb-1 text-[10px] uppercase font-bold tracking-wider text-primary truncate">
              {reason}
            </div>
          )}
          <h4 className="font-bold text-sm truncate mb-1 group-hover:text-primary transition-colors">{college.name}</h4>
          <div className="flex items-center text-xs text-muted-foreground mb-2">
            <MapPin className="h-3 w-3 mr-1 shrink-0" />
            <span className="truncate">{college.location?.city}, {college.location?.state}</span>
          </div>
          <div className="mt-auto flex justify-between items-center text-xs">
            <span className="font-medium">₹{(college.fees?.tuition / 100000).toFixed(1)}L/yr</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{college.type}</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="mb-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {data.recentlyViewed.length > 0 && (
        <section>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            Recently Viewed
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
            {data.recentlyViewed.map(c => renderCompactCard(c))}
          </div>
        </section>
      )}

      {data.recommended.length > 0 && (
        <section>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            Recommended for You
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
            {data.recommended.map(c => renderCompactCard(c, c.matchReason))}
          </div>
        </section>
      )}
      
    </div>
  );
};
