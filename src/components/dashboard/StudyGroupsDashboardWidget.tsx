import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar, ArrowRight, Activity, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStudyGroups } from '@/hooks/useStudyGroups';
import api from '@/lib/api';

export const StudyGroupsDashboardWidget = () => {
  const { myGroups, loadingMyGroups } = useStudyGroups();
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUpcomingSessions = async () => {
      try {
        const res = await api.get('/study-groups/sessions/upcoming');
        setUpcomingSessions(res.data);
      } catch (error) {
        console.error('Error fetching upcoming sessions:', error);
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchUpcomingSessions();
  }, []);

  if (loadingMyGroups || loadingSessions) {
    return (
      <Card className="col-span-full border border-slate-200 shadow-sm">
        <CardContent className="p-8 flex justify-center items-center">
          <div className="animate-pulse flex items-center space-x-2 text-muted-foreground">
            <Users className="w-5 h-5" />
            <span>Loading Study Groups...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Zero-State Discovery Prompt
  if (myGroups.length === 0) {
    return (
      <Card className="col-span-full border-dashed border-2 border-primary/20 bg-primary/5">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Find Your Perfect Study Group</h3>
            <p className="text-muted-foreground max-w-md mx-auto mt-2">
              Collaborate, share resources, and practice mock sessions with peers who share your goals.
            </p>
          </div>
          <Button onClick={() => navigate('/placement/study-groups?tab=discover')} className="gap-2 mt-4">
            <Search className="w-4 h-4" /> Discover Groups
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 col-span-full">
      {/* My Study Groups */}
      <Card className="border border-slate-200 shadow-sm flex flex-col">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" /> My Study Groups
            </CardTitle>
            <p className="text-sm text-muted-foreground">You are in {myGroups.length} active groups.</p>
          </div>
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex text-indigo-500 hover:text-indigo-600">
            <Link to="/placement/study-groups?tab=my-groups">View All <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col">
          <div className="divide-y max-h-[250px] overflow-y-auto">
            {myGroups.slice(0, 5).map(group => {
              // Mock active indicator: if last_activity is within the last 24 hours
              const isActive = group.last_activity ? (new Date().getTime() - new Date(group.last_activity).getTime()) / (1000 * 3600 * 24) <= 1 : false;
              
              return (
                <div 
                  key={group._id} 
                  onClick={() => navigate(`/placement/study-groups?groupId=${group._id}`)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex flex-col overflow-hidden pr-4">
                    <span className="font-semibold text-foreground truncate">{group.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{group.category}</span>
                  </div>
                  {isActive && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                      </span>
                      <span className="text-xs font-medium text-green-600">Active</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="p-3 border-t bg-slate-50 mt-auto sm:hidden">
            <Button variant="outline" className="w-full text-xs" asChild>
              <Link to="/placement/study-groups?tab=my-groups">View All Groups</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Sessions */}
      <Card className="border border-slate-200 shadow-sm flex flex-col">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" /> Upcoming Sessions
            </CardTitle>
            <p className="text-sm text-muted-foreground">Sessions across your groups.</p>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col">
          <div className="divide-y max-h-[250px] overflow-y-auto">
            {upcomingSessions.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <Calendar className="w-8 h-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No upcoming sessions scheduled.</p>
              </div>
            ) : (
              upcomingSessions.slice(0, 5).map(session => {
                const isLive = new Date(session.date).getTime() <= new Date().getTime();
                return (
                  <div 
                    key={session._id} 
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-semibold text-foreground truncate">{session.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 
                        {' • '}{session.group_name}
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => navigate(`/placement/study-groups?groupId=${session.group_id}&tab=sessions`)}
                      variant={isLive ? "default" : "outline"}
                      className={isLive ? "bg-orange-500 hover:bg-orange-600 shrink-0" : "shrink-0"}
                    >
                      {isLive ? (
                        <><Activity className="w-3 h-3 mr-1.5 animate-pulse" /> Join Live</>
                      ) : (
                        "View Details"
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
