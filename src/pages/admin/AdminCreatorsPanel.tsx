import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Loader2, ShieldAlert, Trash2, CheckCircle, Eye, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCreatorsPanel() {
  const { user } = useAuth();
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const res = await api.get('/creators/admin/content');
      setContent(res.data);
    } catch (err) {
      toast.error('Failed to load creator content');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'suspend' | 'delete') => {
    try {
      await api.post(`/creators/admin/content/${id}/action`, { action });
      toast.success(`Content ${action}d successfully`);
      if (action === 'delete') {
        setContent(prev => prev.filter(c => c._id !== id));
      } else {
        fetchContent(); // Refresh to get updated status
      }
    } catch (err) {
      toast.error(`Failed to ${action} content`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Creators Moderation</h2>
          <p className="text-muted-foreground">Manage and moderate all creator content on the platform.</p>
        </div>
        <Button onClick={fetchContent} variant="outline">Refresh Data</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content List</CardTitle>
          <CardDescription>Review reported or pending content pieces.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : content.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
              No content found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Title</th>
                    <th className="px-4 py-3">Creator</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Reports</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {content.map((item) => (
                    <tr key={item._id} className="border-b border-border/40 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[200px] block" title={item.title}>{item.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {item.userId?.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Badge variant={item.status === 'published' ? 'default' : 'secondary'}>
                            {item.status}
                          </Badge>
                          {item.moderationStatus === 'under_review' && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Review Needed
                            </Badge>
                          )}
                          {item.moderationStatus === 'actioned' && (
                            <Badge variant="outline" className="text-orange-500 border-orange-500">
                              Suspended
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-destructive">
                        {item.reportCount > 0 ? item.reportCount : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2"
                            onClick={() => window.open(`/creators?id=${item._id}`, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleAction(item._id, 'approve')}
                            disabled={item.moderationStatus === 'normal'}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={() => handleAction(item._id, 'suspend')}
                            disabled={item.moderationStatus === 'actioned' || item.status === 'draft'}
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if(window.confirm('Delete this content permanently?')) {
                                handleAction(item._id, 'delete');
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
