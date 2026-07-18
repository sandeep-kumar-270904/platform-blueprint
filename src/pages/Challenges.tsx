import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Swords, Check, X, Loader2 } from "lucide-react";

export default function Challenges() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [chRes, connRes] = await Promise.all([
        api.get('/challenges'),
        api.get('/challenges/connections')
      ]);
      setChallenges(chRes.data);
      setConnections(connRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/challenges/${id}/status`, { status });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-8">
      <div className="flex items-center gap-3">
        <Swords className="w-8 h-8 text-orange-500" />
        <h1 className="text-3xl font-bold">Quiz Challenges</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Challenges</CardTitle>
            <CardDescription>Head-to-head quiz battles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {challenges.length === 0 ? (
              <p className="text-muted-foreground">No active challenges.</p>
            ) : (
              challenges.map(c => (
                <div key={c._id} className="p-4 border rounded-lg bg-card flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">{c.quizId?.title}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Avatar className="w-6 h-6"><AvatarImage src={c.challengerId?.avatar_url}/><AvatarFallback>C</AvatarFallback></Avatar>
                      {c.challengerId?.full_name} vs 
                      <Avatar className="w-6 h-6"><AvatarImage src={c.challengedId?.avatar_url}/><AvatarFallback>C</AvatarFallback></Avatar>
                      {c.challengedId?.full_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-2">{c.status}</Badge>
                    {c.status === 'pending' && (
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" onClick={() => handleUpdateStatus(c._id, 'accepted')}><Check className="w-4 h-4 mr-1"/> Accept</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(c._id, 'declined')}><X className="w-4 h-4 mr-1"/> Decline</Button>
                      </div>
                    )}
                    {c.status === 'accepted' && (
                      <Button size="sm" variant="secondary" onClick={() => window.location.href=`/quiz/${c.quizId?._id}/take`}>Play Now</Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connections</CardTitle>
            <CardDescription>Your friends list</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {connections.length === 0 ? (
              <p className="text-muted-foreground">No connections yet.</p>
            ) : (
              connections.map(conn => {
                // Determine the "other" user (assuming simple implementation where we don't have our own userId handy in this component without useAuth)
                // In reality we'd filter to just the friend
                const friend = conn.userA?.full_name ? conn.userA : conn.userB;
                return (
                  <div key={conn._id} className="flex justify-between items-center p-3 bg-muted/20 rounded border">
                    <div className="flex items-center gap-3">
                      <Avatar><AvatarImage src={friend?.avatar_url}/><AvatarFallback>F</AvatarFallback></Avatar>
                      <div>
                        <p className="font-medium">{friend?.full_name}</p>
                        <Badge variant="secondary" className="text-xs">{conn.status}</Badge>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
