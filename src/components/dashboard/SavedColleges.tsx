import { useState, useEffect } from "react";
import { CollegeCard } from "@/components/colleges/CollegeCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Building2, Search } from "lucide-react";
import { useColleges } from "@/hooks/useColleges";

export const SavedColleges = () => {
  const { getSavedColleges } = useColleges();
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const data = await getSavedColleges();
      setSaved(data);
    } catch (error) {
      console.error("Failed to load saved colleges", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
    // Poll for updates if un-saved from another tab, or rely on invalidation from useColleges
    // For simplicity, we just fetch on mount
  }, []);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className="space-y-3">
            <Skeleton className="h-[250px] w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (saved.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-muted/20 border border-dashed border-border rounded-xl">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Saved Colleges</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          You haven't bookmarked any colleges yet. Start exploring and save the ones you like!
        </p>
        <Link to="/college-insights">
          <Button><Search className="mr-2 h-4 w-4" /> Browse Colleges</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Saved Colleges</h2>
          <p className="text-muted-foreground">Your bookmarked institutions for quick access.</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {saved.map((college) => (
          <CollegeCard 
            key={college._id} 
            college={college} 
            isSaved={true} 
            // no compare here to keep dashboard simple, or we could pass onToggleCompare
          />
        ))}
      </div>
    </div>
  );
};
