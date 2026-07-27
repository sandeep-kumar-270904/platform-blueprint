import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatToTimezone } from "@/utils/calendarUtils";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Loader2, Users, Star, Clock, Tag, Flag, Check, X } from "lucide-react";
import { useTeam, useTeamApplicants, useCreateReview, useTeamMatchScore, useReportTeam, useTeamMatchExplanation, useMyApplications } from "@/hooks/useTeams";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { TeamChat } from "@/components/team/TeamChat";
import { SkillGapAdvisorPanel } from "@/components/team/SkillGapAdvisorPanel";

export default function TeamHuntDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: team, isLoading: teamLoading, error: teamError } = useTeam(id || "");
  const { data: applicants, isLoading: appsLoading } = useTeamApplicants(id || "");
  const { data: matchData, isLoading: matchLoading } = useTeamMatchScore(id || "");
  const { data: explData, isLoading: explLoading } = useTeamMatchExplanation(id || "");
  const { data: myApps } = useMyApplications();
  
  const isAcceptedMember = myApps?.some((app: any) => app.team === id && app.status === 'accepted');
  const isRejectedMember = myApps?.some((app: any) => (app.team === id || app.team?._id === id) && app.status === 'rejected');
  
  if (teamLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (teamError || !team) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <h2 className="text-2xl font-bold mb-2">Team Not Found</h2>
          <Button onClick={() => navigate('/team-hunt')}>Back to Team Hunt</Button>
        </div>
      </div>
    );
  }

  const isCreator = user?.id === team.creator._id;
  const isCompleted = team.status === 'completed';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/team-hunt/dashboard')} className="mb-6 -ml-4 text-muted-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start mb-2">
              <Badge variant="outline">{team.category}</Badge>
              <Badge variant={team.status === 'open' ? 'default' : team.status === 'completed' ? 'secondary' : 'destructive'}>
                {team.status.toUpperCase()}
              </Badge>
            </div>
            <CardTitle className="text-3xl">{team.title}</CardTitle>
            <CardDescription className="flex gap-4 items-center mt-2">
              <span className="flex items-center gap-1"><Users className="h-4 w-4"/> {team.teamSize.current}/{team.teamSize.max}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4"/> Created {formatDistanceToNow(new Date(team.createdAt), { addSuffix: true })} ({formatToTimezone(team.createdAt, undefined, i18n.language)})</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isCreator && matchData && (
              <div className="bg-muted/30 border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" className={`text-lg py-1 px-3 ${
                    matchData.score >= 70 ? 'border-green-500 text-green-600 bg-green-500/10' :
                    matchData.score >= 40 ? 'border-yellow-500 text-yellow-600 bg-yellow-500/10' :
                    'border-muted-foreground/30 text-muted-foreground'
                  }`}>
                    {matchData.score}% Match
                  </Badge>
                  <h3 className="font-semibold text-lg">Why this match?</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" /> 
                      Matched Skills
                    </h4>
                    {matchData.matchedSkills?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {matchData.matchedSkills.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No matching skills found.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <X className="h-4 w-4 text-destructive" /> 
                      Missing Skills
                    </h4>
                    {matchData.missingSkills?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {matchData.missingSkills.map((s: string) => <Badge key={s} variant="outline" className="text-muted-foreground">{s}</Badge>)}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">You meet all skill requirements!</p>
                    )}
                  </div>
                </div>

                {/* Phase 4: AI Match Explanation */}
                <div className="mt-4 pt-4 border-t border-muted/50">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4 text-purple-500 fill-purple-500" />
                    AI Insights
                  </h4>
                  {explLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating explanation...
                    </div>
                  ) : explData?.explanation ? (
                    <p className="text-sm font-medium leading-relaxed">{explData.explanation}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Insights unavailable.</p>
                  )}
                </div>
              </div>
            )}

            {!isCreator && ((matchData && matchData.score < 70) || isRejectedMember) && (
              <SkillGapAdvisorPanel 
                teamId={team._id} 
                matchScore={matchData?.score} 
                isRejected={isRejectedMember} 
              />
            )}

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{team.description}</p>
            </div>

            {isCompleted && (
              <div className="bg-muted/50 p-6 rounded-xl border border-dashed">
                <h3 className="font-semibold text-lg mb-2">Project Completed!</h3>
                <p className="text-muted-foreground mb-4">
                  This team has finished their project. You can now leave reviews for your teammates.
                </p>
                <ReviewTeammatesDialog teamId={team._id} />
              </div>
            )}

            {/* Phase 4: Chat */}
            {(isCreator || isAcceptedMember) && team.status !== 'completed' && (
              <div className="pt-4 border-t mt-4">
                <TeamChat teamId={team._id} />
              </div>
            )}
          </CardContent>
          {isCreator ? (
            <CardFooter className="border-t pt-4">
              <Button onClick={() => navigate(`/team-hunt/${team._id}/manage`)}>Manage Team</Button>
            </CardFooter>
          ) : (
            <CardFooter className="border-t pt-4 flex justify-end">
              <ReportTeamDialog teamId={team._id} />
            </CardFooter>
          )}
        </Card>
      </main>
    </div>
  );
}

function ReportTeamDialog({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const { mutate: reportTeam, isPending } = useReportTeam();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return toast.error("Please select a reason");

    reportTeam({ teamId, reason, details }, {
      onSuccess: () => {
        toast.success("Report submitted successfully");
        setOpen(false);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to submit report");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-muted-foreground hover:text-destructive">
          <Flag className="h-4 w-4 mr-2" />
          Report Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Team</DialogTitle>
          <DialogDescription>Please let us know why you are reporting this team. This will be reviewed by administrators.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason *</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              <option value="" disabled>Select a reason...</option>
              <option value="spam">Spam / Duplicate</option>
              <option value="misleading">Misleading information</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="scam">Scam / Fraud</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Details (Optional)</label>
            <Textarea 
              placeholder="Provide more context..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReviewTeammatesDialog({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false);
  const [revieweeId, setRevieweeId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  
  const { mutate: createReview, isPending } = useCreateReview();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revieweeId.trim()) return toast.error("Please provide the User ID of the teammate.");
    
    createReview({ teamId, revieweeId, rating, comment }, {
      onSuccess: () => {
        toast.success("Review submitted!");
        setOpen(false);
        setRevieweeId("");
        setComment("");
        setRating(5);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to submit review");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Leave a Review</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Teammate</DialogTitle>
          <DialogDescription>Leave a rating and comment for a team member.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Teammate User ID</label>
            <input 
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Paste User ID here..."
              value={revieweeId}
              onChange={e => setRevieweeId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Rating (1-5)</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(r => (
                <Button 
                  key={r} 
                  type="button" 
                  variant={rating === r ? 'default' : 'outline'} 
                  onClick={() => setRating(r)}
                  className="w-10 h-10 p-0"
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Comment (Optional)</label>
            <Textarea 
              placeholder="Great to work with!" 
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
