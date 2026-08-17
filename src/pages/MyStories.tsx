import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EssayTemplateModal } from '@/components/scholarships/EssayTemplateModal';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MyStories = () => {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/essay-templates/my-templates`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setTemplates(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setTemplatesLoading(false);
      }
    };

    const fetchStories = async () => {
      try {
        const token = localStorage.getItem('token');
        // We assume /api/scholarships/my-stories fetches the user's stories across all scholarships
        const res = await fetch(`${API_URL}/api/scholarships/my-stories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStories(data);
        }
      } catch (err) {
        console.error("Failed to fetch stories", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStories();
    fetchTemplates();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-600">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">Needs Revision</Badge>;
      case 'draft': return <Badge variant="outline">Draft</Badge>;
      case 'submitted':
      default:
        return <Badge variant="secondary">In Review</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-primary" />
          My Impact Stories
        </h1>
        <p className="text-muted-foreground mb-8">Manage the stories you've shared about your scholarship journey.</p>
        <Tabs defaultValue="stories" className="space-y-6">
          <TabsList>
            <TabsTrigger value="stories">My Stories</TabsTrigger>
            <TabsTrigger value="templates">My Templates</TabsTrigger>
          </TabsList>
          <TabsContent value="stories">

        {loading ? (
          <div className="flex justify-center p-24"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : stories.length === 0 ? (
          <Card className="text-center py-16 border-dashed">
            <CardContent>
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">No stories yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Once you are awarded a scholarship, you can share your experience to help inspire others.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {stories.map(story => (
              <Card key={story._id}>
                <CardHeader className="pb-3 flex flex-row justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      <Link to={`/scholarships/${story.scholarshipId}`} className="hover:underline text-primary">
                        {story.scholarshipTitle || 'Scholarship Award'}
                      </Link>
                    </CardTitle>
                    <CardDescription>Impact Area: {story.impactArea} • Posted {story.showRealName ? 'Publicly' : 'Anonymously'}</CardDescription>
                  </div>
                  <div>
                    {getStatusBadge(story.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm line-clamp-3">{story.content}</p>
                  {story.status === 'rejected' && story.rejectionReason && (
                    <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md flex gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Reviewer Note:</strong> {story.rejectionReason}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>
          <TabsContent value="templates">
            {templatesLoading ? (
              <div className="flex justify-center p-24"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : templates.length === 0 ? (
              <Card className="text-center py-16 border-dashed">
                <CardContent>
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-medium mb-2">No templates yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Share your essay structure from your approved stories to help others.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {templates.map(template => (
                  <Card key={template._id}>
                    <CardHeader className="pb-3 flex flex-row justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {template.promptType ? template.promptType.charAt(0).toUpperCase() + template.promptType.slice(1) : 'General'} Prompt Template
                        </CardTitle>
                        <CardDescription>Created on {new Date(template.createdAt).toLocaleDateString()}</CardDescription>
                      </div>
                      <div>
                        <Badge variant={template.isPublished ? 'default' : 'outline'}>
                          {template.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm line-clamp-3 text-muted-foreground">{template.structuralSummary}</p>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={async () => {
                          if(confirm('Delete template?')) {
                            const token = localStorage.getItem('token');
                            await fetch(`${API_URL}/api/essay-templates/${template._id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                            setTemplates(templates.filter(t => t._id !== template._id));
                          }
                        }}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyStories;

