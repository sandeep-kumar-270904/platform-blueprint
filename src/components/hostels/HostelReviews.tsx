import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useHostelReviews, useCreateHostelReview, useUpdateHostelReview, useDeleteHostelReview, useReportHostelReview, HostelReview } from '@/hooks/useHostelReviews';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star, MoreVertical, Trash2, Edit2, Flag, AlertCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HostelReviewsProps {
  hostelId: string;
}

export function HostelReviews({ hostelId }: HostelReviewsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: reviews, isLoading, error } = useHostelReviews(hostelId);
  const createMutation = useCreateHostelReview();
  const updateMutation = useUpdateHostelReview();
  const deleteMutation = useDeleteHostelReview();
  const reportMutation = useReportHostelReview();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');

  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (rating === 0) {
      setFormError('Please select a star rating');
      return;
    }
    
    createMutation.mutate(
      { hostelId, rating, comment },
      {
        onSuccess: () => {
          setRating(0);
          setComment('');
          toast({ title: 'Review submitted successfully' });
        },
        onError: (err: any) => {
          setFormError(err.message);
        }
      }
    );
  };

  const handleUpdate = (reviewId: string) => {
    updateMutation.mutate(
      { reviewId, rating: editRating, comment: editComment },
      {
        onSuccess: () => {
          setEditingId(null);
          toast({ title: 'Review updated' });
        }
      }
    );
  };

  const handleDelete = (reviewId: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      deleteMutation.mutate(reviewId, {
        onSuccess: () => toast({ title: 'Review deleted' })
      });
    }
  };

  const handleReport = (reviewId: string) => {
    if (confirm('Report this review as abusive or fake?')) {
      reportMutation.mutate(
        { reviewId, reason: 'Abusive or Fake Review' },
        {
          onSuccess: () => toast({ title: 'Review reported successfully' }),
          onError: (err: any) => toast({ variant: 'destructive', title: err.message })
        }
      );
    }
  };

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading reviews...</div>;

  const userReview = reviews?.find(r => r.userId._id === user?.id);

  return (
    <div className="space-y-6 mt-8">
      <h3 className="text-xl font-bold">Reviews & Ratings</h3>
      
      {/* Leave a review form (only if logged in and hasn't reviewed yet) */}
      {user && !userReview && (
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-4">Leave a Review</h4>
            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="focus:outline-none"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`w-6 h-6 ${(hoverRating || rating) >= star ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Share your experience at this hostel..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                rows={3}
              />
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Submitting...' : 'Submit Review'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews?.length === 0 ? (
          <p className="text-muted-foreground italic">No reviews yet. Be the first to review!</p>
        ) : (
          reviews?.map((review) => (
            <Card key={review._id}>
              <CardContent className="p-4">
                {editingId === review._id ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="focus:outline-none"
                          onClick={() => setEditRating(star)}
                        >
                          <Star
                            className={`w-5 h-5 ${editRating >= star ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`}
                          />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => handleUpdate(review._id)} disabled={updateMutation.isPending}>
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={`http://localhost:5000${review.userId.avatar_url}`} />
                      <AvatarFallback>{review.userId.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{review.userId.full_name}</p>
                          <p className="text-xs text-muted-foreground">{review.userId.university || 'Student'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </span>
                          
                          {user && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {user.id === review.userId._id ? (
                                  <>
                                    <DropdownMenuItem onClick={() => {
                                      setEditingId(review._id);
                                      setEditRating(review.rating);
                                      setEditComment(review.comment);
                                    }}>
                                      <Edit2 className="h-4 w-4 mr-2" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(review._id)}>
                                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleReport(review._id)}>
                                    <Flag className="h-4 w-4 mr-2" /> Report
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center mt-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${review.rating >= star ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`}
                          />
                        ))}
                      </div>
                      
                      <p className="text-sm whitespace-pre-wrap">{review.comment}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
