import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Loader2 } from "lucide-react";

export default function SyllabusProgressTracker() {
  const [progressData, setProgressData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const res = await api.get('/syllabus/progress');
      setProgressData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Target className="w-8 h-8 text-indigo-500" />
        <h1 className="text-3xl font-bold">Exam-Prep Tracking</h1>
      </div>

      {progressData.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No syllabus tracking data yet. Complete an exam-prep quiz to see your progress here!
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {progressData.map((p) => (
            <Card key={p._id}>
              <CardHeader>
                <CardTitle>{p.subjectId?.name || "Unknown Syllabus"}</CardTitle>
                <CardDescription>Topic Mastery Breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {p.topicCoverageWithRate?.map((topic: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{topic.topicName}</span>
                      <span className="text-muted-foreground">
                        {Math.round(topic.correctRate)}% Mastery ({topic.correctCount}/{topic.questionsAttempted})
                      </span>
                    </div>
                    <Progress value={topic.correctRate} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
