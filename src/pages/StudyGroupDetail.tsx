import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const StudyGroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 text-center">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/study-groups')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory
        </Button>
        <h1 className="text-3xl font-bold mb-4">Study Group Detail View</h1>
        <p className="text-muted-foreground mb-8">
          This is a placeholder for group ID: <span className="font-mono bg-muted px-2 py-1 rounded">{id}</span>
        </p>
        <p className="text-sm">The full detail view (chat, resources, progress) will be implemented in a later phase.</p>
      </div>
    </div>
  );
};

export default StudyGroupDetail;
