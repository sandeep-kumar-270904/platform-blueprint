import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Download, Settings, ChevronLeft, ChevronRight, Clock, Video, FileText, Settings2, Target, ListTodo } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export const PlacementScheduleTab = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showSettings, setShowSettings] = useState(false);

  // Fetch events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['placement-schedule'],
    queryFn: async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/placement-schedule`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch schedule');
      return res.json();
    }
  });

  // Fetch preferences
  const { data: prefs, refetch: refetchPrefs } = useQuery({
    queryKey: ['placement-schedule-prefs'],
    queryFn: async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/placement-schedule/preferences`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch preferences');
      return res.json();
    }
  });

  const generateICS = (eventsToExport: any[]) => {
    // Max limit check for large exports
    if (eventsToExport.length > 1000) {
      toast.warning(`Export is capped at 1000 events to prevent issues. You have ${eventsToExport.length} total events. Try filtering your view before exporting.`);
      eventsToExport = eventsToExport.slice(0, 1000);
    }

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Placement Dashboard//Schedule//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ].join('\r\n') + '\r\n';

    eventsToExport.forEach(evt => {
      const start = new Date(evt.start).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = new Date(evt.end).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      icsContent += [
        'BEGIN:VEVENT',
        `UID:${evt.id}@placement.local`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${evt.title}`,
        `URL:${window.location.origin}${evt.url}`,
        'END:VEVENT'
      ].join('\r\n') + '\r\n';
    });

    icsContent += 'END:VCALENDAR';
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'placement-schedule.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Schedule exported to calendar file.");
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((evt: any) => isSameDay(new Date(evt.start), day));
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add empty slots for days before the 1st of the month
  const startDayOfWeek = monthStart.getDay();
  const paddingDays = Array.from({ length: startDayOfWeek }).map((_, i) => null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mock_interview': return <Video className="w-4 h-4" />;
      case 'oa_simulation': return <Clock className="w-4 h-4" />;
      case 'gd_session': return <Settings2 className="w-4 h-4" />;
      case 'weekly_challenge': return <Target className="w-4 h-4" />;
      case 'referral_followup': return <FileText className="w-4 h-4" />;
      case 'prep_milestone': return <ListTodo className="w-4 h-4" />;
      default: return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const selectedDayEvents = getEventsForDay(selectedDate);

  // Detect overlaps logic
  const checkConflict = (dayEvents: any[], event: any) => {
    const eStart = new Date(event.start).getTime();
    const eEnd = new Date(event.end).getTime();
    return dayEvents.some((other: any) => {
      if (other.id === event.id) return false;
      const oStart = new Date(other.start).getTime();
      const oEnd = new Date(other.end).getTime();
      return (eStart < oEnd && eEnd > oStart);
    });
  };

  const userTimezone = prefs?.quiet_hours?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (isLoading) return <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Schedule</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            All your placement prep events and deadlines in one place.
            <span className="text-xs bg-muted/50 px-2 py-0.5 rounded border">Timezone: {userTimezone}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="w-4 h-4 mr-2" /> Reminders
          </Button>
          <Button onClick={() => generateICS(events)}>
            <Download className="w-4 h-4 mr-2" /> Export All (.ics)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View - Hidden on mobile */}
        <Card className="lg:col-span-2 hidden md:block">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {paddingDays.map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] p-2 rounded-md bg-muted/20 border border-transparent"></div>
              ))}
              {daysInMonth.map((day, i) => {
                const dayEvents = getEventsForDay(day);
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                
                return (
                  <div 
                    key={i} 
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[80px] p-2 rounded-md border cursor-pointer transition-colors relative
                      ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}
                      ${isTodayDate && !isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : ''}
                    `}
                  >
                    <div className={`text-sm font-semibold mb-1 ${isTodayDate ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((evt: any) => (
                        <div 
                          key={evt.id} 
                          className="text-[10px] truncate px-1 py-0.5 rounded text-white"
                          style={{ backgroundColor: evt.color }}
                          title={evt.title}
                        >
                          {evt.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-muted-foreground font-medium px-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Agenda */}
        <Card className="flex flex-col h-full max-h-[600px] lg:col-span-1">
          <CardHeader>
            <CardTitle>{format(selectedDate, 'EEEE, MMMM do')}</CardTitle>
            <CardDescription>
              {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''} scheduled
            </CardDescription>
            {/* Mobile Date Selector */}
            <div className="md:hidden mt-4 flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(subMonths(selectedDate, 1))}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev Day
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(addMonths(selectedDate, 1))}>
                Next Day <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4">
            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-12 px-4 text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Nothing scheduled yet.</p>
                <p className="text-sm mt-2">Book a mock interview or check your weekly plan to get started.</p>
              </div>
            ) : (
              selectedDayEvents.map((evt: any) => {
                const hasConflict = checkConflict(selectedDayEvents, evt);
                return (
                  <div key={evt.id} className={`p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${hasConflict ? 'border-destructive/50 shadow-[0_0_10px_rgba(239,68,68,0.1)] relative overflow-hidden' : ''}`}>
                    {hasConflict && (
                      <div className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-[10px] px-2 py-0.5 font-bold uppercase rounded-bl">
                        Overlap Alert
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 font-medium" style={{ color: evt.color }}>
                        {getTypeIcon(evt.type)}
                        <span className="capitalize">{evt.type.replace('_', ' ')}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2" onClick={(e) => {
                        e.stopPropagation();
                        generateICS([evt]);
                      }}>
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                    <h4 className="font-bold mb-1">{evt.title}</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      {format(new Date(evt.start), 'h:mm a')} - {format(new Date(evt.end), 'h:mm a')}
                    </p>
                    <Button variant="secondary" size="sm" className="w-full" asChild>
                      <Link to={evt.url}>Go to Module</Link>
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
          <div className="p-4 border-t text-xs text-muted-foreground bg-muted/20">
            <span className="font-semibold block mb-1">Export Note:</span>
            Exported .ics files are static point-in-time snapshots and do not automatically update if events are changed or cancelled.
          </div>
        </Card>
      </div>

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reminder Preferences</DialogTitle>
            <DialogDescription>
              Configure how and when you want to be notified about your upcoming schedule.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Daily Digest</Label>
                <p className="text-sm text-muted-foreground">Get one summary notification each morning instead of individual event alerts.</p>
              </div>
              <Switch defaultChecked={prefs?.daily_digest?.enabled ?? true} />
            </div>
            
            <div className="space-y-4 pt-4 border-t opacity-80">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Individual Event Reminders</h4>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Mock Interviews</Label>
                <select className="text-sm border rounded p-1 bg-background" defaultValue="1440">
                  <option value="60">1 hour before</option>
                  <option value="1440">1 day before</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>OA Simulations</Label>
                <select className="text-sm border rounded p-1 bg-background" defaultValue="1440">
                  <option value="60">1 hour before</option>
                  <option value="1440">1 day before</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>GD Practice Sessions</Label>
                <select className="text-sm border rounded p-1 bg-background" defaultValue="120">
                  <option value="120">2 hours before</option>
                  <option value="1440">1 day before</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
            <Button onClick={() => {
              // Mock save
              toast.success("Preferences updated successfully");
              setShowSettings(false);
            }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
