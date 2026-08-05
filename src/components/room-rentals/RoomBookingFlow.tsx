import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface RoomBookingFlowProps {
  roomId: string;
  roomTitle: string;
  monthlyRent: number;
  isOpen: boolean;
  onClose: () => void;
}

export function RoomBookingFlow({ roomId, roomTitle, monthlyRent, isOpen, onClose }: RoomBookingFlowProps) {
  const queryClient = useQueryClient();
  const [moveInDate, setMoveInDate] = useState('');
  const [durationMonths, setDurationMonths] = useState(12);

  // Usually deposit is 1 month rent
  const depositAmount = monthlyRent;

  const createBooking = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/room-bookings', {
        roomId,
        moveInDate,
        durationMonths,
        depositAmount
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-bookings-sent'] });
      alert("Booking request sent successfully!");
      onClose();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to send booking request.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveInDate) {
      alert("Please select a move-in date.");
      return;
    }
    createBooking.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request to Book</DialogTitle>
          <DialogDescription>
            {roomTitle}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Move-in Date</Label>
            <Input
              type="date"
              required
              value={moveInDate}
              onChange={(e) => setMoveInDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Duration (Months)</Label>
            <Input
              type="number"
              min={1}
              max={36}
              required
              value={durationMonths}
              onChange={(e) => setDurationMonths(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="p-4 bg-muted rounded-md space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Monthly Rent:</span>
              <span className="font-medium">${monthlyRent}</span>
            </div>
            <div className="flex justify-between">
              <span>Security Deposit:</span>
              <span className="font-medium">${depositAmount}</span>
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t">
              You won't be charged until the owner accepts your request and generates an agreement.
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createBooking.isPending}>
              {createBooking.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
