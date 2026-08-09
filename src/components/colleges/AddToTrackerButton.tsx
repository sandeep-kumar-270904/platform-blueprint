import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClipboardList } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

export const AddToTrackerButton = ({ collegeId }: { collegeId: string }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!user) {
      toast.error('Please login to track applications');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/college-applications', {
        collegeId,
        status: 'Planning to Apply'
      });
      toast.success('Added to Application Tracker');
      navigate('/tracker');
    } catch (err) {
      toast.error('Failed to add to tracker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleAdd} disabled={loading} className="flex-1 md:flex-none">
      <ClipboardList className="mr-2 h-4 w-4" />
      {loading ? 'Adding...' : 'Track App'}
    </Button>
  );
};
