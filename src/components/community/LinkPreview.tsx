import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface LinkPreviewData {
  title: string;
  description: string;
  image: string;
  siteName: string;
  url: string;
}

export const LinkPreview = ({ preview }: { preview?: LinkPreviewData }) => {
  if (!preview || (!preview.title && !preview.image)) return null;

  return (
    <a href={preview.url} target="_blank" rel="noopener noreferrer" className="block mt-3 no-underline group">
      <Card className="overflow-hidden hover:border-primary/50 transition-colors bg-secondary/10">
        <div className="flex flex-col sm:flex-row h-full">
          {preview.image && (
            <div className="sm:w-32 sm:h-auto h-48 bg-muted shrink-0 overflow-hidden relative border-r">
              <img src={preview.image} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
          )}
          <CardContent className="p-3 flex-1 min-w-0 flex flex-col justify-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              {preview.siteName || new URL(preview.url).hostname}
            </div>
            <h4 className="text-sm font-semibold line-clamp-1 mb-1">{preview.title || preview.url}</h4>
            {preview.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{preview.description}</p>
            )}
          </CardContent>
        </div>
      </Card>
    </a>
  );
};
