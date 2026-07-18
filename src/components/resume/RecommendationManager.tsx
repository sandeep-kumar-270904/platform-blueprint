import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, Eye, EyeOff } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';

export const RecommendationManager: React.FC = () => {
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/recommendations/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setRequests(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRequest = async () => {
    if (!email || !relationship) return;
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/recommendations/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ externalEmail: email, relationship })
      });
      if (res.ok) {
        setEmail('');
        setRelationship('');
        fetchRequests();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/recommendations/${id}/publish`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isPublished: !currentStatus })
      });
      if (res.ok) fetchRequests();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Request Recommendation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input 
            placeholder="Recommender Email (External)" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
          />
          <Select value={relationship} onValueChange={setRelationship}>
            <SelectTrigger><SelectValue placeholder="Relationship" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Manager">Manager</SelectItem>
              <SelectItem value="Professor">Professor</SelectItem>
              <SelectItem value="Colleague">Colleague</SelectItem>
              <SelectItem value="Client">Client</SelectItem>
              <SelectItem value="Mentor">Mentor</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRequest} disabled={loading || !email || !relationship}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Send className="h-4 w-4 mr-2"/>}
            Send Request
          </Button>
        </CardContent>
      </Card>

      {requests.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-md">My Recommendations</h3>
          {requests.map(r => (
            <Card key={r._id}>
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{r.writtenBy ? r.writtenBy.name : r.externalEmail}</p>
                    <p className="text-sm text-muted-foreground">{r.relationship}</p>
                    <span className="inline-block mt-2 text-xs font-semibold uppercase px-2 py-1 bg-muted rounded-full">
                      {r.status}
                    </span>
                  </div>
                  {r.status === 'submitted' && (
                    <Button 
                      size="sm" 
                      variant={r.isPublished ? 'secondary' : 'default'} 
                      onClick={() => handleTogglePublish(r._id, r.isPublished)}
                    >
                      {r.isPublished ? <EyeOff className="h-4 w-4 mr-2"/> : <Eye className="h-4 w-4 mr-2"/>}
                      {r.isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                  )}
                </div>
                {r.status === 'submitted' && (
                  <div className="bg-muted/30 p-3 rounded-md text-sm whitespace-pre-wrap mt-2 border">
                    {r.content}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
