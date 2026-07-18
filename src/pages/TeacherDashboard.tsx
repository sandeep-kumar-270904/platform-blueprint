import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function TeacherDashboard() {
  const [classes, setClasses] = useState<any[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
      if (res.data.length > 0 && !selectedClassId) {
        handleSelectClass(res.data[0]._id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClass = async (id: string) => {
    setSelectedClassId(id);
    try {
      const res = await api.get(`/classes/${id}/analytics`);
      setAnalytics(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) return;
    try {
      await api.post('/classes', { name: newClassName });
      setNewClassName("");
      fetchClasses();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      <div className="flex items-center gap-3">
        <BookOpen className="w-8 h-8 text-blue-500" />
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Classes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleCreateClass} className="flex gap-2">
                <Input placeholder="New class name..." value={newClassName} onChange={e => setNewClassName(e.target.value)} />
                <Button type="submit">Add</Button>
              </form>

              <div className="space-y-2">
                {classes.map(c => (
                  <Button 
                    key={c._id} 
                    variant={selectedClassId === c._id ? "default" : "outline"} 
                    className="w-full justify-start"
                    onClick={() => handleSelectClass(c._id)}
                  >
                    <Users className="w-4 h-4 mr-2" /> {c.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {analytics?.roster && (
            <Card>
              <CardHeader>
                <CardTitle>Class Info</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">Join Code:</p>
                <code className="bg-muted p-2 rounded text-lg font-mono tracking-widest">{analytics.roster.joinCode}</code>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4" /> {analytics.roster.studentIds.length} Students Enrolled
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3 space-y-6">
          {analytics ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Quizzes ({analytics.quizzes.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quiz</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Attempts</TableHead>
                        <TableHead>Avg Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.quizzes.map((q: any) => {
                        const quizAttempts = analytics.attempts.filter((a: any) => a.quiz._id === q._id);
                        const avgScore = quizAttempts.length > 0 
                          ? Math.round(quizAttempts.reduce((acc: number, a: any) => acc + a.percentageScore, 0) / quizAttempts.length)
                          : 0;
                        return (
                          <TableRow key={q._id}>
                            <TableCell className="font-medium">{q.title}</TableCell>
                            <TableCell>{q.dueDate ? new Date(q.dueDate).toLocaleDateString() : 'No Due Date'}</TableCell>
                            <TableCell>{quizAttempts.length}</TableCell>
                            <TableCell>{avgScore}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Student Performance</CardTitle>
                  <CardDescription>Scoped only to your assigned quizzes</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Quiz</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.attempts.map((a: any) => (
                        <TableRow key={a._id}>
                          <TableCell className="flex items-center gap-2">
                            {a.user.full_name}
                          </TableCell>
                          <TableCell>{a.quiz.title}</TableCell>
                          <TableCell>{a.percentageScore}%</TableCell>
                          <TableCell>
                            {a.isLate && <Badge variant="destructive" className="mr-2">LATE</Badge>}
                            <Badge variant="outline">{new Date(a.startedAt).toLocaleDateString()}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center p-12 bg-muted/20 rounded-lg border">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-muted-foreground">Select a class to view analytics</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
