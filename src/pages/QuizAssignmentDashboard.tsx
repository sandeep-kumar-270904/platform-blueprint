import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, BookOpen, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function QuizAssignmentDashboard() {
  const [rosters, setRosters] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedRoster, setSelectedRoster] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [dueDate, setDueDate] = useState('');

  const loadData = async () => {
    try {
      // In a real app we'd have a dedicated endpoint to get rosters for the logged-in teacher
      // For this, we'll mock or assume a route exists, or just fetch from an admin perspective
      const qRes = await api.get('/quizzes');
      setQuizzes(qRes.data);
      
      // For the sake of the exercise, let's fetch assignments for a specific hardcoded roster if exists, or all
      // We will skip rosters fetch and just let the user input a roster ID to view it, 
      // or we can fetch a specific roster's assignments if we had a roster selection.
      // Since we don't have a full classroom backend mocked for the user's rosters, we'll let them type the roster ID.
    } catch (e) {
      console.error(e);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFetchAssignments = async () => {
    if (!selectedRoster) return;
    try {
      const res = await api.get(`/quiz-assignments/roster/${selectedRoster}`);
      setAssignments(res.data);
    } catch (e) {
      toast.error('Failed to load assignments for this roster');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/quiz-assignments', {
        quizId: selectedQuiz,
        classRosterId: selectedRoster,
        dueDate
      });
      toast.success('Quiz assigned successfully');
      handleFetchAssignments();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to assign quiz');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">Cohort Assignments</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Assign Quiz</CardTitle>
              <CardDescription>Assign a quiz to a class cohort</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssign} className="space-y-4">
                <div className="space-y-2">
                  <Label>Roster ID</Label>
                  <div className="flex gap-2">
                    <Input value={selectedRoster} onChange={e => setSelectedRoster(e.target.value)} placeholder="ClassRoster Object ID" required />
                    <Button type="button" variant="secondary" onClick={handleFetchAssignments}>Load</Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Quiz</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={selectedQuiz}
                    onChange={e => setSelectedQuiz(e.target.value)}
                    required
                  >
                    <option value="">Select a Quiz...</option>
                    {quizzes.map(q => (
                      <option key={q._id} value={q._id}>{q.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                </div>

                <Button type="submit" className="w-full">Assign & Notify Students</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Roster Progress</CardTitle>
              <CardDescription>Real-time completion tracking for {selectedRoster || 'selected cohort'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {assignments.length === 0 ? (
                <p className="text-muted-foreground">No assignments loaded. Enter a Roster ID and click Load.</p>
              ) : (
                assignments.map((assignmentData, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start border-b pb-3">
                      <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          <BookOpen className="w-5 h-5" /> {assignmentData.assignment.quiz?.title}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="w-4 h-4" /> Due: {new Date(assignmentData.assignment.dueDate).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={new Date(assignmentData.assignment.dueDate) < new Date() ? "destructive" : "default"}>
                        {assignmentData.assignment.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Student Status</h4>
                      {assignmentData.rosterStatus.length === 0 ? <p className="text-sm">No students in roster.</p> : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {assignmentData.rosterStatus.map((rs: any, sIdx: number) => (
                            <div key={sIdx} className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm">
                              <span>{rs.student.username}</span>
                              {rs.status === 'completed' && <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1"/> {Math.round(rs.score)}%</Badge>}
                              {rs.status === 'in_progress' && <Badge variant="secondary"><Clock className="w-3 h-3 mr-1"/> In Progress</Badge>}
                              {rs.status === 'not_started' && <Badge variant="outline" className="text-muted-foreground"><AlertCircle className="w-3 h-3 mr-1"/> Not Started</Badge>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
