import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ThumbsUp, MessageSquare, Clock } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AlumniKnowledgePage: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/alumni/connections/knowledge`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPosts(await res.json());
      }
    } catch (err) {
      toast.error('Failed to fetch alumni knowledge base');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alumni Knowledge Base</h1>
            <p className="text-muted-foreground mt-1">
              Curated articles, guides, and insights written by verified alumni.
            </p>
          </div>
          <Button variant="outline" onClick={() => toast.info('To write an article, use the Community tab.')}>
            Write an Article
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white border rounded-xl shadow-sm">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No articles yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">Check back later for new insights from the alumni network.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {posts.map((post) => (
              <Card key={post._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-10 h-10 border">
                      <AvatarImage src={post.user_id?.avatar_url} />
                      <AvatarFallback>{(post.user_id?.full_name || 'A').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{post.user_id?.full_name}</span>
                        <Badge variant="outline" className="text-[10px] px-1 h-4 bg-primary/5 text-primary border-primary/20">
                          Alumni Author
                        </Badge>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Since CommunityPost content can be large/rich text, we clamp it for the preview */}
                  <div className="prose prose-sm max-w-none text-gray-700 line-clamp-3 mb-4" dangerouslySetInnerHTML={{ __html: post.content }} />
                  
                  {post.image_urls && post.image_urls.length > 0 && (
                    <div className="mb-4 rounded-lg overflow-hidden border">
                      <img src={post.image_urls[0]} alt="Post attachment" className="w-full h-48 object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{post.like_count || 0}</span>
                      </button>
                      <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comment_count || 0}</span>
                      </button>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5" onClick={() => toast.info('Full article view coming soon!')}>
                      Read full article
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
