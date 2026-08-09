import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, List, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const SaveComparisonButton = ({ collegeIds }: { collegeIds: string[] }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to save comparisons');
      return;
    }
    if (collegeIds.length < 2) {
      toast.error('Need at least 2 colleges to save a comparison');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/colleges/comparisons`, {
        name,
        collegeIds
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Comparison saved successfully');
      setOpen(false);
      setName('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save comparison');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Save className="h-4 w-4 mr-2" /> Save Set
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Comparison Set</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Set Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. Top Engineering Colleges" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const SavedComparisonsDialog = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [sets, setSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadSets = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/colleges/comparisons`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadSets();
  }, [open, user]);

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/colleges/comparisons/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSets(sets.filter(s => s._id !== id));
      toast.success('Deleted saved comparison');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleLoad = (collegeIds: string[]) => {
    setOpen(false);
    navigate(`/compare?ids=${collegeIds.join(',')}`);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <List className="h-4 w-4 mr-2" /> Saved Sets
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Saved Comparisons</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : sets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">You have no saved comparisons.</p>
          ) : (
            sets.map(set => (
              <div key={set._id} className="border border-border rounded-lg p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-lg">{set.name}</h4>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(set._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {set.colleges.map((c: any) => (
                    <span key={c._id} className="bg-muted px-2 py-1 rounded">
                      {c.name}
                    </span>
                  ))}
                </div>
                <div className="flex justify-end mt-2">
                  <Button size="sm" onClick={() => handleLoad(set.colleges.map((c:any) => c._id))}>
                    Load Comparison
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
