import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Link as LinkIcon, UserPlus, Clock, CheckCircle2, XCircle, Wallet, Copy, Gift } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export const ReferralsManager = () => {
  const [loading, setLoading] = useState(true);
  const [jobData, setJobData] = useState<{sent: any[], received: any[]}>({ sent: [], received: [] });
  const [platformData, setPlatformData] = useState<{referralCode: string, walletCredit: number, referredUsersCount: number} | null>(null);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        
        // Fetch Job Referrals
        const jobRes = await fetch(`${API_URL}/api/referrals/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (jobRes.ok) {
          setJobData(await jobRes.json());
        }

        // Fetch Platform Referrals & Wallet
        const platformRes = await fetch(`${API_URL}/api/platform-referrals/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (platformRes.ok) {
          setPlatformData(await platformRes.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApplyCode = async () => {
    if (!referralCodeInput) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/api/platform-referrals/apply`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: referralCodeInput })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({ title: "Success", description: data.message });
        setPlatformData(prev => prev ? { ...prev, walletCredit: data.walletCredit } : null);
        setReferralCodeInput('');
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    }
  };

  const copyCode = () => {
    if (platformData?.referralCode) {
      navigator.clipboard.writeText(platformData.referralCode);
      toast({ title: "Copied!", description: "Referral code copied to clipboard." });
    }
  };

  if (loading) {
    return <Card><CardContent className="p-8 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin mb-2"/>Loading referrals...</CardContent></Card>;
  }

  const renderStatus = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'applied': return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50"><LinkIcon className="w-3 h-3 mr-1" /> Applied</Badge>;
      case 'hired': return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50"><CheckCircle2 className="w-3 h-3 mr-1" /> Hired</Badge>;
      case 'rejected': return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Wallet & Platform Referrals Overview */}
      {platformData && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" /> Wallet Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">${platformData.walletCredit}</div>
              <p className="text-sm text-muted-foreground mt-1">Use credits to book mentor sessions.</p>
              
              <div className="mt-4 pt-4 border-t flex gap-2">
                <Input 
                  placeholder="Have a referral code?" 
                  value={referralCodeInput}
                  onChange={(e) => setReferralCodeInput(e.target.value)}
                />
                <Button onClick={handleApplyCode}>Apply</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="h-5 w-5 text-orange-500" /> Refer & Earn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Invite friends and both get <strong>$10 in wallet credits</strong> when they join!
              </p>
              <div className="flex flex-col gap-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase">Your Referral Code</div>
                <div className="flex gap-2">
                  <div className="bg-muted px-4 py-2 rounded-md font-mono font-bold tracking-widest text-lg flex-1 text-center border">
                    {platformData.referralCode}
                  </div>
                  <Button variant="outline" size="icon" onClick={copyCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 text-sm font-medium flex items-center justify-between">
                <span>Total Friends Referred:</span>
                <Badge variant="secondary">{platformData.referredUsersCount}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Job Referrals tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Job Referrals Tracker
          </CardTitle>
          <CardDescription>Track job referrals you've sent and received.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sent">
            <TabsList className="mb-4">
              <TabsTrigger value="sent">Sent ({jobData.sent.length})</TabsTrigger>
              <TabsTrigger value="received">Received ({jobData.received.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sent" className="space-y-4">
              {jobData.sent.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
                  You haven't referred anyone to a job yet.
                </div>
              ) : (
                jobData.sent.map((ref, idx) => (
                  <div key={idx} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold">{ref.job?.title}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Building2 className="h-3.5 w-3.5" /> {ref.job?.company}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">Referred</p>
                        <p className="text-sm">{ref.referredUser?.full_name || ref.referredEmail}</p>
                      </div>
                      {ref.referredUser?.avatar_url && (
                         <Avatar className="h-8 w-8">
                           <AvatarImage src={ref.referredUser.avatar_url.startsWith('http') ? ref.referredUser.avatar_url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${ref.referredUser.avatar_url}`} />
                         </Avatar>
                      )}
                    </div>
                    <div className="min-w-[100px] text-right">
                      {renderStatus(ref.status)}
                      <p className="text-xs text-muted-foreground mt-1">{new Date(ref.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="received" className="space-y-4">
              {jobData.received.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
                  You haven't received any job referrals yet.
                </div>
              ) : (
                jobData.received.map((ref, idx) => (
                  <div key={idx} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold">{ref.job?.title}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Building2 className="h-3.5 w-3.5" /> {ref.job?.company}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">Referred by</p>
                        <p className="text-sm">{ref.referrer?.full_name || ref.referrer?.username}</p>
                      </div>
                      {ref.referrer?.avatar_url && (
                         <Avatar className="h-8 w-8">
                           <AvatarImage src={ref.referrer.avatar_url.startsWith('http') ? ref.referrer.avatar_url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${ref.referrer.avatar_url}`} />
                         </Avatar>
                      )}
                    </div>
                    <div className="min-w-[100px] text-right">
                      {renderStatus(ref.status)}
                      <p className="text-xs text-muted-foreground mt-1">{new Date(ref.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
