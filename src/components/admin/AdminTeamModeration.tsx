import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Loader2, Flag, CheckCircle, XCircle, Users, TrendingUp, AlertTriangle, ShieldAlert, MoreVertical, Ban, Trash2, StopCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';

export function AdminTeamModeration({ institutionId }: { institutionId?: string }) {
  const { t } = useTranslation();
  const [reports, setReports] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = institutionId ? `&institutionId=${institutionId}` : '';
      const [reportsRes, analyticsRes, teamsRes] = await Promise.all([
        api.get(`/admin/team-moderation/reports?status=${statusFilter}${params}`),
        api.get(`/admin/team-hunt/analytics?days=30${params}`).catch(() => ({ data: { data: null } })),
        api.get(`/admin/team-moderation/teams?page=1&limit=50${params}`)
      ]);
      setReports(reportsRes.data.data || []);
      setTeams(teamsRes.data.data || []);
      if (analyticsRes.data && analyticsRes.data.data) {
        setAnalytics(analyticsRes.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error(t('admin.teamHunt.loadError', 'Failed to load team moderation data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, institutionId]);

  const handleReportAction = async (id: string, newStatus: string, actionValue: string) => {
    try {
      setProcessingId(id);
      await api.put(`/admin/team-moderation/reports/${id}`, { 
        status: newStatus,
        action: actionValue,
        actionDetails: newStatus === 'actioned' ? 'Violated community guidelines' : undefined
      });
      toast.success(t('admin.teamHunt.actionSuccess', `Report processed`));
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(t('admin.teamHunt.actionError', 'Failed to update report'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleTeamAction = async (teamId: string, action: string, data?: any) => {
    try {
      setProcessingId(teamId);
      if (action === 'close') {
        await api.put(`/admin/team-moderation/teams/${teamId}/close`, { reason: 'Administrative override' });
        toast.success("Team closed successfully");
      } else if (action === 'remove') {
        await api.delete(`/admin/team-moderation/teams/${teamId}`, { data: { reason: 'Administrative override' } });
        toast.success("Team removed successfully");
      } else if (action === 'flag') {
        await api.put(`/admin/team-moderation/teams/${teamId}/flag`, { flag: data.flag, reason: 'Flag toggled by admin' });
        toast.success(`Team ${data.flag ? 'flagged' : 'unflagged'} successfully`);
      } else if (action === 'ban') {
        await api.post(`/admin/team-moderation/users/${data.userId}/ban`, { ban: true, reason: 'Banned by admin via team hunt dashboard' });
        toast.success("Creator banned from Team Hunt");
      }
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to perform action");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">{t('admin.teamHunt.title', 'Team Hunt Moderation & Analytics')}</h3>
          <p className="text-muted-foreground text-sm">
            {t('admin.teamHunt.subtitle', 'Monitor team creation growth, manage category distribution, and resolve community reports.')}
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('common.refresh', 'Refresh Data')}
        </Button>
      </div>

      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList className="grid w-full max-w-[600px] grid-cols-3">
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('admin.teamHunt.tabTeams', 'Team Management')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('admin.teamHunt.tabAnalytics', 'Analytics Overview')}
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            {t('admin.teamHunt.tabReports', 'Reports Queue')}
            {pendingReportsCount > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-xs">
                {pendingReportsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Teams</CardTitle>
              <CardDescription>Manage and moderate all team hunt activities.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reports</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : teams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No teams found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    teams.map((team) => (
                      <TableRow key={team._id}>
                        <TableCell>
                          <div className="font-medium flex items-center gap-2">
                            {team.title}
                            {team.flagged && <Flag className="h-3 w-3 text-destructive" />}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">{team.description}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{team.creator?.username || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{team.creator?.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{team.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            team.status === 'open' ? 'default' : 
                            team.status === 'closed' ? 'destructive' : 'secondary'
                          }>
                            {team.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {team.reportCount > 0 ? (
                            <Badge variant="destructive">{team.reportCount}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={processingId === team._id}>
                                {processingId === team._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => window.open(`/teams/${team._id}`, '_blank')}>
                                <Eye className="mr-2 h-4 w-4" /> View Applicants
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTeamAction(team._id, 'flag', { flag: !team.flagged })}>
                                <Flag className="mr-2 h-4 w-4" /> {team.flagged ? 'Unflag Team' : 'Flag Team'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleTeamAction(team._id, 'close')} className="text-amber-600">
                                <StopCircle className="mr-2 h-4 w-4" /> Force Close
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTeamAction(team._id, 'remove')} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Remove (Soft Delete)
                              </DropdownMenuItem>
                              {team.creator?._id && (
                                <DropdownMenuItem onClick={() => handleTeamAction(team._id, 'ban', { userId: team.creator._id })} className="text-destructive">
                                  <Ban className="mr-2 h-4 w-4" /> Ban Creator
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.teamHunt.kpiTotalTeams', 'Total Teams')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalTeams || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('admin.teamHunt.kpiTeamsSub', 'Across all categories and institutions')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.teamHunt.kpiRecentApps', '30-Day Applications')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analytics?.recentApplications || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('admin.teamHunt.kpiAppsSub', 'Student collaboration requests')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.teamHunt.kpiPendingReports', 'Pending Reports')}</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{pendingReportsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('admin.teamHunt.kpiReportsSub', 'Requiring admin review')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.teamHunt.categoryTitle', 'Teams by Category')}</CardTitle>
                <CardDescription>{t('admin.teamHunt.categoryDesc', 'Distribution of project categories across the platform')}</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.byCategory && analytics.byCategory.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.byCategory.map((cat: any) => {
                      const total = analytics.totalTeams || 1;
                      const pct = Math.round((cat.count / total) * 100);
                      return (
                        <div key={cat._id || 'other'} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{cat._id || 'Other'}</span>
                            <span className="text-muted-foreground">{cat.count} ({pct}%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    {t('admin.teamHunt.noCategoryData', 'No category data available yet.')}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.teamHunt.statusTitle', 'Teams by Status')}</CardTitle>
                <CardDescription>{t('admin.teamHunt.statusDesc', 'Current operational status of created teams')}</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.byStatus && analytics.byStatus.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {analytics.byStatus.map((st: any) => (
                      <div key={st._id} className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card text-card-foreground shadow-sm flex-1 min-w-[120px]">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">{st._id || 'unknown'}</span>
                          <span className="text-xl font-bold mt-0.5">{st.count}</span>
                        </div>
                        <Badge variant={st._id === 'open' ? 'default' : st._id === 'completed' ? 'secondary' : 'outline'}>
                          {st._id}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    {t('admin.teamHunt.noStatusData', 'No status data available yet.')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex justify-between items-center bg-muted/40 p-4 rounded-lg border">
            <span className="text-sm font-medium">
              {t('admin.teamHunt.filterReports', 'Filter Moderation Reports:')}
            </span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t('admin.teamHunt.statusPending', 'Pending')}</SelectItem>
                <SelectItem value="actioned">{t('admin.teamHunt.statusActioned', 'Actioned')}</SelectItem>
                <SelectItem value="dismissed">{t('admin.teamHunt.statusDismissed', 'Dismissed')}</SelectItem>
                <SelectItem value="all">{t('admin.teamHunt.statusAll', 'All Reports')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.teamHunt.thTeam', 'Team')}</TableHead>
                    <TableHead>{t('admin.teamHunt.thReportedBy', 'Reported By')}</TableHead>
                    <TableHead>{t('admin.teamHunt.thReason', 'Reason')}</TableHead>
                    <TableHead>{t('admin.teamHunt.thDetails', 'Details')}</TableHead>
                    <TableHead>{t('admin.teamHunt.thStatus', 'Status')}</TableHead>
                    <TableHead className="text-right">{t('admin.teamHunt.thActions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {t('admin.teamHunt.noReports', 'No reports found matching this filter.')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => (
                      <TableRow key={report._id}>
                        <TableCell>
                          <div className="font-medium">{report.team?.title || 'Unknown Team'}</div>
                          <div className="text-xs text-muted-foreground">{report.team?._id}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{report.reportedBy?.username || 'Unknown User'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase">{report.reason}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={report.details}>
                          {report.details || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            report.status === 'pending' ? 'default' : 
                            report.status === 'actioned' ? 'destructive' : 'secondary'
                          }>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {report.status === 'pending' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={processingId === report._id}>
                                  {processingId === report._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleReportAction(report._id, 'dismissed', 'dismiss_report')} className="text-green-600">
                                  Dismiss Report
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReportAction(report._id, 'actioned', 'close_and_warn')} className="text-amber-600">
                                  Close Team & Warn Creator
                                </DropdownMenuItem>
                                {report.team?.creator && (
                                  <DropdownMenuItem onClick={() => handleTeamAction(report.team._id, 'ban', { userId: report.team.creator })} className="text-destructive">
                                    Ban Creator
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
