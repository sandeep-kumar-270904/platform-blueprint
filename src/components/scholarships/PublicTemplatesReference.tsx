import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface PublicTemplatesReferenceProps {
  promptType?: string;
}

export const PublicTemplatesReference: React.FC<PublicTemplatesReferenceProps> = ({ promptType = 'general' }) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) fetchTemplates();
  }, [visible, promptType]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Public templates endpoint
      const res = await fetch(`${API_URL}/api/essay-templates?promptType=${promptType}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
      });
      if (res.ok) {
        setTemplates(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) {
    return (
      <Button type="button" variant="outline" className="w-full text-indigo-600 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50" onClick={() => setVisible(true)}>
        <Sparkles className="h-4 w-4 mr-2" /> See how others approached this
      </Button>
    );
  }

  return (
    <div className="space-y-4 border border-indigo-100 bg-indigo-50/30 p-4 rounded-lg mt-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold flex items-center text-indigo-800 text-sm">
          <Sparkles className="h-4 w-4 mr-2" /> Community References
        </h4>
        <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => setVisible(false)}>Hide</Button>
      </div>
      <p className="text-xs text-indigo-700/80 mb-4">
        These are structural summaries shared by peers who successfully won scholarships. Personal details have been removed.
      </p>

      {loading ? (
        <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>
      ) : templates.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">No references available for this prompt type yet.</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
          {templates.map(t => (
            <Card key={t._id} className="border-indigo-100 shadow-sm">
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className="bg-white text-xs">{t.promptType || 'General'}</Badge>
                  {t.fullTextShared && <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">Full Text Available</Badge>}
                </div>
                
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{t.structuralSummary}</p>
                
                {t.fullTextShared && t.fullText && (
                  <div className="mt-3 pt-3 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs w-full justify-between"
                      onClick={() => setExpanded(expanded === t._id ? null : t._id)}
                    >
                      <span>View Original Essay Text</span>
                      {expanded === t._id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                    
                    {expanded === t._id && (
                      <div className="mt-2 p-3 bg-muted/50 rounded text-sm whitespace-pre-wrap italic">
                        "{t.fullText}"
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
