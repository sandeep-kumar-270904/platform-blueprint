import React, { useState } from 'react';
import { useRoomSearchAlerts, RoomSearchAlert, SearchAlertCriteria } from '../../hooks/useRoomSearchAlerts';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Bell, Trash2, Edit2, MapPin, DollarSign, Home, Bed, BellOff } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';

export function SearchAlertsPanel() {
  const { alerts, isLoading, createAlert, updateAlert, deleteAlert } = useRoomSearchAlerts();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<RoomSearchAlert | null>(null);
  
  const [formData, setFormData] = useState<{
    title: string;
    location: string;
    maxRent: string;
    roomType: 'All' | 'Single' | 'Shared' | 'Entire Unit';
    minBeds: string;
    isActive: boolean;
  }>({
    title: '',
    location: '',
    maxRent: '',
    roomType: 'All',
    minBeds: '',
    isActive: true
  });

  const handleOpenDialog = (alert?: RoomSearchAlert) => {
    if (alert) {
      setEditingAlert(alert);
      setFormData({
        title: alert.title,
        location: alert.criteria?.location || '',
        maxRent: alert.criteria?.maxRent ? alert.criteria.maxRent.toString() : '',
        roomType: alert.criteria?.roomType || 'All',
        minBeds: alert.criteria?.minBeds ? alert.criteria.minBeds.toString() : '',
        isActive: alert.isActive
      });
    } else {
      setEditingAlert(null);
      setFormData({
        title: '',
        location: '',
        maxRent: '',
        roomType: 'All',
        minBeds: '',
        isActive: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const criteria: SearchAlertCriteria = {};
    if (formData.location.trim()) criteria.location = formData.location.trim();
    if (formData.maxRent) criteria.maxRent = Number(formData.maxRent);
    if (formData.roomType && formData.roomType !== 'All') criteria.roomType = formData.roomType;
    if (formData.minBeds) criteria.minBeds = Number(formData.minBeds);

    try {
      if (editingAlert) {
        await updateAlert.mutateAsync({
          id: editingAlert._id,
          data: {
            title: formData.title,
            criteria,
            isActive: formData.isActive
          }
        });
      } else {
        await createAlert.mutateAsync({
          title: formData.title,
          criteria,
          isActive: formData.isActive
        });
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error saving alert.');
    }
  };

  const handleToggleActive = async (alert: RoomSearchAlert) => {
    try {
      await updateAlert.mutateAsync({
        id: alert._id,
        data: { isActive: !alert.isActive }
      });
    } catch (err) {
      console.error(err);
      alert('Error updating alert status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this alert?')) {
      try {
        await deleteAlert.mutateAsync(id);
      } catch (err) {
        console.error(err);
        alert('Error deleting alert.');
      }
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading alerts...</div>;
  }

  const activeCount = alerts.length;
  const maxAlerts = 5;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-6 rounded-lg border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Bell className="w-6 h-6 mr-3 text-primary" />
            Search Alerts
          </h2>
          <p className="text-muted-foreground mt-1">
            Get notified when new rooms match your criteria. You can have up to {maxAlerts} active alerts.
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground mb-2">
            {activeCount} / {maxAlerts} Alerts Used
          </div>
          <Button 
            onClick={() => handleOpenDialog()} 
            disabled={activeCount >= maxAlerts}
          >
            Create New Alert
          </Button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-lg border border-dashed">
          <BellOff className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No alerts set up</h3>
          <p className="text-muted-foreground mb-6">Create an alert to get notified about new listings.</p>
          <Button onClick={() => handleOpenDialog()} variant="outline">
            Create First Alert
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {alerts.map(alert => (
            <div key={alert._id} className={`p-6 rounded-lg border bg-card shadow-sm flex flex-col ${!alert.isActive ? 'opacity-60 grayscale' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  {alert.title}
                  {!alert.isActive && <span className="ml-2 text-xs font-normal px-2 py-0.5 bg-muted rounded-full">Inactive</span>}
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 mr-2">
                    <Label htmlFor={`active-${alert._id}`} className="text-xs sr-only">Toggle Active</Label>
                    <Switch 
                      id={`active-${alert._id}`}
                      checked={alert.isActive} 
                      onCheckedChange={() => handleToggleActive(alert)} 
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(alert)}>
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(alert._id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 flex-grow text-sm">
                {alert.criteria?.location && (
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" /> {alert.criteria.location}
                  </div>
                )}
                {alert.criteria?.maxRent && (
                  <div className="flex items-center text-muted-foreground">
                    <DollarSign className="w-4 h-4 mr-2" /> Max ₹{alert.criteria.maxRent}
                  </div>
                )}
                {alert.criteria?.roomType && alert.criteria.roomType !== 'All' && (
                  <div className="flex items-center text-muted-foreground">
                    <Home className="w-4 h-4 mr-2" /> {alert.criteria.roomType}
                  </div>
                )}
                {alert.criteria?.minBeds && (
                  <div className="flex items-center text-muted-foreground">
                    <Bed className="w-4 h-4 mr-2" /> Min {alert.criteria.minBeds} Bed(s)
                  </div>
                )}
                {!alert.criteria?.location && !alert.criteria?.maxRent && !alert.criteria?.roomType && !alert.criteria?.minBeds && (
                  <div className="text-muted-foreground italic">Alerting on all new listings</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingAlert ? 'Edit Search Alert' : 'Create Search Alert'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Alert Title *</Label>
              <Input 
                required 
                placeholder="e.g. Cheap single rooms downtown" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Location</Label>
              <Input 
                placeholder="e.g. Mumbai, Bandra" 
                value={formData.location} 
                onChange={e => setFormData({...formData, location: e.target.value})} 
              />
              <p className="text-xs text-muted-foreground">Leave blank for anywhere</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Rent</Label>
                <Input 
                  type="number" 
                  placeholder="Any" 
                  value={formData.maxRent} 
                  onChange={e => setFormData({...formData, maxRent: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Min Beds</Label>
                <Input 
                  type="number" 
                  placeholder="Any" 
                  value={formData.minBeds} 
                  onChange={e => setFormData({...formData, minBeds: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Room Type</Label>
              <Select value={formData.roomType} onValueChange={(val: any) => setFormData({...formData, roomType: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="Single">Single Room</SelectItem>
                  <SelectItem value="Shared">Shared Room</SelectItem>
                  <SelectItem value="Entire Unit">Entire Unit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full mt-4" disabled={createAlert.isPending || updateAlert.isPending}>
              {createAlert.isPending || updateAlert.isPending ? 'Saving...' : 'Save Alert'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
