import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, Trash2, AlertTriangle, MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AdminReviewFlags = () => {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/reviews/flags?status=${filter}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFlags(res.data.flags);
    } catch (err) {
      toast.error('Failed to fetch review flags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.put(`${API_URL}/api/admin/reviews/flags/${id}`, { status }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Flag updated successfully');
      fetchFlags();
    } catch (err) {
      toast.error('Failed to update flag');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="text-warning h-5 w-5" />
            Review Integrity Flags
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Review potentially fraudulent college reviews</p>
        </div>
        <div className="w-48">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed_kept">Reviewed & Kept</SelectItem>
              <SelectItem value="reviewed_deleted">Reviewed & Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading flags...</div>
        ) : flags.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg bg-secondary/20">
            No {filter} flags found.
          </div>
        ) : (
          <div className="space-y-4">
            {flags.map((flag) => (
              <div key={flag._id} className="border rounded-lg p-4 bg-white shadow-sm flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={flag.severity === 'critical' || flag.severity === 'high' ? 'destructive' : 'secondary'}>
                      {flag.severity.toUpperCase()}
                    </Badge>
                    <span className="font-semibold text-sm">College: {flag.collegeId?.name || 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">{new Date(flag.createdAt).toLocaleString()}</span>
                  </div>
                  
                  <div className="bg-red-50 text-red-700 p-2 rounded text-sm border border-red-100 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Reason:</strong> {flag.reason}</span>
                  </div>

                  {flag.reviewId ? (
                    <div className="bg-secondary/20 p-3 rounded-md text-sm border">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <MessageSquare className="h-4 w-4" />
                        <span className="font-semibold text-foreground">Original Review (ID: {flag.reviewId._id})</span>
                      </div>
                      <p className="text-muted-foreground italic mb-2">"{flag.reviewId.reviewText}"</p>
                      <div className="flex gap-2">
                        <Badge variant="outline">Rating: {flag.reviewId.rating} ★</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">Review has been deleted or is unavailable.</div>
                  )}
                </div>

                <div className="flex flex-row md:flex-col gap-2 justify-end min-w-[150px]">
                  {filter === 'pending' && (
                    <>
                      <Button variant="outline" size="sm" className="w-full justify-start text-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => updateStatus(flag._id, 'reviewed_kept')}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Keep Review
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => updateStatus(flag._id, 'reviewed_deleted')}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Review
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
