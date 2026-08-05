import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, CreditCard, Check, X } from 'lucide-react';
import { format } from 'date-fns';

export function RoomBookingManagement({ type }: { type: 'owner' | 'renter' }) {
  const queryClient = useQueryClient();
  const endpoint = type === 'owner' ? '/room-bookings/owner' : '/room-bookings/renter';
  const queryKey = type === 'owner' ? ['room-bookings-received'] : ['room-bookings-sent'];

  const { data: bookings, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get(endpoint);
      return data;
    }
  });

  const respondMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string, status: string }) => {
      const { data } = await api.put(`/room-bookings/${bookingId}/respond`, { status });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { data } = await api.put(`/room-bookings/${bookingId}/cancel`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });

  const generateAgreement = useMutation({
    mutationFn: async (bookingId: string) => {
      const { data } = await api.post(`/room-agreements/generate`, { bookingId });
      return data;
    },
    onSuccess: () => {
      alert("Agreement generated successfully!");
      // We could invalidate agreements query here if we display it inline
    }
  });

  const payMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { data } = await api.put(`/room-bookings/${bookingId}/pay`);
      return data;
    },
    onSuccess: () => {
      alert("Payment successful (sandbox mode)!");
      queryClient.invalidateQueries({ queryKey });
    }
  });

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

  if (!bookings || bookings.length === 0) {
    return <div className="text-center p-8 text-muted-foreground">No bookings found.</div>;
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking: any) => (
        <Card key={booking._id}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">{booking.room?.title || 'Unknown Room'}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Move-in: {format(new Date(booking.moveInDate), 'PP')} • {booking.durationMonths} months
              </p>
            </div>
            <Badge variant={
              booking.status === 'Accepted' ? 'default' :
              booking.status === 'Rejected' ? 'destructive' :
              booking.status === 'Cancelled' ? 'secondary' : 'outline'
            }>
              {booking.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm">
                <span className="font-medium">{type === 'owner' ? 'Renter' : 'Owner'}:</span>{' '}
                {type === 'owner' ? booking.renter?.name : booking.owner?.name}
              </div>
              <div className="space-x-2">
                {type === 'owner' && booking.status === 'Pending' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => respondMutation.mutate({ bookingId: booking._id, status: 'Rejected' })}>
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                    <Button size="sm" onClick={() => respondMutation.mutate({ bookingId: booking._id, status: 'Accepted' })}>
                      <Check className="w-4 h-4 mr-1" /> Accept
                    </Button>
                  </>
                )}
                {type === 'owner' && booking.status === 'Accepted' && (
                  <Button size="sm" variant="secondary" onClick={() => generateAgreement.mutate(booking._id)} disabled={generateAgreement.isPending}>
                    <FileText className="w-4 h-4 mr-1" /> Generate Agreement
                  </Button>
                )}
                {type === 'renter' && ['Pending', 'Accepted'].includes(booking.status) && (
                  <Button size="sm" variant="outline" onClick={() => cancelMutation.mutate(booking._id)}>
                    Cancel
                  </Button>
                )}
                {type === 'renter' && booking.status === 'Accepted' && booking.paymentStatus === 'Pending' && (
                  <Button size="sm" onClick={() => payMutation.mutate(booking._id)} disabled={payMutation.isPending}>
                    <CreditCard className="w-4 h-4 mr-1" /> Pay Deposit (${booking.depositAmount})
                  </Button>
                )}
                {booking.paymentStatus === 'Paid' && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Deposit Paid</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
