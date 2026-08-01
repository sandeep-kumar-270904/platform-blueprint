import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RoommateMapViewProps {
  items: any[];
  center: [number, number];
  onViewProfile: (profile: any) => void;
  itemType: 'individual' | 'group';
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export const RoommateMapView: React.FC<RoommateMapViewProps> = ({ items, center, onViewProfile, itemType }) => {
  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden border border-border bg-muted">
      <MapContainer center={center} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <MapUpdater center={center} />
        
        {items.map((item) => {
          if (!item.location || !item.location.coordinates || item.location.coordinates[0] === 0) return null;
          const pos: [number, number] = [item.location.coordinates[1], item.location.coordinates[0]];
          
          return (
            <Marker key={item._id} position={pos}>
              <Popup className="w-[280px]">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                      <img 
                        src={itemType === 'individual' ? item.user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${item.user?.name || 'User'}` : `https://api.dicebear.com/7.x/initials/svg?seed=${item.name || 'Group'}`} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">
                        {itemType === 'individual' ? item.user?.name : item.name}
                      </h4>
                      {itemType === 'individual' && item.compatibilityScore && (
                        <div className="text-xs font-medium text-green-600 bg-green-50 inline-block px-1.5 py-0.5 rounded mt-0.5">
                          {item.compatibilityScore}% Match
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {itemType === 'individual' ? item.bio : item.description}
                  </div>
                  
                  <Button size="sm" className="w-full mt-2 h-8" onClick={() => onViewProfile(item)}>
                    View Details
                  </Button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
