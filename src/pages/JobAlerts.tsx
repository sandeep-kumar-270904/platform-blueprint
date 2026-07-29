import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { EmptyState } from '@/components/ui/EmptyState';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface JobAlert {
  _id: string;
  name: string;
  criteria: {
    keywords?: string;
    location?: string;
    workMode?: string;
    jobType?: string;
  };
  frequency: 'instant' | 'daily';
  active: boolean;
  createdAt: string;
}

const JobAlerts: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/job-alerts/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error('Failed to fetch job alerts', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAlert = async (id: string, currentActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/job-alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ active: !currentActive })
      });
      if (res.ok) {
        setAlerts(alerts.map(a => a._id === id ? { ...a, active: !currentActive } : a));
        toast({
          title: "Alert updated",
          description: `Job alert has been ${!currentActive ? 'enabled' : 'disabled'}.`
        });
      }
    } catch (err) {
      console.error('Failed to toggle alert', err);
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/job-alerts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAlerts(alerts.filter(a => a._id !== id));
        toast({
          title: "Alert deleted",
          description: "Your job alert has been removed."
        });
      }
    } catch (err) {
      console.error('Failed to delete alert', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/jobs')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Alerts</h1>
          <p className="text-gray-500">Manage your saved searches and notification preferences.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Card key={i} className="h-32 animate-pulse" />)}
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-12 w-12 text-gray-300" />}
          title="No job alerts yet"
          description="Save a search from the Jobs Portal to get notified about new opportunities."
          action={{ label: 'Explore Jobs', onClick: () => navigate('/jobs') }}
        />
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => (
            <Card key={alert._id} className={!alert.active ? 'opacity-60' : ''}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {alert.active ? <Bell className="h-4 w-4 text-blue-500" /> : <BellOff className="h-4 w-4 text-gray-400" />}
                    {alert.name}
                  </CardTitle>
                  <CardDescription>
                    Notifies {alert.frequency === 'instant' ? 'instantly' : 'daily'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{alert.active ? 'On' : 'Off'}</span>
                    <Switch
                      checked={alert.active}
                      onCheckedChange={() => toggleAlert(alert._id, alert.active)}
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteAlert(alert._id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm bg-gray-50 p-3 rounded-md mt-2 flex flex-wrap gap-x-6 gap-y-2">
                  {alert.criteria.keywords && <div><strong>Keywords:</strong> {alert.criteria.keywords}</div>}
                  {alert.criteria.location && <div><strong>Location:</strong> {alert.criteria.location}</div>}
                  {alert.criteria.workMode && <div className="capitalize"><strong>Mode:</strong> {alert.criteria.workMode}</div>}
                  {alert.criteria.jobType && <div className="capitalize"><strong>Type:</strong> {alert.criteria.jobType.replace('-', ' ')}</div>}
                  {!alert.criteria.keywords && !alert.criteria.location && !alert.criteria.workMode && !alert.criteria.jobType && (
                    <div>All Jobs</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobAlerts;
