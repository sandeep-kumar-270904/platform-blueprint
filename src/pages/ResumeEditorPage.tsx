import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Archive } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ResumeEditor } from '@/components/resume/ResumeEditor';

const ResumeEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) return <div>No Resume ID provided</div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => navigate('/resume-builder')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Resumes
          </Button>
          <ResumeEditor resumeId={id} />
        </div>
      </div>
    </div>
  );
};

export default ResumeEditorPage;
