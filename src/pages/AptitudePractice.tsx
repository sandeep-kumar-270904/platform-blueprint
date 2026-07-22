import React from 'react';
import { Header } from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Brain, Calculator, BookOpen, PlayCircle, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
};

export default function AptitudePractice() {
  const navigate = useNavigate();

  const { data: topicsData, isLoading } = useQuery({
    queryKey: ['aptitudeTopics'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/aptitude/topics`, { headers: getAuthHeaders() });
      return res.data; 
    }
  });

  const { data: testDefinitions } = useQuery({
    queryKey: ['aptitudeTestDefinitions'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/aptitude/test/definitions`, { headers: getAuthHeaders() });
      return res.data;
    }
  });

  const renderCategory = (categoryName: string, topics: any[], Icon: any, colorClass: string) => {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-lg bg-${colorClass}-500/10`}>
            <Icon className={`w-8 h-8 text-${colorClass}-500`} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{categoryName}</h2>
            <p className="text-muted-foreground">Master the concepts to clear the initial screening rounds.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics?.map((topic, idx) => (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{topic.topic}</CardTitle>
                <CardDescription>{topic.totalQuestions} Questions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{topic.attempted} / {topic.totalQuestions}</span>
                </div>
                <Progress value={topic.totalQuestions > 0 ? (topic.attempted / topic.totalQuestions) * 100 : 0} className="h-2 mb-4" />
                
                <div className="flex justify-between items-center text-sm mb-6">
                  <span className="text-muted-foreground">Accuracy</span>
                  <span className={`font-medium ${topic.accuracy > 70 ? 'text-green-500' : topic.accuracy > 0 ? 'text-yellow-500' : ''}`}>
                    {topic.accuracy}%
                  </span>
                </div>

                <Button className="w-full" onClick={() => navigate(`/placement/aptitude/practice/${categoryName}/${encodeURIComponent(topic.topic)}`)}>
                  <PlayCircle className="w-4 h-4 mr-2" /> Practice Now
                </Button>
              </CardContent>
            </Card>
          ))}
          {(!topics || topics.length === 0) && (
            <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              No topics available in this category yet.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-16 max-w-7xl">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Aptitude & Reasoning</h1>
            <p className="text-xl text-muted-foreground">
              Prepare for the crucial first round of campus placements.
            </p>
          </div>
          
          {testDefinitions && testDefinitions.length > 0 && (
            <Card className="bg-primary text-primary-foreground border-none">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Trophy className="w-8 h-8 mb-2" />
                <h3 className="font-bold text-lg mb-1">{testDefinitions[0].name}</h3>
                <p className="text-sm text-primary-foreground/80 mb-4 max-w-[250px]">
                  {testDefinitions[0].timeLimitMinutes} Minutes • {testDefinitions[0].allowBackwardNavigation ? 'Flexible' : 'Strict Navigation'}
                </p>
                <Button variant="secondary" className="w-full" onClick={() => navigate(`/placement/aptitude/test/setup?defId=${testDefinitions[0]._id}`)}>
                  Start Mock Test
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {isLoading ? (
          <div className="py-20 text-center">Loading aptitude topics...</div>
        ) : (
          <Tabs defaultValue="quantitative" className="w-full">
            <TabsList className="mb-8 h-12">
              <TabsTrigger value="quantitative" className="text-base px-6">
                <Calculator className="w-4 h-4 mr-2" /> Quantitative
              </TabsTrigger>
              <TabsTrigger value="logical" className="text-base px-6">
                <Brain className="w-4 h-4 mr-2" /> Logical Reasoning
              </TabsTrigger>
              <TabsTrigger value="verbal" className="text-base px-6">
                <BookOpen className="w-4 h-4 mr-2" /> Verbal Ability
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="quantitative">
              {renderCategory('Quantitative', topicsData?.Quantitative, Calculator, 'blue')}
            </TabsContent>
            <TabsContent value="logical">
              {renderCategory('Logical', topicsData?.Logical, Brain, 'purple')}
            </TabsContent>
            <TabsContent value="verbal">
              {renderCategory('Verbal', topicsData?.Verbal, BookOpen, 'green')}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
