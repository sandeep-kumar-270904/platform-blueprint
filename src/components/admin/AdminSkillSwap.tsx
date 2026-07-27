import React, { useState } from 'react';
import { useAdminSkillSwapStats, useAdminSkillSwapReports, useAdminResolveReport, useAdminSkillSwapOffers, useAdminModerateOffer } from '../../hooks/useAdminSkillSwap';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

export const AdminSkillSwap = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Skill Swap Moderation</h2>
        <p className="text-muted-foreground">Manage offers, reports, and community trust.</p>
      </div>

      <StatsOverview />

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">Reports Queue</TabsTrigger>
          <TabsTrigger value="offers">Offer Moderation</TabsTrigger>
        </TabsList>
        <TabsContent value="reports" className="space-y-4">
          <ReportsQueue />
        </TabsContent>
        <TabsContent value="offers" className="space-y-4">
          <OffersModeration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StatsOverview = () => {
  const { data: stats, isLoading } = useAdminSkillSwapStats();

  if (isLoading || !stats) return <div className="animate-pulse flex space-x-4">Loading stats...</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Active Offers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalOffers}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sessions (This Week)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSessionsThisWeek}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completionRate}%</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.openReports}</div>
        </CardContent>
      </Card>
    </div>
  );
};

const ReportsQueue = () => {
  const [statusFilter, setStatusFilter] = useState('open');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminSkillSwapReports(page, 20, statusFilter);
  const resolveMutation = useAdminResolveReport();
  
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [resolutionStatus, setResolutionStatus] = useState('resolved');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [trustFlag, setTrustFlag] = useState('none');

  const handleResolve = async () => {
    if (!selectedReport) return;
    await resolveMutation.mutateAsync({
      id: selectedReport._id,
      status: resolutionStatus,
      resolutionNotes,
      trustFlag: trustFlag !== 'none' ? trustFlag : undefined,
      targetUserId: selectedReport.targetType === 'user' ? selectedReport.targetId?._id : undefined
    });
    setSelectedReport(null);
  };

  if (isLoading) return <div>Loading reports...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Reports Queue</CardTitle>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Target Type</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.reports?.map((report: any) => (
              <TableRow key={report._id}>
                <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{report.reportedBy?.name || 'Unknown'}</TableCell>
                <TableCell className="capitalize">{report.targetType}</TableCell>
                <TableCell>{report.reason}</TableCell>
                <TableCell>
                  <Badge variant={report.status === 'open' ? 'destructive' : 'secondary'}>
                    {report.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {data?.reports?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">No reports found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve Report</DialogTitle>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4">
                <div>
                  <strong>Reason:</strong> {selectedReport.reason}
                </div>
                <div>
                  <strong>Description:</strong>
                  <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Update Status</Label>
                  <Select value={resolutionStatus} onValueChange={setResolutionStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resolved">Resolved (Action Taken)</SelectItem>
                      <SelectItem value="dismissed">Dismissed (No Action)</SelectItem>
                      <SelectItem value="reviewing">Under Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedReport.targetType === 'user' && (
                  <div className="space-y-2">
                    <Label>User Trust Flag</Label>
                    <Select value={trustFlag} onValueChange={setTrustFlag}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Flag (Clear)</SelectItem>
                        <SelectItem value="warned">Warned</SelectItem>
                        <SelectItem value="restricted">Restricted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Resolution Notes (Internal)</Label>
                  <Input 
                    value={resolutionNotes} 
                    onChange={e => setResolutionNotes(e.target.value)} 
                    placeholder="E.g., Warned user and removed offer"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedReport(null)}>Cancel</Button>
              <Button onClick={handleResolve} disabled={resolveMutation.isPending}>
                Save Resolution
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </CardContent>
    </Card>
  );
};

const OffersModeration = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminSkillSwapOffers(page, 20, '', search);
  const moderateMutation = useAdminModerateOffer();

  const handleModerate = async (id: string, action: 'deactivate' | 'reinstate') => {
    const reason = prompt(`Reason to ${action} offer:`);
    if (reason) {
      await moderateMutation.mutateAsync({ id, action, reason });
    }
  };

  if (isLoading) return <div>Loading offers...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skill Offers</CardTitle>
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input type="text" placeholder="Search by skill name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Skill</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Reports</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.offers?.map((offer: any) => (
              <TableRow key={offer._id}>
                <TableCell className="font-medium">{offer.skillName}</TableCell>
                <TableCell>
                  {offer.user?.name}
                  {offer.user?.skillSwapTrustFlag !== 'none' && (
                    <Badge variant="destructive" className="ml-2 text-[10px]">
                      {offer.user?.skillSwapTrustFlag}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {offer.reportCount > 0 ? (
                    <Badge variant="destructive">{offer.reportCount}</Badge>
                  ) : '0'}
                </TableCell>
                <TableCell>
                  <Badge variant={offer.status === 'active' ? 'default' : 'secondary'}>
                    {offer.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {offer.status === 'active' ? (
                    <Button variant="destructive" size="sm" onClick={() => handleModerate(offer._id, 'deactivate')}>
                      Deactivate
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleModerate(offer._id, 'reinstate')}>
                      Reinstate
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
