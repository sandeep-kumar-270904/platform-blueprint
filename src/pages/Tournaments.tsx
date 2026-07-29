import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Play, Loader2, List, Medal } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Tournaments() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const [standingsModal, setStandingsModal] = useState<string | null>(null);
  const [standingsData, setStandingsData] = useState<any[]>([]);


  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await api.get('/tournaments');
      setTournaments(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (id: string) => {
    try {
      await api.post(`/tournaments/${id}/register`);
      fetchTournaments();
    } catch (e) {
      console.error(e);
    }
  };


  const handleViewStandings = async (id: string) => {
    try {
      const res = await api.get(`/tournaments/${id}/standings`);
      setStandingsData(res.data);
      setStandingsModal(id);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-8">
      <div className="flex items-center gap-3">
        <Trophy className="w-8 h-8 text-yellow-500" />
        <h1 className="text-3xl font-bold">Quiz Tournaments</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {tournaments.map(t => (
          <Card key={t._id} className="overflow-hidden relative">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{t.title}</CardTitle>
                  <CardDescription className="uppercase mt-1">{t.format.replace('_', ' ')}</CardDescription>
                </div>
                <Badge variant={t.status === 'active' ? 'default' : t.status === 'upcoming' ? 'secondary' : 'outline'}>{t.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" /> {t.participantIds?.length || 0} Participants
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-semibold">Associated Quizzes:</p>
                <div className="flex flex-wrap gap-2">
                  {t.quizIds?.map((q: any) => (
                    <Badge key={q._id} variant="outline">{q.title}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => handleViewStandings(t._id)}>
                  <List className="w-4 h-4 mr-2" /> Standings
                </Button>
                {t.status === 'upcoming' && !t.participantIds?.some((p:any) => p._id === user?._id) && (
                  <Button onClick={() => handleJoin(t._id)}>Join Tournament</Button>
                )}
                {t.status === 'active' && t.participantIds?.some((p:any) => p._id === user?._id) && (
                  <Button variant="secondary" onClick={() => window.location.href=`/quizzes/${t.quizIds[0]?._id}/take`}>
                    <Play className="w-4 h-4 mr-2" /> Play Next Match
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!standingsModal} onOpenChange={() => setStandingsModal(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500"/> Tournament Standings</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {standingsData.length === 0 ? (
              <p className="text-center text-muted-foreground">No attempts submitted yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead className="text-right">Quizzes Completed</TableHead>
                    <TableHead className="text-right">Total Score</TableHead>
                    <TableHead className="text-right">Total Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standingsData.map((s, idx) => (
                    <TableRow key={s.user._id}>
                      <TableCell className="font-medium">
                        {idx === 0 ? <Medal className="w-5 h-5 text-yellow-500" /> : 
                         idx === 1 ? <Medal className="w-5 h-5 text-gray-400" /> : 
                         idx === 2 ? <Medal className="w-5 h-5 text-amber-600" /> : `#${idx + 1}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6"><AvatarImage src={s.user.avatar_url}/><AvatarFallback>U</AvatarFallback></Avatar>
                          {s.user.full_name || s.user.username}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{s.quizzesCompleted}</TableCell>
                      <TableCell className="text-right font-bold text-violet-600">{s.score}</TableCell>
                      <TableCell className="text-right">{s.timeTaken}s</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>

  );
}
