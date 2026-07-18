import { useState } from 'react';
import { useCoverLetters } from '@/hooks/useResume';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Trash2, Edit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CoverLetterEditor } from './CoverLetterEditor';

export const CoverLetterList = () => {
  const { coverLetters, loading, deleteCoverLetter, createCoverLetter } = useCoverLetters();
  const [activeLetterId, setActiveLetterId] = useState<string | null>(null);

  if (activeLetterId) {
    return (
      <CoverLetterEditor 
        letterId={activeLetterId} 
        onBack={() => setActiveLetterId(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Cover Letters</h2>
        <Button onClick={async () => {
          const newLetter = await createCoverLetter({ title: 'New Cover Letter' });
          if (newLetter) setActiveLetterId(newLetter._id);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Cover Letter
        </Button>
      </div>

      {loading ? (
        <div>Loading cover letters...</div>
      ) : coverLetters.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mb-4 opacity-20" />
            <p>No cover letters yet. Generate one to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coverLetters.map(letter => (
            <Card key={letter._id} className="group relative hover:border-primary transition-colors cursor-pointer" onClick={() => setActiveLetterId(letter._id)}>
              <CardHeader>
                <CardTitle className="text-lg line-clamp-1">{letter.title}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(letter.updatedAt), { addSuffix: true })}
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground flex gap-2 items-center">
                  <div className="flex-1 truncate">
                    {letter.jobTitle ? `${letter.jobTitle} at ${letter.companyName}` : 'General Cover Letter'}
                  </div>
                </div>
                
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCoverLetter(letter._id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
