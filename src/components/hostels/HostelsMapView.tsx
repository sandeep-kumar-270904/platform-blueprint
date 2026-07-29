import { useState } from "react";
import { Hostel } from "@/hooks/useHostels";
import { MapPin, Bed, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HostelsMapViewProps {
  hostels: Hostel[];
  onSelectHostel: (hostel: Hostel) => void;
}

export const HostelsMapView = ({ hostels, onSelectHostel }: HostelsMapViewProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Generate deterministic "random" coordinates for mock pins based on hostel ID
  const getCoordinates = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const x = Math.abs((hash % 80) + 10); // 10% to 90%
    const y = Math.abs(((hash >> 4) % 80) + 10); // 10% to 90%
    return { x, y };
  };

  return (
    <div className="w-full h-[600px] bg-slate-50 border rounded-xl overflow-hidden relative">
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Decorative "Parks" and "Water" */}
      <div className="absolute top-[20%] left-[10%] w-[30%] h-[40%] bg-emerald-100/30 rounded-3xl blur-2xl pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-[40%] h-[30%] bg-blue-100/30 rounded-3xl blur-2xl pointer-events-none" />

      {/* Pins */}
      {hostels.map(hostel => {
        const coords = getCoordinates(hostel._id);
        const isHovered = hoveredId === hostel._id;

        return (
          <div 
            key={hostel._id}
            className="absolute z-10 transition-all duration-200"
            style={{ 
              left: `${coords.x}%`, 
              top: `${coords.y}%`,
              transform: 'translate(-50%, -100%)',
              zIndex: isHovered ? 50 : 10
            }}
            onMouseEnter={() => setHoveredId(hostel._id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onSelectHostel(hostel)}
          >
            {/* The Pin */}
            <div className={`relative flex flex-col items-center cursor-pointer transition-transform ${isHovered ? 'scale-125' : 'scale-100 hover:scale-110'} ${hostel.isFull ? 'opacity-80 grayscale' : ''}`}>
              <div className={`${hostel.isFull ? 'bg-destructive' : 'bg-primary'} text-primary-foreground p-1.5 rounded-full shadow-lg relative`}>
                <MapPin className="h-5 w-5" />
                <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 ${hostel.isFull ? 'bg-destructive' : 'bg-primary'} rotate-45`} />
              </div>
              
              {/* Mini Preview Card (visible on hover) */}
              {isHovered && (
                <Card className="absolute top-full mt-3 w-48 overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
                  <div className="h-24 bg-muted relative">
                    {hostel.photos?.[0] ? (
                      <img src={`http://localhost:5000${hostel.photos[0]}`} alt={hostel.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full opacity-20"><Bed className="h-8 w-8" /></div>
                    )}
                    <Badge className="absolute top-2 right-2 text-[10px] px-1.5 py-0 shadow-sm border-none bg-background/90 text-foreground">
                      {hostel.type}
                    </Badge>
                    {hostel.isFull && (
                      <Badge variant="destructive" className="absolute top-2 left-2 text-[10px] px-1.5 py-0 uppercase shadow-sm">
                        Full
                      </Badge>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-sm line-clamp-1">{hostel.name}</h4>
                    <p className="text-primary font-bold text-sm mt-1">₹{hostel.pricing.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <Users className="h-3 w-3 mr-1" /> {hostel.availableBeds} beds left
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
