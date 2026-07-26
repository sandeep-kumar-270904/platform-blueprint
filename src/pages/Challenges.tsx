import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Swords, Check, X, Loader2, Trophy, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Challenges() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);


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
      
      if (user) {
        const histRes = await api.get(`/challenges/history/${user._id}`);
        setHistory(histRes.data);
      }
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

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="active">Active Challenges</TabsTrigger>
          <TabsTrigger value="history">Challenge History</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
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
                    <div className="text-right flex flex-col items-end gap-2">
                      <Badge variant="outline">{c.status}</Badge>
                      {c.status === 'pending' && c.challengedId._id === user?._id && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdateStatus(c._id, 'accepted')}><Check className="w-4 h-4 mr-1"/> Accept</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(c._id, 'declined')}><X className="w-4 h-4 mr-1"/> Decline</Button>
                        </div>
                      )}
                      {c.status === 'pending' && c.challengerId._id === user?._id && (
                        <span className="text-sm text-muted-foreground">Waiting for response</span>
                      )}
                      {c.status === 'accepted' && (
                        <Button size="sm" variant="secondary" onClick={() => window.location.href=`/quizzes/${c.quizId?._id}/take`}>Play Now</Button>
                      )}
                      {c.status === 'completed' && (
                        <Button size="sm" variant="outline" onClick={() => setSelectedChallenge(c)}>View Results</Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-muted-foreground">No completed challenges yet.</p>
              ) : (
                <div className="space-y-4">
                  {history.map(h => (
                    <div key={h._id} className="flex justify-between items-center p-4 border rounded-lg bg-card">
                      <div>
                        <h4 className="font-semibold">{h.quizId?.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Winner: {h.isDraw ? "Draw" : h.winnerId?.username}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => {
                        // refetch specific challenge to get full attempt population
                        api.get(`/challenges/${h._id}/results`).then(res => setSelectedChallenge(res.data.challenge));
                      }}>Compare</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
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
                  const friend = conn.userA?._id === user?._id ? conn.userB : conn.userA;
                  return (
                    <div key={conn._id} className="flex justify-between items-center p-3 bg-muted/20 rounded border">
                      <div className="flex items-center gap-3">
                        <Avatar><AvatarImage src={friend?.avatar_url}/><AvatarFallback>F</AvatarFallback></Avatar>
                        <div>
                          <p className="font-medium">{friend?.full_name || friend?.username}</p>
                          <Badge variant="secondary" className="text-xs">{conn.status}</Badge>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedChallenge} onOpenChange={() => setSelectedChallenge(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Challenge Results</DialogTitle>
            <DialogDescription>{selectedChallenge?.quizId?.title}</DialogDescription>
          </DialogHeader>
          {selectedChallenge && selectedChallenge.challengerAttemptId && selectedChallenge.challengedAttemptId ? (
            <div className="grid grid-cols-2 gap-8 py-4">
              <div className="space-y-4 text-center">
                <Avatar className="w-16 h-16 mx-auto"><AvatarImage src={selectedChallenge.challengerId?.avatar_url}/><AvatarFallback>C1</AvatarFallback></Avatar>
                <h3 className="font-bold text-lg">{selectedChallenge.challengerId?.full_name}</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-2xl font-black text-violet-600 mb-2">
                    <Trophy className="w-6 h-6" />
                    {selectedChallenge.challengerAttemptId.score} pts
                  </div>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {selectedChallenge.challengerAttemptId.answers.reduce((acc: number, a: any) => acc + (a.timeTakenSeconds || 0), 0)}s total
                  </div>
                </div>
              </div>
              <div className="space-y-4 text-center">
                <Avatar className="w-16 h-16 mx-auto"><AvatarImage src={selectedChallenge.challengedId?.avatar_url}/><AvatarFallback>C2</AvatarFallback></Avatar>
                <h3 className="font-bold text-lg">{selectedChallenge.challengedId?.full_name}</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-2xl font-black text-orange-600 mb-2">
                    <Trophy className="w-6 h-6" />
                    {selectedChallenge.challengedAttemptId.score} pts
                  </div>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {selectedChallenge.challengedAttemptId.answers.reduce((acc: number, a: any) => acc + (a.timeTakenSeconds || 0), 0)}s total
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Waiting for both users to complete the challenge.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

}
