import os

reflection_modal = """import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Props {
  notification: {
    message: string;
    link: string;
  };
  onClose: () => void;
}

export default function AnnualReflectionModal({ notification, onClose }: Props) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full animate-in zoom-in-95 duration-200">
        <CardHeader className="bg-primary/5 pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            🎉 Happy Platform Anniversary!
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-4">
            It's been a year since you started your journey with us. We've put together a quick reflection based on how your resume has evolved over the past 12 months:
          </p>
          <div className="bg-muted/50 p-4 rounded-lg border text-sm italic">
            "{notification.message}"
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Dismiss</Button>
          <Button onClick={() => {
            onClose();
            navigate(notification.link);
          }}>
            Review My Resume
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
"""

with open("src/components/resume/AnnualReflectionModal.tsx", "w", encoding="utf-8") as f:
    f.write(reflection_modal)
print("Created AnnualReflectionModal.tsx")
