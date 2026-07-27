import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ShieldAlert, AlertTriangle, Eye, Trash2, CheckCircle, AlertCircle, MessageSquare, Video, FileText, Code, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AdminCreatorsModeration = () => {
  const [activeTab, setActiveTab] = useState<'content' | 'reports'>('content');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Creators Zone Moderation</h2>
          <p className="text-muted-foreground">Monitor published content, review user reports, and enforce community standards in real-time.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> All Creator Content
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> Reports Queue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <ContentModerationList />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportsQueueList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ContentModerationList = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [reportSort, setReportSort] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [moderating, setModerating] = useState(false);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (reportSort) params.append('reportSort', 'true');

      const res = await fetch(`${API_URL}/api/admin/creators/content?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else {
        toast.error('Failed to fetch creator content');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error loading content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [statusFilter, typeFilter, reportSort]);

  const handleModerate = async (id: string, action: string, reason?: string, commentId?: string) => {
    setModerating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/creators/content/${id}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, reason, commentId })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Action executed successfully');
        setSelectedItem(null);
        fetchContent();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Moderation action failed');
      }
    } catch (error) {
      toast.error('Error executing action');
    } finally {
      setModerating(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4 text-red-500 inline mr-1" />;
      case 'project': return <Code className="h-4 w-4 text-purple-500 inline mr-1" />;
      default: return <FileText className="h-4 w-4 text-blue-500 inline mr-1" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Content Repository</CardTitle>
            <CardDescription>View and manage all uploaded content across creators.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="reported">Reported Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="project">Projects</SelectItem>
                <SelectItem value="resource">Resources</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={reportSort ? "destructive" : "outline"}
              size="sm"
              onClick={() => setReportSort(!reportSort)}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              {reportSort ? "Reported First" : "Sort by Reports"}
            </Button>

            <Button variant="ghost" size="icon" onClick={fetchContent} title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground animate-pulse">Loading creators content...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border rounded-lg bg-gray-50/50">
            No content matches the current filter criteria.
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title & Type</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Reports</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item._id} className={item.reportCount > 0 ? "bg-red-50/30" : ""}>
                    <TableCell className="font-medium max-w-[250px] truncate">
                      {getTypeIcon(item.type)}
                      <span className="font-semibold" title={item.title}>{item.title}</span>
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{item.creatorName || item.userId?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{item.userId?.email}</div>
                    </TableCell>
                    <TableCell>
                      {item.moderationStatus === 'under_review' ? (
                        <Badge variant="destructive" className="animate-pulse">Under Review</Badge>
                      ) : item.status === 'published' ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>👁️ {item.views || 0} views</div>
                      <div>❤️ {item.likes || 0} likes</div>
                    </TableCell>
                    <TableCell>
                      {item.reportCount > 0 ? (
                        <Badge variant="destructive" className="flex items-center w-fit gap-1 font-bold">
                          <AlertTriangle className="h-3 w-3" /> {item.reportCount}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">0 reports</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>
                        <Eye className="h-4 w-4 mr-1" /> View / Moderate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Moderate Content: {selectedItem.title}</span>
                <Badge variant="outline">{selectedItem.type.toUpperCase()}</Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2 border">
                <div className="text-sm"><strong>Creator:</strong> {selectedItem.creatorName} ({selectedItem.userId?.email})</div>
                <div className="text-sm"><strong>Status:</strong> {selectedItem.status} ({selectedItem.moderationStatus})</div>
                <div className="text-sm"><strong>Reports Count:</strong> {selectedItem.reportCount}</div>
                {selectedItem.tags && selectedItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedItem.tags.map((t: string) => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Description / Excerpt:</h4>
                <p className="text-sm text-gray-600 bg-white p-3 rounded border">{selectedItem.description || 'No description provided.'}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Full Content Body:</h4>
                <div className="text-sm text-gray-800 bg-gray-50 p-3 rounded border max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                  {selectedItem.body}
                </div>
              </div>

              {selectedItem.mediaUrl && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">Attached Media URL:</h4>
                  <a href={selectedItem.mediaUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm break-all">
                    {selectedItem.mediaUrl}
                  </a>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t pt-4">
              <Button
                variant="outline"
                onClick={() => handleModerate(selectedItem._id, 'dismiss_reports')}
                disabled={moderating || selectedItem.reportCount === 0}
              >
                <CheckCircle className="h-4 w-4 mr-1 text-green-600" /> Dismiss Reports
              </Button>

              <Button
                variant="outline"
                className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                onClick={() => handleModerate(selectedItem._id, 'warn_creator', 'Community guidelines violation detected in your recent content.')}
                disabled={moderating}
              >
                <AlertCircle className="h-4 w-4 mr-1 text-yellow-600" /> Warn Creator
              </Button>

              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm('Are you sure you want to remove this content? It will be deleted and vanish immediately from users feeds.')) {
                    handleModerate(selectedItem._id, 'remove_content', 'Content removed by moderation team.');
                  }
                }}
                disabled={moderating}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Remove Content
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

const ReportsQueueList = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/creators/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setReports(await res.json());
      } else {
        toast.error('Failed to load creator reports');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error loading reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAction = async (contentId: string, action: string, commentId?: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/creators/content/${contentId}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, commentId, reason: 'Reported content violation.' })
      });

      if (res.ok) {
        toast.success('Report resolved and synced in real-time');
        fetchReports();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Action failed');
      }
    } catch (err) {
      toast.error('Error executing moderation action');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Reports Queue</CardTitle>
          <CardDescription>Review user-submitted reports for posts and comments.</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchReports} title="Refresh Reports">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground animate-pulse">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border rounded-lg bg-gray-50/50">
            No pending creator reports! Clean slate 🎉
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target & Type</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const details = report.targetDetails || {};
                  return (
                    <TableRow key={report._id}>
                      <TableCell className="max-w-[260px]">
                        <div className="font-semibold text-sm flex items-center gap-1">
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {report.targetType}
                          </Badge>
                          <span className="truncate" title={details.title}>{details.title || 'Unknown Target'}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate bg-gray-50 p-1 mt-1 rounded border">
                          "{details.snippet || 'No content snippet available'}"
                        </p>
                        {details.creatorName && (
                          <div className="text-[11px] text-gray-500 mt-1">By: {details.creatorName}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{report.reporterId?.name || report.reporterId?.username || 'User'}</div>
                        <div className="text-xs text-muted-foreground">{report.reporterId?.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal bg-red-50 text-red-700 border-red-200">
                          {report.reason}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={report.status === 'pending' ? 'destructive' : 'outline'}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {details.contentId && !details.deleted ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction(details.contentId, 'dismiss_reports', details.commentId)}
                              title="Dismiss Report"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Remove this ${report.targetType}?`)) {
                                  const action = report.targetType === 'comment' ? 'remove_comment' : 'remove_content';
                                  handleAction(details.contentId, action, details.commentId);
                                }
                              }}
                              title="Remove Target"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Target removed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
