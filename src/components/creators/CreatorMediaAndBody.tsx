import React, { useState } from "react";
import { AlertCircle, ExternalLink, Code } from "lucide-react";

// Helper to render YouTube/Vimeo or Images safely with accessible markup
export const MediaEmbedViewer: React.FC<{ url?: string; title?: string }> = ({ url, title }) => {
  const [hasError, setHasError] = useState(false);
  if (!url || !url.trim()) return null;
  const cleanUrl = url.trim();

  if (hasError) {
    return (
      <div role="alert" className="p-4 bg-muted/30 rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground flex items-center justify-center gap-2 my-3">
        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
        <span className="break-all">Media preview unavailable or invalid URL ({cleanUrl.substring(0, 40)}...)</span>
      </div>
    );
  }

  // Check YouTube
  const ytMatch = cleanUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return (
      <div className="my-4 rounded-xl overflow-hidden shadow-md border border-border/60 aspect-video bg-black max-w-full">
        <iframe
          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
          title={title ? `${title} (YouTube video)` : "YouTube video player"}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  // Check Vimeo
  const vimeoMatch = cleanUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/);
  if (vimeoMatch && vimeoMatch[3]) {
    return (
      <div className="my-4 rounded-xl overflow-hidden shadow-md border border-border/60 aspect-video bg-black max-w-full">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoMatch[3]}`}
          title={title ? `${title} (Vimeo video)` : "Vimeo video player"}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  // Check Image
  if (cleanUrl.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)(?:\?.*)?$/i) || cleanUrl.startsWith("data:image/") || cleanUrl.startsWith("http")) {
    return (
      <div className="my-4 rounded-xl overflow-hidden border border-border/60 max-h-[450px] bg-muted/20 flex items-center justify-center">
        <img 
          src={cleanUrl} 
          alt={title ? `Attachment for ${title}` : "Content attachment preview"} 
          onError={() => setHasError(true)}
          className="max-h-[450px] w-auto object-contain mx-auto max-w-full"
        />
      </div>
    );
  }

  return (
    <div className="p-3 bg-muted/20 rounded-xl border border-border/40 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2 my-3">
      <div className="flex items-center gap-2 truncate">
        <ExternalLink className="h-4 w-4 text-primary shrink-0" />
        <span className="truncate">{cleanUrl}</span>
      </div>
      <a 
        href={cleanUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="font-semibold text-primary hover:underline shrink-0 ml-0 sm:ml-2 min-h-[36px] flex items-center"
        aria-label={`Open external media link: ${cleanUrl}`}
      >
        Open Link →
      </a>
    </div>
  );
};

// Helper to format text with code blocks cleanly
export const FormattedBodyRenderer: React.FC<{ text?: string }> = ({ text }) => {
  if (!text) return null;

  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-3 leading-relaxed text-foreground/90 whitespace-pre-wrap font-normal text-sm sm:text-base break-words">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const content = part.slice(3, -3);
          const firstLineEnd = content.indexOf("\n");
          const lang = firstLineEnd > -1 ? content.slice(0, firstLineEnd).trim() : "";
          const code = firstLineEnd > -1 ? content.slice(firstLineEnd + 1) : content;
          return (
            <div key={index} className="my-3 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 text-slate-100 shadow-sm font-mono text-xs max-w-full">
              {lang && (
                <div className="bg-slate-900 px-3 py-1.5 text-[11px] text-slate-400 border-b border-slate-800 flex items-center justify-between">
                  <span>{lang.toUpperCase()}</span>
                  <Code className="h-3 w-3 text-slate-500" />
                </div>
              )}
              <pre className="p-3.5 overflow-x-auto leading-normal scrollbar-thin">
                <code>{code}</code>
              </pre>
            </div>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};
