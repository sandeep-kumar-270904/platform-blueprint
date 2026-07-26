import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertTriangle, ShieldCheck, Ban, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminQuizModeration() {
  const [flagged, setFlagged] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [fRes, dRes] = await Promise.all([
        api.get('/admin/quiz-moderation/flagged'),
        api.get('/admin/quiz-moderation/disputes')
      ]);
      setFlagged(fRes.data);
      setDisputes(dRes.data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load moderation queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClearFlag = async (id: string) => {
    try {
      await api.post(`/admin/quiz-moderation/attempts/${id}/clear`);
      toast.success("Flag cleared");
      loadData();
    } catch (e) {
      toast.error("Failed to clear flag");
    }
  };

  const handleBanUser = async (id: string) => {
    if (!window.confirm("Ban this user?")) return;
    try {
      await api.post(`/admin/quiz-moderation/attempts/${id}/ban-user`);
      toast.success("User banned");
      loadData();
    } catch (e) {
      toast.error("Failed to ban user");
    }
  };

  const handleResolveDispute = async (id: string, action: 'accept' | 'reject', newCorrectIndex?: number) => {
    if (!window.confirm(`Are you sure you want to ${action} this dispute?`)) return;
    try {
      await api.post(`/admin/quiz-moderation/disputes/${id}/resolve`, { action, newCorrectIndex });
      toast.success(`Dispute ${action}ed`);
      loadData();
    } catch (e) {
      toast.error("Failed to resolve dispute");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">Quiz Trust & Safety</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-500" /> Flagged Attempts</CardTitle>
              <CardDescription>Suspicious quiz activity awaiting review</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {flagged.length === 0 ? <p className="text-muted-foreground">Queue is clear.</p> : flagged.map(att => (
                <div key={att._id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">{att.user?.username || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{att.quiz?.title}</p>
                    </div>
                    <Badge variant="destructive">{att.percentageScore}%</Badge>
                  </div>
                  <p className="text-sm bg-red-100 text-red-800 p-2 rounded dark:bg-red-900/30 dark:text-red-200">
                    Reason: {att.flaggedReason}
                  </p>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => handleClearFlag(att._id)}>
                      <ShieldCheck className="w-4 h-4 mr-1" /> Clear Flag
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleBanUser(att._id)}>
                      <Ban className="w-4 h-4 mr-1" /> Ban User
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Gavel className="w-5 h-5 text-blue-500" /> Question Disputes</CardTitle>
              <CardDescription>User reports of incorrect answers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {disputes.length === 0 ? <p className="text-muted-foreground">Queue is clear.</p> : disputes.map(d => (
                <div key={d._id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">Quiz: {d.quiz?.title}</p>
                      <p className="text-sm text-muted-foreground">Question Index: {d.questionIndex}</p>
                    </div>
                    <Badge variant="outline">By {d.reportedBy?.username}</Badge>
                  </div>
                  <p className="text-sm">Reason: {d.reason}</p>
                  <p className="text-sm font-semibold">Proposed Correct Index: {d.proposedCorrectIndex}</p>
                  
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => handleResolveDispute(d._id, 'reject')}>
                      Reject
                    </Button>
                    <Button variant="default" size="sm" onClick={() => handleResolveDispute(d._id, 'accept', d.proposedCorrectIndex)}>
                      Accept & Recalculate
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
