import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Link as LinkIcon, UserPlus, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const ReferralsManager = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{sent: any[], received: any[]}>({ sent: [], received: [] });

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/referrals/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const d = await res.json();
          setData(d);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
  }, []);

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
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Referral Network
        </CardTitle>
        <CardDescription>Track referrals you've sent and received.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sent">
          <TabsList className="mb-4">
            <TabsTrigger value="sent">Sent ({data.sent.length})</TabsTrigger>
            <TabsTrigger value="received">Received ({data.received.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sent" className="space-y-4">
            {data.sent.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
                You haven't referred anyone yet.
              </div>
            ) : (
              data.sent.map((ref, idx) => (
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
            {data.received.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
                You haven't received any referrals yet.
              </div>
            ) : (
              data.received.map((ref, idx) => (
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
  );
};
