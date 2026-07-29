import { MapPin } from "lucide-react";

interface EmbeddedMapProps {
  address: string;
}

export const EmbeddedMap = ({ address }: EmbeddedMapProps) => {
  return (
    <div className="w-full h-48 bg-emerald-50/50 border border-emerald-100 rounded-xl overflow-hidden relative flex items-center justify-center">
      {/* Decorative grid pattern to simulate streets */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />
      
      {/* Center Pin */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium shadow-md mb-1 max-w-[200px] truncate">
          {address}
        </div>
        <div className="bg-primary p-2 rounded-full shadow-lg relative animate-bounce">
          <MapPin className="h-6 w-6 text-white" />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45" />
        </div>
        {/* Shadow under pin */}
        <div className="w-6 h-2 bg-black/20 rounded-full mt-2 blur-[2px]" />
      </div>
    </div>
  );
};
