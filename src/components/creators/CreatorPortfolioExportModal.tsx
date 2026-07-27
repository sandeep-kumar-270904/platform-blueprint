import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { CreatorContentItem } from '../../hooks/useCreators';
import { Download, Check, FileText } from 'lucide-react';

interface CreatorPortfolioExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CreatorContentItem[];
  user: any;
}

export const CreatorPortfolioExportModal: React.FC<CreatorPortfolioExportModalProps> = ({ isOpen, onClose, items, user }) => {
  const publishedItems = items.filter(i => i.status === 'published');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(publishedItems.map(i => i._id)));
  const printRef = useRef<HTMLDivElement>(null);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleExport = () => {
    // A simple approach using the browser's native print functionality
    // We will render a hidden print-only section in this component and trigger print
    window.print();
  };

  const selectedItems = publishedItems.filter(i => selectedIds.has(i._id));

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Export Portfolio</DialogTitle>
            <DialogDescription>
              Select the content you want to include in your shareable portfolio document.
            </DialogDescription>
          </DialogHeader>

          {publishedItems.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>You have no published content to export.</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] border rounded-md p-4 mt-4">
              <div className="space-y-4">
                {publishedItems.map(item => (
                  <div key={item._id} className="flex items-start space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                    <Checkbox 
                      id={`export-${item._id}`}
                      checked={selectedIds.has(item._id)}
                      onCheckedChange={() => toggleSelection(item._id)}
                    />
                    <div className="grid gap-1.5 leading-none flex-1">
                      <label htmlFor={`export-${item._id}`} className="font-medium cursor-pointer flex items-center gap-2">
                        {item.title}
                      </label>
                      <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                      <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                        <span>{item.type.toUpperCase()}</span>
                        <span>{item.views} Views</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-muted-foreground">
              {selectedIds.size} of {publishedItems.length} selected
            </p>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleExport} disabled={selectedIds.size === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden Print Layout */}
      <div className="hidden print:block absolute top-0 left-0 w-full bg-white text-black p-8" style={{ minHeight: '100vh', zIndex: 9999 }}>
        <div className="max-w-4xl mx-auto">
          <div className="border-b-2 border-gray-200 pb-6 mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">{user?.name}'s Portfolio</h1>
            <p className="text-gray-500 text-lg">Curated Content Highlights</p>
          </div>
          
          <div className="space-y-12">
            {selectedItems.map((item, index) => (
              <div key={item._id} className="break-inside-avoid border rounded-lg p-6 bg-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{item.title}</h2>
                    <p className="text-sm text-gray-500 mt-1 uppercase tracking-wider">{item.type} • {new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{item.views.toLocaleString()} Views</p>
                    <p className="text-sm text-gray-500">{item.likes.toLocaleString()} Likes</p>
                  </div>
                </div>
                
                {item.description && (
                  <p className="text-gray-700 italic mb-4 border-l-4 border-gray-300 pl-4 py-1">
                    {item.description}
                  </p>
                )}
                
                <div className="prose max-w-none text-gray-800 text-sm line-clamp-6">
                  {item.body.substring(0, 500)}{item.body.length > 500 ? '...' : ''}
                </div>
                
                {item.tags && item.tags.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-400 text-sm">
            Generated from Creators Zone • {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </>
  );
};
