import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GDTopicsLibrary } from '@/components/placement/GDTopicsLibrary';
import { GDSelfPractice } from '@/components/placement/GDSelfPractice';
import { CommunicationLessons } from '@/components/placement/CommunicationLessons';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Users, BookOpen } from 'lucide-react';

export default function GroupDiscussionPrep() {
  const [topicsPracticed, setTopicsPracticed] = useState(0);
  const [lessonsCompleted, setLessonsCompleted] = useState(0);

  const totalLessons = 5; // Static for mock
  const lessonProgress = (lessonsCompleted / totalLessons) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 mt-16 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Group Discussion & Communication</h1>
          <p className="text-muted-foreground">Master your communication skills and prepare for GD rounds.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-primary/10 to-background border-primary/20">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-primary/20 p-3 rounded-full">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Topics Practiced</p>
                <p className="text-2xl font-bold">{topicsPracticed}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-indigo-500/10 to-background border-indigo-500/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-500/20 p-2 rounded-full">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                  </div>
                  <p className="text-sm font-medium">Micro-Lessons</p>
                </div>
                <p className="text-sm font-bold">{lessonsCompleted} / {totalLessons}</p>
              </div>
              <Progress value={lessonProgress} className="h-2 w-full" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="library" className="w-full">
          <TabsList className="mb-6 grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="library">Topics Library</TabsTrigger>
            <TabsTrigger value="practice">Self-Practice</TabsTrigger>
            <TabsTrigger value="lessons">Communication Skills</TabsTrigger>
          </TabsList>
          
          <TabsContent value="library" className="space-y-6">
            <GDTopicsLibrary />
          </TabsContent>

          <TabsContent value="practice" className="space-y-6">
            <GDSelfPractice onPracticeComplete={() => setTopicsPracticed(p => p + 1)} />
          </TabsContent>

          <TabsContent value="lessons" className="space-y-6">
            <CommunicationLessons 
              completedCount={lessonsCompleted}
              onUpdateCount={setLessonsCompleted}
              totalLessons={totalLessons}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
