import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, History, RotateCcw, Clock } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ResumeHistoryProps {
  resumeId: string;
  onRestore: () => void;
}

export const ResumeHistory = ({ resumeId, onRestore }: ResumeHistoryProps) => {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    fetchVersions();
  }, [resumeId]);

  const fetchVersions = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}/versions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!confirm('Are you sure you want to restore this version? Your current state will be saved as a new version.')) return;
    
    setRestoringId(versionId);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}/versions/${versionId}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to restore');
      
      toast.success('Version restored successfully');
      onRestore(); // trigger parent reload
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRestoringId(null);
    }
  };

  if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  if (versions.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <History className="w-12 h-12 mx-auto mb-2 opacity-20" />
        <p>No history found.</p>
        <p className="text-xs mt-1">Versions are saved automatically when you use "Score with AI" or Explicit Save.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {versions.map(v => (
        <div key={v._id} className="border p-4 rounded-lg flex flex-col gap-2 hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                Version {v.versionNumber}
              </h4>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                {new Date(v.createdAt).toLocaleString()}
              </p>
            </div>
            {v.atsScoreAtVersion?.score && (
              <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-1 rounded">
                ATS: {v.atsScoreAtVersion.score}
              </span>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2" 
            onClick={() => handleRestore(v._id)}
            disabled={restoringId === v._id}
          >
            {restoringId === v._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RotateCcw className="w-4 h-4 mr-2" /> Restore this version</>}
          </Button>
        </div>
      ))}
    </div>
  );
};
