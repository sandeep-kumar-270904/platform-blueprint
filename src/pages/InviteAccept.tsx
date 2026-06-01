import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { redeemInvite } from "@/hooks/useGroupInvites";
import { Loader2, Users, CheckCircle2, AlertTriangle } from "lucide-react";

const InviteAccept = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [meta, setMeta] = useState<any>(null);
  const [group, setGroup] = useState<any>(null);
  const [state, setState] = useState<"loading" | "ready" | "invalid" | "redeeming" | "done">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data } = await supabase.from("study_group_invites").select("*").eq("token", token).maybeSingle();
      if (!data) { setState("invalid"); setError("Invite not found"); return; }
      if (data.revoked) { setState("invalid"); setError("This invite has been revoked"); return; }
      if (new Date(data.expires_at).getTime() < Date.now()) { setState("invalid"); setError("This invite has expired"); return; }
      if (data.uses >= data.max_uses) { setState("invalid"); setError("This invite has been fully used"); return; }
      setMeta(data);
      const { data: g } = await supabase.from("study_groups").select("*").eq("id", data.group_id).maybeSingle();
      setGroup(g);
      setState("ready");
    })();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    if (!user) { navigate(`/auth?redirect=/invite/${token}`); return; }
    setState("redeeming");
    const gid = await redeemInvite(token);
    if (gid) { setState("done"); setTimeout(() => navigate("/study-groups"), 1200); }
    else setState("ready");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-accent/5">
      <Header />
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Group Invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {state === "loading" || authLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : state === "invalid" ? (
              <div className="text-center py-4">
                <AlertTriangle className="h-10 w-10 mx-auto text-destructive mb-2" />
                <p className="font-semibold">{error}</p>
                <Link to="/study-groups"><Button variant="outline" className="mt-4">Browse groups</Button></Link>
              </div>
            ) : state === "done" ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 mb-2" />
                <p className="font-semibold">You joined {group?.name}!</p>
                <p className="text-sm text-muted-foreground">Taking you to the group...</p>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <h3 className="text-lg font-bold">{group?.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{group?.description}</p>
                  <p className="text-xs text-muted-foreground mt-3">
                    You'll join as <span className="font-semibold">{meta?.role}</span> ·{" "}
                    {group?.member_count}/{group?.member_limit} members
                  </p>
                </div>
                <Button className="w-full" onClick={handleAccept} disabled={state === "redeeming"}>
                  {state === "redeeming" && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {user ? "Join Group" : "Sign in to Join"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InviteAccept;
