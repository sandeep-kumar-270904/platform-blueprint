import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CoverLetterEditor } from '@/components/resume/CoverLetterEditor';

const CoverLetterEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) return <div>No Cover Letter ID provided</div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => navigate('/resume-builder')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
          <CoverLetterEditor letterId={id} onBack={() => navigate('/resume-builder')} />
        </div>
      </div>
    </div>
  );
};

export default CoverLetterEditorPage;
