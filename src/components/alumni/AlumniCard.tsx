import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CheckCircle2, MapPin, Briefcase } from 'lucide-react';

interface AlumniProfile {
  _id: string;
  userId: {
    _id: string;
    full_name: string;
    avatar_url?: string;
  };
  currentRole?: string;
  currentCompany?: string;
  graduationYear: number;
  branch: string;
  skills?: string[];
  verificationStatus: string;
  willingness: {
    openToQa: boolean;
    openToMentoring: boolean;
    openToResumeReview?: boolean;
  };
}

export const AlumniCard: React.FC<{ profile: AlumniProfile }> = ({ profile }) => {
  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-primary/10">
              <AvatarImage src={profile.userId?.avatar_url} />
              <AvatarFallback className="bg-primary/5 text-primary">
                {profile.userId?.full_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg flex items-center gap-1.5">
                {profile.userId?.full_name || 'Alumni'}
                {profile.verificationStatus === 'verified' && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
              </CardTitle>
              <CardDescription className="flex flex-col gap-1 mt-1">
                {profile.currentRole && profile.currentCompany && (
                  <span className="flex items-center gap-1.5 text-sm">
                    <Briefcase className="w-3.5 h-3.5" />
                    {profile.currentRole} @ {profile.currentCompany}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {profile.branch}, Class of {profile.graduationYear}
                </span>
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4">
        {profile.skills && profile.skills.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">SKILLS & EXPERTISE</div>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.slice(0, 4).map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="font-normal text-xs">{skill}</Badge>
              ))}
              {profile.skills.length > 4 && (
                <Badge variant="outline" className="font-normal text-xs">+{profile.skills.length - 4}</Badge>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-1">CAN HELP WITH</div>
          <div className="flex flex-wrap gap-2">
            {profile.willingness?.openToMentoring && (
              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-md border border-purple-100">Mentoring</span>
            )}
            {profile.willingness?.openToQa && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">Q&A</span>
            )}
            {profile.willingness?.openToResumeReview && (
              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100">Resume Review</span>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <Button variant="outline" className="w-full" asChild>
          <Link to={`/alumni/connections/profile/${profile._id}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
