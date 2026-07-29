import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { HostelCard } from "@/components/hostels/HostelCard";
import { HostelDetailModal } from "@/components/hostels/HostelDetailModal";
import { useHostels, Hostel } from "@/hooks/useHostels";
import { useSavedHostelIds } from "@/hooks/useSavedHostels";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Heart, ArrowLeft, Loader2, Building2 } from "lucide-react";
import { ParallaxSection } from "@/components/animations/ParallaxSection";

export default function SavedHostels() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: hostels, isLoading: hostelsLoading } = useHostels();
  const { data: savedHostelIds = [], isLoading: savedLoading } = useSavedHostelIds(user?._id);
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);

  const isLoading = hostelsLoading || savedLoading;
  
  const savedHostels = hostels?.filter(hostel => savedHostelIds.includes(hostel._id)) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <ParallaxSection speed={0.2}>
        <div className="bg-muted/50 border-b border-border">
          <div className="container mx-auto px-4 py-12 text-center relative overflow-hidden">
            <h1 className="text-4xl font-bold tracking-tight mb-4 flex justify-center items-center gap-3">
              <Heart className="h-8 w-8 text-primary fill-primary" />
              Saved Hostels
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Keep track of the accommodations you're interested in before making a decision.
            </p>
          </div>
        </div>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/hostels")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to all hostels
        </Button>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : savedHostels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedHostels.map((hostel) => (
              <HostelCard
                key={hostel._id}
                hostel={hostel}
                onClick={() => setSelectedHostel(hostel)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-xl border border-border">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-xl font-bold mb-2">No saved hostels</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              You haven't saved any hostels yet. Browse the listings and click the heart icon to save your favorites here.
            </p>
            <Button onClick={() => navigate("/hostels")}>
              Browse Hostels
            </Button>
          </div>
        )}
      </div>

      <HostelDetailModal 
        hostel={selectedHostel} 
        open={!!selectedHostel} 
        onOpenChange={(open) => !open && setSelectedHostel(null)} 
      />
    </div>
  );
}
