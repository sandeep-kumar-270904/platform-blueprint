import React, { useState } from 'react';
import { useScholarshipCircles } from '../../hooks/useScholarshipCircles';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Users, Target, Plus, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ScholarshipCircles() {
  const { getCircles, createCircle, joinCircle, getCircleDetails } = useScholarshipCircles();
  const [activeCircleId, setActiveCircleId] = useState<string | undefined>();
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleGoal, setNewCircleGoal] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const circles = getCircles.data || [];
  
  // Set active circle initially if none selected
  React.useEffect(() => {
    if (circles.length > 0 && !activeCircleId) {
      setActiveCircleId(circles[0]._id);
    }
  }, [circles, activeCircleId]);

  const { data: circleDetailsData, isLoading: detailsLoading } = getCircleDetails(activeCircleId);

  const handleCreate = async () => {
    if (!newCircleName.trim()) return;
    try {
      await createCircle.mutateAsync({ name: newCircleName, sharedGoal: newCircleGoal });
      setNewCircleName('');
      setNewCircleGoal('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    try {
      await joinCircle.mutateAsync(inviteCode);
      setInviteCode('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Circles</CardTitle>
              <CardDescription>Small accountability groups</CardDescription>
            </CardHeader>
            <CardContent>
              {circles.length === 0 ? (
                <p className="text-muted-foreground text-sm">You are not in any circles yet.</p>
              ) : (
                <div className="space-y-2">
                  {circles.map(circle => (
                    <Button 
                      key={circle._id}
                      variant={activeCircleId === circle._id ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setActiveCircleId(circle._id)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {circle.name}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="join">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="join">Join</TabsTrigger>
              <TabsTrigger value="create">Create</TabsTrigger>
            </TabsList>
            <TabsContent value="join">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Input 
                      placeholder="Enter Invite Code"
                      value={inviteCode}
                      onChange={e => setInviteCode(e.target.value.toUpperCase())}
                      maxLength={6}
                    />
                    <Button className="w-full" onClick={handleJoin} disabled={joinCircle.isPending}>
                      Join Circle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="create">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Input 
                      placeholder="Circle Name" 
                      value={newCircleName}
                      onChange={e => setNewCircleName(e.target.value)}
                    />
                    <Input 
                      placeholder="Shared Goal (optional)" 
                      value={newCircleGoal}
                      onChange={e => setNewCircleGoal(e.target.value)}
                    />
                    <Button className="w-full" onClick={handleCreate} disabled={createCircle.isPending}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Circle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="md:col-span-2">
          {activeCircleId && circleDetailsData ? (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{circleDetailsData.circle.name}</CardTitle>
                      {circleDetailsData.circle.sharedGoal && (
                        <CardDescription className="flex items-center mt-2 text-primary">
                          <Target className="w-4 h-4 mr-1" />
                          Goal: {circleDetailsData.circle.sharedGoal}
                        </CardDescription>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Invite Code</p>
                      <code className="bg-muted px-2 py-1 rounded text-lg font-mono">
                        {circleDetailsData.circle.inviteCode}
                      </code>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-primary" />
                        <h4 className="font-medium">Members</h4>
                      </div>
                      <p className="text-2xl font-bold">{circleDetailsData.circle.memberIds.length} <span className="text-sm font-normal text-muted-foreground">/ 6 max</span></p>
                    </div>
                    
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h4 className="font-medium">Active Members</h4>
                      </div>
                      <p className="text-2xl font-bold">{circleDetailsData.aggregate.membersWithAtLeastOneStarted} <span className="text-sm font-normal text-muted-foreground">started apps</span></p>
                    </div>

                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        <h4 className="font-medium">Submitted</h4>
                      </div>
                      <p className="text-2xl font-bold">{circleDetailsData.aggregate.totalApplicationsSubmitted} <span className="text-sm font-normal text-muted-foreground">total</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Shared Scholarship Radar
                  </CardTitle>
                  <CardDescription>
                    Scholarships that members have added for the group to track.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {circleDetailsData.circle.sharedScholarships.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No scholarships shared yet. When viewing a scholarship, you can add it to your circle's radar.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {circleDetailsData.circle.sharedScholarships.map(s => (
                        <div key={s.scholarshipId._id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50">
                          <div>
                            <Link to={`/scholarships/${s.scholarshipId._id}`} className="font-medium hover:underline">
                              {s.scholarshipId.title}
                            </Link>
                            <p className="text-sm text-muted-foreground">{s.scholarshipId.provider}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              Due: {new Date(s.scholarshipId.applicationDeadline).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center text-muted-foreground">
                {detailsLoading ? 'Loading circle details...' : 'Select or create a circle to view progress.'}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
