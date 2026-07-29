import React from "react";
import { Card, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, Video, Code, BookOpen, CheckCircle2, Clock, 
  Eye, Heart, MessageSquare, Edit, Trash2, MoreVertical, Flag, AlertTriangle, Link as LinkIcon
} from "lucide-react";
import { CreatorContentItem } from "@/hooks/useCreators";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const typeIcons: Record<string, React.ReactNode> = {
  article: <FileText className="h-3.5 w-3.5 mr-1 shrink-0" />,
  video: <Video className="h-3.5 w-3.5 mr-1 shrink-0" />,
  project: <Code className="h-3.5 w-3.5 mr-1 shrink-0" />,
  resource: <BookOpen className="h-3.5 w-3.5 mr-1 shrink-0" />
};

const typeColors: Record<string, string> = {
  article: "bg-blue-500/10 text-blue-500 border-blue-200 dark:border-blue-800",
  video: "bg-purple-500/10 text-purple-500 border-purple-200 dark:border-purple-800",
  project: "bg-emerald-500/10 text-emerald-500 border-emerald-200 dark:border-emerald-800",
  resource: "bg-amber-500/10 text-amber-500 border-amber-200 dark:border-amber-800"
};

interface CreatorCardProps {
  item: CreatorContentItem;
  user: any;
  isMyContentView: boolean;
  onCardClick: (item: CreatorContentItem) => void;
  onCreatorClick: (authorId: string | undefined, e: React.MouseEvent) => void;
  onLike: (item: CreatorContentItem, e: React.MouseEvent) => void;
  onTagClick: (tag: string, e: React.MouseEvent) => void;
  onEdit?: (item: CreatorContentItem, e: React.MouseEvent) => void;
  onDelete?: (item: CreatorContentItem, e: React.MouseEvent) => void;
  onReport?: (item: CreatorContentItem, e: React.MouseEvent) => void;
}

