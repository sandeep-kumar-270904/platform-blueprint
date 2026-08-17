import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Target, ArrowRight, Briefcase, Users, FileText, CheckCircle2 } from 'lucide-react';
import { JobCard } from '@/components/JobCard';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CareerPath: React.FC = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [careerGoal, setCareerGoal] = useState<any>(null);
  const [pathData, setPathData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [targetRoleId, setTargetRoleId] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const rolesRes = await fetch(`${API_URL}/api/career/roles`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (rolesRes.ok) {
        setRoles(await rolesRes.json());
      }

      const pathRes = await fetch(`${API_URL}/api/career/path`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (pathRes.ok) {
        const data = await pathRes.json();
        setCareerGoal(data.careerGoal);
        setPathData(data);
      } else {
        // No goal set
        if (user.careerGoal) {
          setCareerGoal(user.careerGoal);
          setTargetRole(user.careerGoal.targetRole || '');
          setTargetRoleId(user.careerGoal.targetRoleId || '');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/career/goal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetRole,
          targetRoleId: targetRoleId || undefined
        })
      });

      if (!res.ok) throw new Error('Failed to update goal');
      toast.success('Career goal updated successfully');
      setIsEditingGoal(false);
      fetchData(); // reload path data
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Career Path Foundation</h1>
          <p className="text-lg text-gray-500">Define your goals and get deterministic recommendations.</p>
        </div>

        {!careerGoal || isEditingGoal ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Set Your Career Goal</CardTitle>
              <CardDescription>What role are you targeting next?</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveGoal} className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Role Title</Label>
                  <Input 
                    required 
                    value={targetRole} 
                    onChange={e => setTargetRole(e.target.value)} 
                    placeholder="e.g. Frontend Engineer" 
                  />
                </div>
                {roles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Or Select a Defined Career Path (Optional)</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={targetRoleId}
                      onChange={e => {
                        setTargetRoleId(e.target.value);
                        if (e.target.value) {
                          const r = roles.find(role => role._id === e.target.value);
                          if (r) setTargetRole(r.title);
                        }
                      }}
                    >
                      <option value="">-- Custom Role --</option>
                      {roles.map(r => (
                        <option key={r._id} value={r._id}>{r.title}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-4 pt-4">
                  <Button type="submit">Save Goal</Button>
                  {careerGoal && (
                    <Button type="button" variant="ghost" onClick={() => setIsEditingGoal(false)}>Cancel</Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="h-64 flex items-center justify-center">Loading path...</div>
        ) : pathData && (
          <div className="space-y-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">Current Goal</h2>
                    <p className="text-3xl font-bold flex items-center gap-2">
                      <Target className="w-8 h-8 text-primary" />
                      {careerGoal.targetRole}
                    </p>
                    {careerGoal.targetSkills && careerGoal.targetSkills.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {careerGoal.targetSkills.map((s: string) => (
                          <Badge key={s} variant="secondary">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" onClick={() => setIsEditingGoal(true)}>Edit Goal</Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" /> Recommended Opportunities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pathData.relevantOpportunities?.length > 0 ? (
                    pathData.relevantOpportunities.map((opp: any) => (
                      <div key={opp._id} className="p-3 border rounded-lg hover:bg-gray-50 transition cursor-pointer" onClick={() => window.location.href = `/jobs/${opp._id}`}>
                        <p className="font-semibold">{opp.title}</p>
                        <p className="text-sm text-gray-500">{opp.company}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No specific opportunities matched yet.</p>
                  )}
                  <Button variant="link" asChild className="p-0 h-auto">
                    <Link textDecoration="none" to="/jobs">View all opportunities <ArrowRight className="w-4 h-4 ml-1" /></Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Recommended Alumni Mentors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pathData.relevantAlumni?.length > 0 ? (
                    pathData.relevantAlumni.map((alumni: any) => (
                      <div key={alumni._id} className="p-3 border rounded-lg flex items-center gap-3">
                        <img src={alumni.userId.avatar_url || `https://ui-avatars.com/api/?name=${alumni.userId.full_name}`} className="w-10 h-10 rounded-full" alt="avatar" />
                        <div>
                          <p className="font-semibold text-sm">{alumni.userId.full_name}</p>
                          <p className="text-xs text-gray-500">{alumni.currentRole} @ {alumni.currentCompany}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No specific alumni matched yet.</p>
                  )}
                  <Button variant="link" asChild className="p-0 h-auto">
                    <Link to="/alumni">Browse Alumni Directory <ArrowRight className="w-4 h-4 ml-1" /></Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Next Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pathData.recommendedActions?.map((action: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="mt-0.5">
                        {action.type === 'resume' ? <FileText className="w-4 h-4 text-blue-500" /> : 
                         action.type === 'apply' ? <Briefcase className="w-4 h-4 text-green-500" /> :
                         <Users className="w-4 h-4 text-purple-500" />}
                      </div>
                      <p className="text-sm font-medium">{action.title}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerPath;
