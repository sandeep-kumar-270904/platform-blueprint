import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface PeerFeedbackProps {
  resumeId: string;
}

export const PeerFeedback: React.FC<PeerFeedbackProps> = ({ resumeId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Peer Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Feedback for resume {resumeId} will appear here.
        </p>
      </CardContent>
    </Card>
  );
};
