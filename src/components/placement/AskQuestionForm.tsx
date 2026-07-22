import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockQuestions } from './QnAFeed';
import { Search, AlertCircle, FileCode2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AskQuestionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [title, setTitle] = useState('');
  
  // Mock logic to show similar questions as user types
  const similarQuestions = title.length > 5 
    ? mockQuestions.filter(q => q.title.toLowerCase().includes(title.toLowerCase().split(' ')[0]))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Ask a Question</h2>
        <p className="text-muted-foreground">Be as specific as possible. Include code snippets if necessary.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2 relative">
          <Label htmlFor="q-title">Title <span className="text-red-500" aria-hidden="true">*</span></Label>
          <Input 
            id="q-title"
            placeholder="e.g. How to approach DP on grids in Amazon OA?" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-required="true"
          />
        </div>

        {similarQuestions.length > 0 && (
          <div className="bg-muted/50 p-4 rounded-lg border">
            <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-primary" /> Similar questions already exist:
            </h4>
            <ul className="space-y-2">
              {similarQuestions.map(q => (
                <li key={q.id}>
                  <Link to={`/placement/doubt-solving/${q.id}`} className="text-sm text-primary hover:underline">
                    {q.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="q-desc">Description <span className="text-red-500" aria-hidden="true">*</span></Label>
          <div className="bg-muted p-2 rounded-t-md border border-b-0 flex gap-2">
            <Button type="button" variant="ghost" size="sm" className="h-8" aria-label="Insert Code Block"><FileCode2 className="w-4 h-4 mr-2"/> Code Block</Button>
            <Button type="button" variant="ghost" size="sm" className="h-8" aria-label="Bold Text"><strong>B</strong></Button>
            <Button type="button" variant="ghost" size="sm" className="h-8" aria-label="Italic Text"><em>I</em></Button>
          </div>
          <Textarea 
            id="q-desc"
            placeholder="Provide context, constraints, and what you have tried so far..." 
            className="min-h-[200px] rounded-t-none resize-y font-mono text-sm"
            aria-required="true"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DSA">DSA</SelectItem>
                <SelectItem value="Interview Prep">Interview Prep</SelectItem>
                <SelectItem value="Resume">Resume</SelectItem>
                <SelectItem value="Company-specific">Company-specific</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Company Tag (Optional)</Label>
            <Input placeholder="e.g. Amazon, Google" />
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 p-3 rounded-md flex gap-2 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>Make sure you have searched for duplicates before posting. Low-effort questions may be removed by moderators.</p>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onSuccess}>Cancel</Button>
          <Button onClick={onSuccess}>Post Question</Button>
        </div>
      </div>
    </div>
  );
}
