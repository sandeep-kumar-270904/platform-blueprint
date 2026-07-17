import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminNews, updateNewsStatus, useNewsReports, updateReportStatus, useIngestionLogs } from "@/hooks/useNews";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle, XCircle, Check, AlertTriangle, ExternalLink } from "lucide-react";

export default function AdminNewsModeration() {
  const { articles, loading, refetch } = useAdminNews('pending');
  const { reports, loading: loadingReports, refetch: refetchReports } = useNewsReports();
  const { logs, loading: loadingLogs, refetch: refetchLogs } = useIngestionLogs();
  
  const [actingOn, setActingOn] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setActingOn(id);
    try {
      await updateNewsStatus(id, 'live');
      toast.success("Article approved and is now live");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActingOn(null);
    }
  };

  const handleReject = async (id: string) => {
    setActingOn(id);
    try {
      await updateNewsStatus(id, 'rejected');
      toast.success("Article rejected");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActingOn(null);
    }
  };

  const handleReportAction = async (reportId: string, status: string, articleId?: string, articleStatus?: string) => {
    try {
      await updateReportStatus(reportId, status, "Action taken from dashboard");
      if (articleId && articleStatus) {
         await updateNewsStatus(articleId, articleStatus);
      }
      toast.success("Report actioned successfully");
      refetchReports();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F1] flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-24 flex-1">
        <h1 className="text-4xl font-black font-serif mb-8 text-black">News Moderation</h1>
        
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="pending">Pending Submissions</TabsTrigger>
            <TabsTrigger value="flagged">Flagged Articles</TabsTrigger>
            <TabsTrigger value="health">Ingestion Health</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending User Submissions</CardTitle>
                <CardDescription>Review and approve articles submitted by the community.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? <p>Loading...</p> : articles.length === 0 ? <p className="text-muted-foreground">No pending submissions.</p> : (
                  articles.map((article: any) => (
                    <div key={article._id} className="border border-black/10 p-6 rounded-xl bg-white shadow-sm flex flex-col md:flex-row gap-6 justify-between">
                      <div className="flex-1">
                        <div className="flex gap-2 mb-3 items-center">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-none">{article.category}</Badge>
                          <span className="text-sm text-black/50">By {article.submittedBy?.username || 'Unknown'}</span>
                          <span className="text-sm text-black/50">•</span>
                          <span className="text-xs text-black/50">{format(new Date(article.publishedAt), 'PPp')}</span>
                        </div>
                        <a href={article.sourceLink} target="_blank" className="font-bold text-xl font-serif hover:text-primary transition-colors flex items-center mb-2">
                          {article.title} <ExternalLink className="w-4 h-4 ml-2 opacity-50" />
                        </a>
                        <p className="text-sm text-black/70 mb-4">{article.summary}</p>
                        <div className="flex flex-wrap gap-1">
                          {article.tags?.map((t: string) => <Badge variant="outline" key={t} className="text-xs border-black/10">{t}</Badge>)}
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 min-w-[140px] justify-center">
                        <Button 
                          onClick={() => handleApprove(article._id)} 
                          disabled={actingOn === article._id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Approve
                        </Button>
                        <Button 
                          onClick={() => handleReject(article._id)}
                          disabled={actingOn === article._id}
                          variant="destructive"
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="flagged">
            <Card>
              <CardHeader>
                <CardTitle>Flagged Articles</CardTitle>
                <CardDescription>Articles reported by users for spam or broken links.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingReports ? <p>Loading...</p> : reports.length === 0 ? <p className="text-muted-foreground">No pending reports.</p> : (
                  reports.map((report: any) => (
                    <div key={report._id} className="border border-black/10 p-6 rounded-xl bg-white shadow-sm">
                      <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                        <div>
                          <Badge variant="destructive" className="mb-2 uppercase tracking-wider text-xs">{report.reason.replace('_', ' ')}</Badge>
                          <p className="text-sm text-black/60">Reported by <span className="font-semibold text-black">{report.reportedBy?.username || 'Unknown'}</span> on {format(new Date(report.createdAt), 'PP')}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleReportAction(report._id, 'reviewed_dismissed')}>
                            Dismiss Report
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReportAction(report._id, 'reviewed_actioned', report.articleId?._id, 'rejected')}>
                            Hide Article
                          </Button>
                        </div>
                      </div>
                      <div className="bg-[#F9F7F1] p-4 rounded-lg border border-black/5">
                        {report.articleId ? (
                           <>
                             <a href={report.articleId.sourceLink} target="_blank" className="font-semibold font-serif text-lg text-primary hover:underline">{report.articleId.title}</a>
                             <p className="text-sm text-black/70 mt-2 line-clamp-2">{report.articleId.summary}</p>
                           </>
                        ) : (
                           <p className="text-sm italic text-black/50">Article already deleted.</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Ingestion Engine Health</CardTitle>
                    <CardDescription>Recent automated runs.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetchLogs()}>Refresh Logs</Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingLogs ? <p>Loading...</p> : logs.length === 0 ? <p className="text-muted-foreground">No logs found.</p> : (
                  <div className="overflow-x-auto rounded-lg border border-black/10">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[#F9F7F1] text-black">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Time</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold text-right">Fetched</th>
                          <th className="px-4 py-3 font-semibold text-right">Added</th>
                          <th className="px-4 py-3 font-semibold text-right">Rejected</th>
                          <th className="px-4 py-3 font-semibold text-right">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {logs.map((log: any) => (
                          <tr key={log._id} className="hover:bg-black/[0.02]">
                            <td className="px-4 py-3 font-medium whitespace-nowrap text-black/70">{format(new Date(log.createdAt), 'PP p')}</td>
                            <td className="px-4 py-3">
                              {log.errorLogs?.length > 0 ? (
                                <Badge variant="destructive" className="flex w-fit items-center"><AlertTriangle className="w-3 h-3 mr-1"/> Error</Badge>
                              ) : (
                                <Badge className="bg-green-500 hover:bg-green-600 flex w-fit items-center border-none"><Check className="w-3 h-3 mr-1"/> Success</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">{log.metrics?.totalFetched || 0}</td>
                            <td className="px-4 py-3 text-right">{log.metrics?.totalAdded || 0}</td>
                            <td className="px-4 py-3 text-right">{log.metrics?.totalSpamRejected || 0}</td>
                            <td className="px-4 py-3 text-right text-black/50">{log.durationMs}ms</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