export const CreatorCard: React.FC<CreatorCardProps> = ({
  item,
  user,
  isMyContentView,
  onCardClick,
  onCreatorClick,
  onLike,
  onTagClick,
  onEdit,
  onDelete,
  onReport
}) => {
  const isLiked = user && item.likedBy && item.likedBy.includes(user._id || user.id);
  const authorName = typeof item.userId === 'object' ? item.userId?.name : item.creatorName;
  const authorId = typeof item.userId === 'object' ? item.userId?._id : item.creatorName;
  const isReported = user && item.reportedBy && item.reportedBy.includes(user._id || user.id);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onCardClick(item);
    }
  };

  return (
    <article 
      aria-labelledby={`content-title-${item._id}`}
      aria-describedby={`content-desc-${item._id}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => onCardClick(item)} 
      className="group hover-lift cursor-pointer overflow-hidden border border-border/60 hover:border-primary/50 transition-all duration-300 flex flex-col h-full bg-card/90 backdrop-blur-sm shadow-sm hover:shadow-md rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {/* Thumbnail Banner */}
      <div className="aspect-video bg-gradient-to-br from-primary/10 via-muted/30 to-background border-b border-border/30 flex items-center justify-center text-6xl relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
        <span className="select-none filter drop-shadow-sm" aria-hidden="true">{item.thumbnail || "✨"}</span>
        
        <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`font-medium backdrop-blur-md px-2.5 py-1 text-xs ${typeColors[item.type] || "bg-secondary"}`}>
            {typeIcons[item.type]}
            <span className="capitalize">{item.type}</span>
          </Badge>
          {item.relatedModule && item.relatedModule !== 'none' && (
            <Badge variant="secondary" className="font-medium backdrop-blur-md bg-background/60 px-2.5 py-1 text-xs shadow-sm">
              <LinkIcon className="h-3 w-3 mr-1 text-muted-foreground" />
              <span>Related {item.relatedModule}</span>
            </Badge>
          )}
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {isMyContentView && (
            <Badge variant={item.status === 'published' ? 'default' : 'secondary'} className={`text-xs backdrop-blur-md px-2 py-0.5 ${item.status === 'in_review' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30' : ''}`}>
              {item.status === 'published' ? <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-400" /> : item.status === 'in_review' ? <Eye className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1 text-amber-400" />}
              <span className="capitalize">{item.status.replace('_', ' ')}</span>
            </Badge>
          )}

          {item.moderationStatus === 'under_review' && isMyContentView && (
            <Badge variant="destructive" className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 px-2 py-0.5" title="Under Review by moderation">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Under Review
            </Badge>
          )}

          {!isMyContentView && onReport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-10 w-10 p-0 rounded-full bg-background/60 backdrop-blur-md hover:bg-background/90 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="More options and reporting for this content"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  disabled={!!isReported}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isReported && onReport) onReport(item, e);
                  }}
                  className="text-destructive focus:text-destructive cursor-pointer min-h-[40px] flex items-center"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  {isReported ? "Already Reported" : "Report Content"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Card Header & Body */}
      <CardHeader className="p-4 sm:p-5 pb-3 flex-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2" onClick={(e) => e.stopPropagation()}>
          <button 
            type="button"
            onClick={(e) => onCreatorClick(authorId, e)}
            className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer py-1 px-1.5 -ml-1.5 rounded-md hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] text-left"
            title={`View ${authorName}'s Profile`}
            aria-label={`View creator profile for ${authorName}`}
          >
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs shrink-0">
              {authorName ? authorName.charAt(0).toUpperCase() : "U"}
            </div>
            <span className="font-semibold text-foreground/90 truncate max-w-[130px] sm:max-w-[150px]">{authorName}</span>
          </button>
          <time dateTime={item.createdAt} className="shrink-0 text-muted-foreground/80">{formatDate(item.createdAt)}</time>
        </div>

        <h3 id={`content-title-${item._id}`} className="font-bold text-base sm:text-lg leading-snug group-hover:text-primary transition-colors line-clamp-2 break-words mb-1.5">
          {item.title}
        </h3>

        <p id={`content-desc-${item._id}`} className="text-xs sm:text-sm text-muted-foreground line-clamp-2 break-words">
          {item.description || item.body}
        </p>

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2.5" onClick={(e) => e.stopPropagation()}>
            {item.tags.slice(0, 3).map((t, i) => (
              <button 
                type="button"
                key={i} 
                onClick={(e) => onTagClick(t, e)}
                className="inline-flex items-center text-[11px] bg-muted/60 hover:bg-primary/15 hover:text-primary px-3 py-1.5 sm:py-1 rounded-full font-medium text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] sm:min-h-[32px] break-all"
                aria-label={`Filter by topic ${t}`}
              >
                #{t}
              </button>
            ))}
            {item.tags.length > 3 && (
              <span className="text-[11px] text-muted-foreground self-center pl-0.5 font-medium">+{item.tags.length - 3}</span>
            )}
          </div>
        )}
      </CardHeader>

      {/* Card Footer */}
      <CardFooter className="p-4 sm:p-5 pt-3 border-t border-border/40 bg-muted/20 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1 min-h-[44px] px-1" title="Views" aria-label={`${item.views || 0} views`}>
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{item.views?.toLocaleString() || 0}</span>
          </div>

          <button 
            type="button"
            onClick={(e) => onLike(item, e)}
            className={`flex items-center gap-1.5 hover:text-red-500 transition-colors py-2 px-2 rounded-md -ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 min-h-[44px] min-w-[44px] ${isLiked ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}
            title="Like content"
            aria-label={isLiked ? `Unlike content, currently ${item.likes || 0} likes` : `Like content, currently ${item.likes || 0} likes`}
            aria-pressed={isLiked}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current text-red-500' : ''}`} />
            <span>{item.likes?.toLocaleString() || 0}</span>
          </button>

          <div className="flex items-center gap-1 min-h-[44px] px-1" title="Comments" aria-label={`${item.commentsCount || (item.comments ? item.comments.length : 0)} comments`}>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{item.commentsCount || (item.comments ? item.comments.length : 0)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-primary font-semibold group-hover:underline flex items-center gap-0.5 min-h-[44px] px-1">
            Read more →
          </span>
          {isMyContentView && (
            <div className="flex items-center gap-1 ml-2 border-l border-border/60 pl-2" onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => onEdit && onEdit(item, e)}
                className="h-10 w-10 p-0 hover:bg-primary/10 hover:text-primary rounded-md focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Edit Content"
                aria-label="Edit this content piece"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => onDelete && onDelete(item, e)}
                className="h-10 w-10 p-0 hover:bg-destructive/10 hover:text-destructive rounded-md focus-visible:ring-2 focus-visible:ring-destructive min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Delete Content"
                aria-label="Delete this content piece"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardFooter>
    </article>
  );
};
