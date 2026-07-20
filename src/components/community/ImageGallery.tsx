import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageGalleryProps {
  images: string[];
}

export const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % images.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
    }
  };

  const renderGrid = () => {
    if (images.length === 1) {
      return (
        <div className="w-full mt-3 rounded-lg overflow-hidden border cursor-pointer hover:opacity-95 transition-opacity" onClick={() => openLightbox(0)}>
          <img src={images[0]} alt="Post attachment" className="w-full h-auto max-h-[500px] object-cover" />
        </div>
      );
    }
    if (images.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-1 mt-3 rounded-lg overflow-hidden border">
          {images.map((img, i) => (
            <div key={i} className="aspect-square cursor-pointer hover:opacity-95 transition-opacity relative" onClick={() => openLightbox(i)}>
              <img src={img} alt={`Post attachment ${i + 1}`} className="w-full h-full object-cover absolute inset-0" />
            </div>
          ))}
        </div>
      );
    }
    if (images.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-1 mt-3 rounded-lg overflow-hidden border h-[400px]">
          <div className="h-full cursor-pointer hover:opacity-95 transition-opacity relative" onClick={() => openLightbox(0)}>
            <img src={images[0]} alt="Post attachment 1" className="w-full h-full object-cover absolute inset-0" />
          </div>
          <div className="grid grid-rows-2 gap-1 h-full">
            <div className="h-full cursor-pointer hover:opacity-95 transition-opacity relative" onClick={() => openLightbox(1)}>
              <img src={images[1]} alt="Post attachment 2" className="w-full h-full object-cover absolute inset-0" />
            </div>
            <div className="h-full cursor-pointer hover:opacity-95 transition-opacity relative" onClick={() => openLightbox(2)}>
              <img src={images[2]} alt="Post attachment 3" className="w-full h-full object-cover absolute inset-0" />
            </div>
          </div>
        </div>
      );
    }
    // 4 or more (max 4 per spec)
    return (
      <div className="grid grid-cols-2 gap-1 mt-3 rounded-lg overflow-hidden border">
        {images.slice(0, 4).map((img, i) => (
          <div key={i} className="aspect-square cursor-pointer hover:opacity-95 transition-opacity relative" onClick={() => openLightbox(i)}>
            <img src={img} alt={`Post attachment ${i + 1}`} className="w-full h-full object-cover absolute inset-0" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {renderGrid()}
      
      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && closeLightbox()}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full p-0 bg-black/95 border-none flex items-center justify-center [&>button]:hidden">
          <DialogTitle className="sr-only">Image Gallery</DialogTitle>
          <DialogDescription className="sr-only">Viewing image {lightboxIndex !== null ? lightboxIndex + 1 : 1} of {images.length}</DialogDescription>
          
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-50 text-white hover:bg-white/20" onClick={closeLightbox}>
            <X className="h-6 w-6" />
          </Button>

          {images.length > 1 && (
            <>
              <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12 rounded-full" onClick={prevImage}>
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12 rounded-full" onClick={nextImage}>
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {lightboxIndex !== null && (
            <div className="w-full h-full flex items-center justify-center p-4" onClick={closeLightbox}>
              <img 
                src={images[lightboxIndex]} 
                alt="Fullscreen" 
                className="max-w-full max-h-full object-contain cursor-default" 
                onClick={e => e.stopPropagation()} 
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
