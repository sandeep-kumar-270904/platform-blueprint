import React from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, ChevronRight, Image as ImageIcon, Sparkles, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

interface CompletenessProps {
  profile: any;
  onNudgeClick: (fieldId: string) => void;
}

export const RoommateProfileCompleteness: React.FC<CompletenessProps> = ({ profile, onNudgeClick }) => {
  if (!profile) return null;

  // Calculate score
  let score = 0;
  
  // Base fields (50%)
  const baseFields = [
    profile.bio,
    profile.budgetRange?.min,
    profile.moveInDate,
    profile.lifestyle_preferences?.cleanliness,
    profile.lifestyle_preferences?.sleepSchedule
  ];
  const filledBaseFields = baseFields.filter(Boolean).length;
  score += Math.round((filledBaseFields / baseFields.length) * 50);

  // Photos (30%)
  const hasProfilePhoto = !!profile.profilePhoto;
  if (hasProfilePhoto) score += 15;
  const hasGalleryPhotos = profile.galleryPhotos && profile.galleryPhotos.length > 0;
  if (hasGalleryPhotos) score += 15;

  // Preferences (10%)
  const prefFields = [
    profile.lifestyle_preferences?.smoking,
    profile.lifestyle_preferences?.pets
  ];
  const filledPrefFields = prefFields.filter(Boolean).length;
  score += Math.round((filledPrefFields / prefFields.length) * 10);

  // Advanced Lifestyle (10%)
  const advFields = [
    profile.lifestyle_preferences?.guestPolicy,
    profile.lifestyle_preferences?.cookingHabits,
    profile.lifestyle_preferences?.sharedSpaceExpectations
  ];
  const filledAdvFields = advFields.filter(Boolean).length;
  score += Math.round((filledAdvFields / advFields.length) * 10);

  // Determine top nudge
  const hasExtendedBio = profile.bio && profile.bio.length >= 50;
  let topNudge = null;
  if (!hasProfilePhoto) {
    topNudge = {
      id: 'field-profilePhoto',
      icon: <Camera className="w-4 h-4" />,
      text: "Add a profile photo to increase your match visibility."
    };
  } else if (filledAdvFields < advFields.length) {
    topNudge = {
      id: 'field-guestPolicy',
      icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
      text: "Add advanced lifestyle details like guest policy to sharpen matches."
    };
  } else if (!hasGalleryPhotos) {
    topNudge = {
      id: 'field-galleryPhotos',
      icon: <ImageIcon className="w-4 h-4" />,
      text: "Add gallery photos of yourself or the room to stand out."
    };
  } else if (!hasExtendedBio) {
    topNudge = {
      id: 'field-bio',
      icon: <Sparkles className="w-4 h-4" />,
      text: "Expand your bio to tell potential roommates more about you."
    };
  }

  if (score === 100) return null;

  return (
    <div className="mb-8 space-y-4 max-w-4xl mx-auto">
      {score < 75 && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Profile Incomplete</AlertTitle>
          <AlertDescription>
            Your profile completeness is low ({score}%). Incomplete profiles receive significantly fewer matches and are less visible to others.
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-card border-primary/10 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 bg-primary h-full" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            
            {/* Score Ring / Bar */}
            <div className="flex-1 w-full space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    Profile Strength
                    {score >= 90 && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  </h3>
                  <p className="text-sm text-muted-foreground">Complete your profile to find better roommate matches</p>
                </div>
                <span className="font-bold text-2xl text-primary">{score}%</span>
              </div>
              <Progress value={score} className="h-3" />
            </div>

            {/* Nudge Action */}
            {topNudge && (
              <div className="flex-shrink-0 w-full md:w-auto">
                <Button 
                  variant="outline" 
                  className="w-full md:w-auto group border-primary/30 hover:border-primary hover:bg-primary/5 transition-all h-auto py-3 px-4 justify-start text-left"
                  onClick={() => onNudgeClick(topNudge.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full text-primary group-hover:scale-110 transition-transform">
                      {topNudge.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium whitespace-normal max-w-[200px] leading-tight">
                        {topNudge.text}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Button>
              </div>
            )}
            
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
