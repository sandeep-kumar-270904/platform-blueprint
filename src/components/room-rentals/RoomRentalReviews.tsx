import React, { useState } from 'react';
import { useRoomRentalReviews } from '@/hooks/useRoomRentalReviews';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, Trash2, Edit2, Flag } from 'lucide-react';

interface Props {
  roomId: string;
  ownerId: string;
  canReview: boolean; // Computed from outside: does user have a Responded inquiry?
}

export const RoomRentalReviews: React.FC<Props> = ({ roomId, ownerId, canReview }) => {
  const { user } = useAuth();
  const { getRoomReviews, getOwnerReputation, leaveReview, editReview, deleteReview, reportReview } = useRoomRentalReviews(roomId, ownerId);
  
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading } = getRoomReviews;
  const ownerStats = getOwnerReputation.data;

  if (isLoading) return <div className="text-muted-foreground text-sm py-4">Loading reviews...</div>;

  const reviews = data?.reviews || [];
  const stats = data?.stats || { avgRating: 0, count: 0 };

  const hasReviewed = reviews.some(r => r.reviewer._id === user?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      editReview.mutate({ reviewId: editingId, rating, reviewText }, {
        onSuccess: () => {
          setEditingId(null);
          setRating(5);
          setReviewText('');
        }
      });
    } else {
      leaveReview.mutate({ roomId, rating, reviewText }, {
        onSuccess: () => {
          setRating(5);
          setReviewText('');
        }
      });
    }
  };

  const handleEdit = (r: any) => {
    setEditingId(r._id);
    setRating(r.rating);
    setReviewText(r.reviewText);
  };

  const StarRating = ({ value, onChange }: { value: number, onChange?: (val: number) => void }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            className={`w-4 h-4 ${star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'} ${onChange ? 'cursor-pointer' : ''}`}
            onClick={() => onChange && onChange(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mt-8 border-t pt-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            Reviews <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" /> 
            {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'New'} 
            <span className="text-sm font-normal text-muted-foreground">({stats.count} reviews)</span>
          </h3>
        </div>
        {ownerStats && (
          <div className="text-right">
            <p className="text-sm font-medium">Owner's Reputation</p>
            <div className="flex items-center gap-1 justify-end">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{ownerStats.avgRating > 0 ? ownerStats.avgRating.toFixed(1) : 'N/A'}</span>
              <span className="text-xs text-muted-foreground">({ownerStats.count} total)</span>
            </div>
          </div>
        )}
      </div>

      {user && canReview && !hasReviewed && !editingId && (
        <form onSubmit={handleSubmit} className="bg-muted/30 p-4 rounded-lg mb-6 border space-y-4">
          <div>
            <h4 className="font-semibold text-sm">Leave a Review</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Reviews are based on your inquiry history with this owner to ensure authenticity. A confirmed tenancy is not required.
            </p>
          </div>
          <div>
            <Label>Rating</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <Label>Review</Label>
            <Textarea 
              required 
              value={reviewText} 
              onChange={e => setReviewText(e.target.value)} 
              placeholder="How was the room and your experience with the owner?"
              rows={3}
            />
          </div>
          <Button type="submit" disabled={leaveReview.isPending}>
            {leaveReview.isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      )}

      {editingId && (
        <form onSubmit={handleSubmit} className="bg-primary/5 p-4 rounded-lg mb-6 border border-primary/20 space-y-4">
          <h4 className="font-semibold text-sm">Edit Your Review</h4>
          <div>
            <Label>Rating</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <Label>Review</Label>
            <Textarea 
              required 
              value={reviewText} 
              onChange={e => setReviewText(e.target.value)} 
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={editReview.isPending}>
              {editReview.isPending ? 'Saving...' : 'Update Review'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setRating(5); setReviewText(''); }}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No reviews yet.</p>
        ) : (
          reviews.map(r => (
            <div key={r._id} className="border-b pb-4 last:border-0">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {r.reviewer.profilePicture ? (
                    <img src={r.reviewer.profilePicture} alt="User" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {r.reviewer.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{r.reviewer.name}</p>
                    <StarRating value={r.rating} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                  {user && r.reviewer._id === user.id ? (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(r)}>
                        <Edit2 className="w-3 h-3 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-red-500 hover:bg-red-500/10" onClick={() => {
                        if (confirm('Delete this review?')) deleteReview.mutate({ reviewId: r._id, roomId });
                      }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : user ? (
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-red-500" onClick={() => {
                      const reason = prompt("Report this review (e.g. fake, abusive):");
                      if (reason) {
                        reportReview.mutate({ reviewId: r._id, reason });
                        alert("Review reported to moderation.");
                      }
                    }}>
                      <Flag className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.reviewText}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
