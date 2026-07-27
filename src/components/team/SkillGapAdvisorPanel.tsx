import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Sparkles, 
  BookOpen, 
  ExternalLink, 
  Copy, 
  Bookmark, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Target, 
  GraduationCap, 
  Lightbulb,
  Loader2
} from "lucide-react";
import { useTeamSkillGap } from "@/hooks/useTeams";
import { toast } from "sonner";

interface SkillGapAdvisorPanelProps {
  teamId: string;
  matchScore?: number;
  isRejected?: boolean;
  defaultOpen?: boolean;
}

export function SkillGapAdvisorPanel({ 
  teamId, 
  matchScore, 
  isRejected = false, 
  defaultOpen = false 
}: SkillGapAdvisorPanelProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen || isRejected || (matchScore !== undefined && matchScore < 70));
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [bookmarkedUrls, setBookmarkedUrls] = useState<string[]>([]);

  const trigger = isRejected ? "application_rejected" : "low_match_view";
  const { data, isLoading, error } = useTeamSkillGap(teamId, trigger);

  if (isLoading) {
    return (
      <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-background to-blue-500/5 shadow-lg my-6 animate-pulse">
        <CardContent className="p-6 flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
          <span className="text-sm font-medium">Analyzing skill gaps and generating personalized learning roadmap...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !data || !data.missingSkills || data.missingSkills.length === 0) {
    // If no missing skills or error, do not render panel (non-punitive & clean)
    return null;
  }

  const handleCopyLink = (url: string, title: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success(`${t("Copy Link")}: ${title}`);
    setTimeout(() => setCopiedUrl(null), 3000);
  };

  const handleBookmark = (url: string, title: string) => {
    if (!bookmarkedUrls.includes(url)) {
      setBookmarkedUrls([...bookmarkedUrls, url]);
      toast.success(t("Bookmark saved!"));
    } else {
      toast.info("Already bookmarked!");
    }
  };

  return (
    <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-background to-blue-500/10 shadow-xl overflow-hidden my-6 transition-all duration-300">
      <CardHeader 
        className="p-6 pb-4 cursor-pointer hover:bg-muted/30 transition-colors select-none flex flex-row items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {t("Close the gap")}
              </CardTitle>
              {isRejected && (
                <Badge variant="outline" className="text-xs bg-purple-500/10 border-purple-500/30 text-purple-600">
                  AI Recommendation
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              {t("Personalized AI learning roadmap to qualify for this team")}
            </CardDescription>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </Button>
      </CardHeader>

      {isOpen && (
        <CardContent className="p-6 pt-2 space-y-6 animate-in fade-in-50 slide-in-from-top-2 duration-300">
          {/* AI Advisor Message Callout */}
          <div className="bg-gradient-to-r from-purple-500/15 to-blue-500/15 border border-purple-500/20 rounded-xl p-4.5 relative overflow-hidden">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  {t("Why focus on these skills?")}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {data.advisorMessage}
                </p>
              </div>
            </div>
          </div>

          {/* Missing Skills Pills */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-purple-500" />
              {t("Required Skills")} ({data.missingSkills.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.missingSkills.map((skill: string) => (
                <Badge 
                  key={skill} 
                  variant="outline" 
                  className="px-3 py-1 bg-background/80 border-purple-500/30 text-purple-700 dark:text-purple-300 font-medium shadow-sm flex items-center gap-1.5"
                >
                  <GraduationCap className="h-3.5 w-3.5 text-purple-500" />
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Curated Learning Resources */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-blue-500" />
              {t("Recommended Learning Resources")}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.resources?.map((skillGroup: any) => (
                <div key={skillGroup.skill} className="space-y-2">
                  <div className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
                    <span className="h-2 w-2 rounded-full bg-purple-500 inline-block"></span>
                    {skillGroup.skill}
                  </div>
                  <div className="space-y-2.5">
                    {skillGroup.resources.map((res: any, idx: number) => {
                      const isBookmarked = bookmarkedUrls.includes(res.url);
                      const isCopied = copiedUrl === res.url;
                      return (
                        <div 
                          key={idx} 
                          className="group bg-card/90 hover:bg-card border border-border/60 hover:border-purple-500/40 rounded-xl p-3.5 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between gap-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <Badge 
                                variant="secondary" 
                                className="text-[10px] uppercase font-semibold px-2 py-0.2 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-none"
                              >
                                {res.difficulty || "Beginner"}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[120px]">
                                {res.source || "Curated"}
                              </span>
                            </div>
                            <h5 className="font-semibold text-sm leading-snug group-hover:text-purple-600 transition-colors line-clamp-2">
                              {res.title}
                            </h5>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-1">
                            <a 
                              href={res.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 inline-flex"
                            >
                              <span>Start Learning</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => handleCopyLink(res.url, res.title)}
                                title={t("Copy Link")}
                              >
                                {isCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={`h-7 w-7 ${isBookmarked ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground hover:text-foreground"}`}
                                onClick={() => handleBookmark(res.url, res.title)}
                                title={t("Save Link")}
                              >
                                <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-current" : ""}`} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-2 border-t border-purple-500/10 text-center">
            <p className="text-xs text-muted-foreground italic">
              ✨ {t("Mastering these skills builds real-world competency and strengthens your portfolio for future applications!")}
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
