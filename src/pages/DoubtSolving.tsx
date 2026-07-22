import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QnAFeed } from '@/components/placement/QnAFeed';
import { AskQuestionForm } from '@/components/placement/AskQuestionForm';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

export default function DoubtSolving() {
  const [isAskDialogOpen, setIsAskDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 mt-16 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Doubt Solving & Ask-a-Senior</h1>
            <p className="text-muted-foreground">Get unstuck. Ask questions and get answers from verified seniors and alumni.</p>
          </div>
          
          <Dialog open={isAskDialogOpen} onOpenChange={setIsAskDialogOpen}>
            <DialogTrigger asChild>
              <Button className="whitespace-nowrap">
                <PlusCircle className="w-4 h-4 mr-2" /> Ask a Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <AskQuestionForm onSuccess={() => setIsAskDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="feed">Q&A Feed</TabsTrigger>
            <TabsTrigger value="activity">My Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="feed" className="space-y-6">
            <QnAFeed mode="feed" />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <QnAFeed mode="activity" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
