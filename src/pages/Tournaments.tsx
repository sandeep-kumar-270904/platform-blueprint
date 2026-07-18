import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Play, Loader2 } from "lucide-react";

export default function Tournaments() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      await api.post(`/tournaments/${id}/join`);
      fetchTournaments();
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
          <Card key={t._id} className="overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{t.title}</CardTitle>
                  <CardDescription className="uppercase mt-1">{t.format.replace('_', ' ')}</CardDescription>
                </div>
                <Badge variant={t.status === 'active' ? 'default' : 'secondary'}>{t.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" /> {t.participantIds?.length || 0} Participants
              </div>

              {t.bracket?.rounds && (
                <div className="bg-card border rounded p-3 text-sm">
                  <p className="font-semibold mb-2">Current Bracket (Round 1)</p>
                  {t.bracket.rounds[0].matches.map((m: any) => (
                    <div key={m.id} className="flex justify-between border-b py-1 last:border-0">
                      <span>{m.p1?.full_name || 'TBD'} vs {m.p2?.full_name || 'BYE'}</span>
                      <span className="font-bold text-green-600">{m.winner === m.p1?._id ? m.p1?.full_name : m.winner === m.p2?._id ? m.p2?.full_name : 'Pending'}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2">
                {t.status === 'upcoming' && (
                  <Button onClick={() => handleJoin(t._id)}>Join Tournament</Button>
                )}
                {t.status === 'active' && (
                  <Button variant="secondary" onClick={() => window.location.href=`/quiz/${t.quizIds[0]?._id}/take`}>
                    <Play className="w-4 h-4 mr-2" /> Play Next Match
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
