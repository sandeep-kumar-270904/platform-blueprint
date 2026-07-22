import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Search, Calendar, Star, Clock, Video, User, X } from 'lucide-react';
import { 
  useMentors, 
  useMyMockBookings, 
  useMentorAvailability, 
  useBookMockInterview,
  useCancelMockBooking,
  MentorProfile,
  BookingSlot,
  MockBooking
} from '../hooks/useMockInterviews';
import { format, parseISO, addHours } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

const MockInterviews = () => {
  const [activeTab, setActiveTab] = useState<'browse' | 'my-bookings'>('browse');
  const [filter, setFilter] = useState('');
  
  const { data: interviewers, isLoading } = useMentors(filter);
  const { data: myBookings, isLoading: isBookingsLoading } = useMyMockBookings();
  
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [isBookingModalOpen, setBookingModalOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
            Mock Interviews
          </h1>
          <p className="text-zinc-400 mt-2">Practice with industry professionals and get actionable feedback.</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={activeTab === 'browse' ? 'default' : 'outline'}
            onClick={() => setActiveTab('browse')}
          >
            Find a Professional
          </Button>
          <Button 
            variant={activeTab === 'my-bookings' ? 'default' : 'outline'}
            onClick={() => setActiveTab('my-bookings')}
          >
            My Bookings {myBookings && myBookings.length > 0 && `(${myBookings.length})`}
          </Button>
        </div>
      </div>

      {activeTab === 'browse' && (
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button variant={filter === '' ? 'default' : 'secondary'} onClick={() => setFilter('')} size="sm">All</Button>
            <Button variant={filter === 'Technical Interview' ? 'default' : 'secondary'} onClick={() => setFilter('Technical Interview')} size="sm">Technical</Button>
            <Button variant={filter === 'HR Interview' ? 'default' : 'secondary'} onClick={() => setFilter('HR Interview')} size="sm">HR / Behavioral</Button>
            <Button variant={filter === 'System Design' ? 'default' : 'secondary'} onClick={() => setFilter('System Design')} size="sm">System Design</Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse bg-zinc-900/50 border-zinc-800/50">
                  <CardHeader className="h-32 bg-zinc-800/50 rounded-t-lg" />
                  <CardContent className="h-48" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {interviewers?.map((interviewer) => (
                <Card key={interviewer._id} className="bg-zinc-900/80 border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <img 
                        src={interviewer.profile?.avatar_url || `https://ui-avatars.com/api/?name=${interviewer.profile?.full_name}&background=random`}
                        alt={interviewer.profile?.full_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-zinc-800"
                      />
                      <div>
                        <h3 className="font-semibold text-lg">{interviewer.profile?.full_name}</h3>
                        <p className="text-zinc-400 text-sm">{interviewer.title} at {interviewer.company}</p>
                        <div className="flex items-center gap-1 mt-1 text-sm text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span>{interviewer.rating?.toFixed(1) || 'New'}</span>
                          <span className="text-zinc-500">({interviewer.reviewsCount || 0} reviews)</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="mt-4 text-zinc-300 text-sm line-clamp-2">{interviewer.bio}</p>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      {interviewer.expertise?.slice(0, 3).map((exp, i) => (
                        <Badge key={i} variant="secondary" className="bg-zinc-800 hover:bg-zinc-700">
                          {exp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 bg-zinc-950/50 border-t border-zinc-800 flex justify-between items-center">
                    <div className="text-sm text-zinc-400 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> 60 min session
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => {
                        setSelectedMentor(interviewer);
                        setBookingModalOpen(true);
                      }}
                    >
                      Book Session
                    </Button>
                  </div>
                </Card>
              ))}
              
              {interviewers?.length === 0 && (
                <div className="col-span-full py-12 text-center text-zinc-500">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No professionals found for the selected category.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'my-bookings' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myBookings?.filter(b => ['requested', 'confirmed'].includes(b.status)).map(booking => (
              <BookingCard key={booking._id} booking={booking} />
            ))}
            
            {myBookings?.filter(b => ['requested', 'confirmed'].includes(b.status)).length === 0 && (
              <p className="text-zinc-500">No upcoming sessions.</p>
            )}
          </div>
          
          <h2 className="text-xl font-semibold mt-12">Past Sessions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-75">
            {myBookings?.filter(b => ['completed', 'cancelled', 'no-show'].includes(b.status)).map(booking => (
              <BookingCard key={booking._id} booking={booking} />
            ))}
            
            {myBookings?.filter(b => ['completed', 'cancelled', 'no-show'].includes(b.status)).length === 0 && (
              <p className="text-zinc-500">No past sessions.</p>
            )}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Book Mock Interview</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Select an available time slot with {selectedMentor?.profile?.full_name}.
            </DialogDescription>
          </DialogHeader>
          
          {selectedMentor && (
            <BookingFlow 
              mentor={selectedMentor} 
              onClose={() => setBookingModalOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Booking Flow Component
const BookingFlow = ({ mentor, onClose }: { mentor: MentorProfile, onClose: () => void }) => {
  const { data: slots, isLoading } = useMentorAvailability(mentor._id);
  const bookMutation = useBookMockInterview();
  
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // Group slots by day
  const groupedSlots = slots?.reduce((acc, slot) => {
    if (slot.is_booked) return acc;
    const day = format(parseISO(slot.starts_at), 'MMM d, yyyy');
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {} as Record<string, BookingSlot[]>) || {};

  const handleBook = () => {
    if (!selectedSlot) return;
    bookMutation.mutate({
      mentorId: mentor._id,
      scheduledAt: selectedSlot,
      menteeNotes: notes
    }, {
      onSuccess: () => {
        toast.success('Session booked successfully!');
        onClose();
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to book session');
      }
    });
  };

  return (
    <div className="mt-4 space-y-6">
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : Object.keys(groupedSlots).length === 0 ? (
        <div className="text-center p-8 text-zinc-400">
          No available slots in the next 14 days.
        </div>
      ) : (
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {Object.entries(groupedSlots).map(([day, daySlots]) => (
            <div key={day}>
              <h4 className="text-sm font-medium text-zinc-400 mb-2 sticky top-0 bg-zinc-900 py-1">{day}</h4>
              <div className="grid grid-cols-3 gap-2">
                {daySlots.map(slot => (
                  <Button
                    key={slot.id}
                    variant={selectedSlot === slot.starts_at ? 'default' : 'outline'}
                    className={`text-xs ${selectedSlot === slot.starts_at ? '' : 'border-zinc-700 bg-zinc-800'}`}
                    onClick={() => setSelectedSlot(slot.starts_at)}
                  >
                    {format(parseISO(slot.starts_at), 'h:mm a')}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSlot && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div>
            <Label htmlFor="notes">Notes for interviewer (Optional)</Label>
            <Textarea 
              id="notes"
              placeholder="E.g., I'd like to focus on dynamic programming problems..."
              className="bg-zinc-950 border-zinc-800 mt-1 resize-none"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-sm text-blue-200">Selected Time</p>
              <p className="font-semibold text-blue-100">
                {format(parseISO(selectedSlot), 'MMM d, h:mm a')}
              </p>
            </div>
            <Button 
              onClick={handleBook}
              disabled={bookMutation.isPending}
            >
              {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Booking Card Component
const BookingCard = ({ booking }: { booking: MockBooking }) => {
  const cancelMutation = useCancelMockBooking();
  const date = parseISO(booking.scheduledAt);
  const isUpcoming = ['requested', 'confirmed'].includes(booking.status);
  
  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this session?')) {
      cancelMutation.mutate({ bookingId: booking._id, reason: 'Mentee cancelled' }, {
        onSuccess: () => toast.success('Session cancelled')
      });
    }
  };

  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{booking.mentor_profile?.full_name}</CardTitle>
            <CardDescription>{booking.mentor?.title} at {booking.mentor?.company}</CardDescription>
          </div>
          <Badge variant={
            booking.status === 'confirmed' ? 'default' : 
            booking.status === 'cancelled' ? 'destructive' : 
            'secondary'
          } className="capitalize">
            {booking.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-zinc-300">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>{format(date, 'MMM d, yyyy')} at {format(date, 'h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>{booking.durationMinutes} minutes</span>
          </div>
          {booking.meetingLink && isUpcoming && (
            <div className="flex items-center gap-2 text-zinc-300 mt-2 p-3 bg-zinc-950 rounded border border-zinc-800">
              <Video className="w-4 h-4 text-emerald-400" />
              <a href={booking.meetingLink} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline truncate">
                Join Meeting Link
              </a>
            </div>
          )}
          
          {isUpcoming && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-800">
              <Button 
                variant="destructive" 
                size="sm" 
                className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20"
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
              >
                Cancel Session
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MockInterviews;
