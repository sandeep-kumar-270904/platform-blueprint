import React, { useState } from 'react';
import { X, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { useSiteContent } from '@/hooks/useSiteContent';

export const AnnouncementBanner = () => {
  const { data, isLoading } = useSiteContent();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || !data?.settings?.announcement?.isVisible || dismissed) {
    return null;
  }

  const { message, type } = data.settings.announcement;

  const bgColors = {
    info: 'bg-blue-600 text-white',
    warning: 'bg-amber-500 text-black',
    error: 'bg-red-600 text-white',
    success: 'bg-green-600 text-white',
  };

  const icons = {
    info: <Info className="h-4 w-4 mr-2" />,
    warning: <AlertTriangle className="h-4 w-4 mr-2" />,
    error: <AlertTriangle className="h-4 w-4 mr-2" />,
    success: <CheckCircle className="h-4 w-4 mr-2" />,
  };

  return (
    <div className={`relative px-4 py-2 flex items-center justify-center text-sm font-medium ${bgColors[type]}`}>
      <div className="flex items-center">
        {icons[type]}
        <span>{message}</span>
      </div>
      <button 
        onClick={() => setDismissed(true)} 
        className="absolute right-4 p-1 rounded-full hover:bg-black/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
