import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Info, Calendar, Clock, Users, ArrowLeft, Loader2 } from "lucide-react";
import { formatToTimezone } from "@/utils/calendarUtils";

export function ClassPreview() {
  const { id } = useParams<{ id: string }>();
  
  const [classroom, setClassroom] = useState<any>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetch(`${API_URL}/api/classrooms/public/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Classroom not found");
        return res.json();
      })
      .then(data => {
        setClassroom(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id, API_URL]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center py-12">
            <CardContent>
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Class Not Found</h2>
              <p className="text-muted-foreground mb-6">This class may have been removed or the link is invalid.</p>
              <Link to="/classrooms">
                <Button>Browse All Classes</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      <main className="flex-1 container max-w-3xl py-12 px-4">
        <Link to="/classrooms" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Classrooms
        </Link>
        
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start gap-4 mb-2">
              <Badge variant={classroom.is_paid ? "secondary" : "default"}>
                {classroom.is_paid ? `$${classroom.price} USD` : "Free"}
              </Badge>
              {classroom.series_total > 1 && (
                <Badge variant="outline">Session {classroom.series_index} of {classroom.series_total}</Badge>
              )}
            </div>
            <CardTitle className="text-3xl">{classroom.title}</CardTitle>
            <div className="flex items-center text-muted-foreground mt-2">
              <span className="font-medium">Hosted by {classroom.host_id?.name || 'Unknown'}</span>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-md">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{formatToTimezone(classroom.scheduled_at, Intl.DateTimeFormat().resolvedOptions().timeZone, 'en')}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-md">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{classroom.duration_minutes} min</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-md">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{classroom.participant_count} / {classroom.max_participants} joined</span>
              </div>
            </div>

            {classroom.description && (
              <div>
                <h3 className="font-semibold mb-2">About this class</h3>
                <p className="text-muted-foreground whitespace-pre-line">{classroom.description}</p>
              </div>
            )}

            {(classroom.tags?.length > 0 || classroom.prerequisites) && (
              <div className="space-y-4 pt-4 border-t">
                {classroom.prerequisites && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Prerequisites</h4>
                    <p className="text-sm text-muted-foreground">{classroom.prerequisites}</p>
                  </div>
                )}
                {classroom.tags?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {classroom.tags.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3 pt-6 border-t bg-slate-50 rounded-b-xl">
            <h3 className="font-medium text-center">Want to join this class?</h3>
            <Link to={`/classroom/${classroom._id}`} className="w-full">
              <Button size="lg" className="w-full">Sign In to Join</Button>
            </Link>
            <p className="text-xs text-muted-foreground text-center">
              You must be logged in to reserve a spot or join the waitlist.
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
