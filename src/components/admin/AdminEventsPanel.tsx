import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Loader2, CheckCircle, XCircle, MoreVertical, Eye, Calendar, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import api from '@/lib/api';

export function AdminEventsPanel() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending_approval');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/events?status=${statusFilter}`);
      // Based on our implementation, this should return a list of events with populated host
      setEvents(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleEventAction = async (id: string, newStatus: string) => {
    try {
      setProcessingId(id);
      // Admin update payload
      await api.put(`/events/${id}`, { status: newStatus });
      toast.success(`Event marked as ${newStatus}`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update event status');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Event Curation</h3>
          <p className="text-muted-foreground text-sm">
            Review and approve user-submitted events to maintain platform quality.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved / Live</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="all">All Events</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Details</TableHead>
                <TableHead>Organizer</TableHead>
                <TableHead>Timing & Format</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No events found matching this status.
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event._id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{event.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Badge variant="outline" className="text-[10px] h-4 py-0 uppercase">{event.eventType}</Badge>
                        {event.tags && event.tags.length > 0 && (
                          <span className="truncate max-w-[150px]">· {event.tags.join(', ')}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{event.hostedBy?.full_name || 'Unknown User'}</div>
                      <div className="text-xs text-muted-foreground">{event.hostedBy?.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm flex flex-col gap-1">
                        <span className="flex items-center text-muted-foreground">
                          <Calendar className="w-3 h-3 mr-1" />
                          {event.startDate ? format(new Date(event.startDate), 'MMM d, yyyy') : 'TBD'}
                        </span>
                        <span className="flex items-center text-muted-foreground">
                          {event.isVirtual ? <Clock className="w-3 h-3 mr-1" /> : <MapPin className="w-3 h-3 mr-1" />}
                          {event.isVirtual ? 'Virtual' : (event.venue || 'TBA')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={
                          event.status === 'approved' ? 'default' : 
                          event.status === 'pending_approval' ? 'secondary' : 
                          event.status === 'rejected' ? 'destructive' : 'outline'
                        }>
                          {event.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="w-fit text-[10px]">{event.lifecycleStatus}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={processingId === event._id}>
                            {processingId === event._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(`/events/${event._id}`, '_blank')}>
                            <Eye className="mr-2 h-4 w-4" /> View Public Page
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {event.status !== 'approved' && (
                            <DropdownMenuItem onClick={() => handleEventAction(event._id, 'approved')} className="text-green-600">
                              <CheckCircle className="mr-2 h-4 w-4" /> Approve Event
                            </DropdownMenuItem>
                          )}
                          {event.status !== 'rejected' && (
                            <DropdownMenuItem onClick={() => handleEventAction(event._id, 'rejected')} className="text-destructive">
                              <XCircle className="mr-2 h-4 w-4" /> Reject Event
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
