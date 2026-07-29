import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuizCategories, useTrendingQuizzes } from "@/hooks/useQuizHub";
import { Loader2, TrendingUp, Folder, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function QuizSidebar({ 
  onSelectCategory,
  currentCategory
}: { 
  onSelectCategory: (cat: string) => void,
  currentCategory: string
}) {
  const { user } = useAuth();
  const { categories, loading: catsLoading } = useQuizCategories();
  const { trending, loading: trendLoading } = useTrendingQuizzes();
  
  const [userStats, setUserStats] = useState<any>(null);
  
  useEffect(() => {
    if (user) {
      fetch(`${API_URL}/api/me/quiz-dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setUserStats(d.summary))
      .catch(console.error);
    }
  }, [user]);

  return (
    <div className="space-y-6">
      {user && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userStats ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Quizzes</span>
                  <span className="font-medium text-foreground">{userStats.totalAttempts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Points</span>
                  <span className="font-medium text-primary">{userStats.totalPoints}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Avg Score</span>
                  <span className="font-medium text-foreground">{userStats.averageScore.toFixed(1)}%</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Take quizzes to earn stats!</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Folder className="w-5 h-5 text-muted-foreground" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          {catsLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={currentCategory === "All" ? "default" : "secondary"} 
                className="cursor-pointer hover:bg-primary/80 transition-colors"
                onClick={() => onSelectCategory("All")}
              >
                All
              </Badge>
              {categories.map(c => (
                <Badge 
                  key={c.category} 
                  variant={currentCategory === c.category ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-primary/80 transition-colors"
                  onClick={() => onSelectCategory(c.category)}
                >
                  {c.category} ({c.count})
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Trending Quizzes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trendLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : trending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trending quizzes yet.</p>
          ) : (
            <div className="space-y-4">
              {trending.map(t => (
                <div key={t._id} className="group">
                  <Link to={`/quizzes/${t._id}`} className="block">
                    <h4 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                      {t.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="capitalize">{t.difficulty}</span>
                      <span>•</span>
                      <span>{t.attemptCount} attempts</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
