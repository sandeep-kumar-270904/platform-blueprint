import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, DollarSign, TrendingUp, Heart, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useColleges } from "@/hooks/useColleges";

interface CollegeCardProps {
  college: any;
  isSaved?: boolean;
  isCompared?: boolean;
  onToggleCompare?: (college: any) => void;
}

export const CollegeCard = ({ college, isSaved, isCompared, onToggleCompare }: CollegeCardProps) => {
  const { user } = useAuth();
  const { toggleSaveCollege } = useColleges();

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to save colleges.");
      // Ideally redirect to /auth or open a modal
      return;
    }
    toggleSaveCollege.mutate({ id: college._id, isSaved: !!isSaved });
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onToggleCompare) {
      onToggleCompare(college);
    }
  };

  return (
    <Card className="hover-scale flex flex-col h-full border-border bg-card">
      <CardHeader className="relative pb-2">
        <div className="absolute top-4 right-4 flex gap-2">
          {onToggleCompare && (
            <Button
              variant="secondary"
              size="icon"
              className={`h-8 w-8 rounded-full ${isCompared ? 'bg-primary text-primary-foreground' : 'bg-background/80 backdrop-blur-sm hover:bg-background'}`}
              onClick={handleCompare}
              title={isCompared ? "Remove from compare" : "Add to compare"}
            >
              <Scale className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={handleSave}
            title={isSaved ? "Unsave college" : "Save college"}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </Button>
        </div>
        <div className="text-5xl mb-4">{college.logoOrIcon || "🏛️"}</div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-xs font-normal">
            {college.type}
          </Badge>
          {college.accreditation && (
            <Badge variant="secondary" className="text-xs font-normal truncate max-w-[120px]">
              {college.accreditation}
            </Badge>
          )}
        </div>
        <h3 className="text-xl font-bold line-clamp-2">{college.name}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">{college.location?.city}, {college.location?.state}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="font-medium">{college.rating?.toFixed(1) || '0.0'}</span>
            <span className="text-sm text-muted-foreground">({college.totalReviews || 0} reviews)</span>
          </div>
          {college.matchScore !== undefined && (
            <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200">
              {college.matchScore}% Match
            </Badge>
          )}
        </div>
        
        {college.matchReason && (
          <div className="text-sm bg-blue-500/10 text-blue-800 dark:text-blue-300 p-3 rounded-lg border border-blue-200 dark:border-blue-900/50">
            <strong>AI Note:</strong> {college.matchReason}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-3 rounded-lg">
          <div>
            <div className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Tuition
            </div>
            <div className="font-medium">₹{(college.fees?.tuition / 100000).toFixed(1)}L/yr</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Avg Package
            </div>
            <div className="font-medium text-green-500 dark:text-green-400">{college.avgPackage || 'N/A'}</div>
          </div>
        </div>
        {!college.matchReason && college.coursesOffered && college.coursesOffered.length > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">Top Course: </span>
            <span className="font-medium truncate block">{college.coursesOffered[0].name}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Link to={`/colleges/${college._id}`} className="w-full">
          <Button className="w-full" variant="default">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
