import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { joinLiveSession } from "@/hooks/useQuizHub";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const LiveQuizJoin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to join live sessions");
      return;
    }
    if (!joinCode || joinCode.length < 6) {
      toast.error("Please enter a valid 6-character join code");
      return;
    }

    setLoading(true);
    try {
      const sessionInfo = await joinLiveSession(joinCode);
      // If successful, navigate to the play screen which will connect the socket
      navigate(`/live/${sessionInfo._id}/play`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <CardHeader className="text-center pt-8">
            <CardTitle className="text-3xl font-bold">Join Live Quiz</CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleJoin} className="space-y-6">
              <div className="space-y-2">
                <Input 
                  placeholder="Enter 6-digit Join Code" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="text-center text-3xl font-mono h-16 tracking-[0.25em] uppercase font-bold"
                  maxLength={6}
                />
              </div>
              
              <Button type="submit" size="lg" className="w-full h-14 text-lg bg-indigo-600 hover:bg-indigo-700" disabled={loading || joinCode.length < 6}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Join Game"}
                {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveQuizJoin;
