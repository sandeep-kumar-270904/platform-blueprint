import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export default function VideoRoomPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'booking'; // 'booking' or 'ama'
  
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [safetyAccepted, setSafetyAccepted] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const authToken = localStorage.getItem('token');
        if (!authToken) throw new Error("Not authenticated");

        const endpoint = type === 'ama' 
          ? `/api/video/join/ama/${id}` 
          : `/api/video/join/booking/${id}`;

        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${endpoint}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Failed to join room");
        }

        const data = await res.json();
        setRoomUrl(data.url);
        setToken(data.token);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAccess();
  }, [id, type]);

  // Using an iframe approach for Daily.co Prebuilt
  // Daily.co allows appending ?t=TOKEN to the URL for secure access
  const fullRoomUrl = roomUrl && token ? `${roomUrl}?t=${token}` : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex flex-col">
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p>Connecting to secure room...</p>
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center p-4">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {fullRoomUrl && !error && !loading && !safetyAccepted && (
          <div className="flex-1 flex items-center justify-center p-4 bg-muted/10">
            <div className="max-w-md bg-card border rounded-lg p-6 shadow-sm text-center space-y-6">
              <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Trust & Safety Reminder</h2>
                <p className="text-muted-foreground text-sm">
                  Please keep all communications professional and respectful. 
                  Do not share sensitive personal information or financial details. 
                  Remember that violations of our community guidelines may result in permanent bans.
                </p>
              </div>
              <Button className="w-full" onClick={() => setSafetyAccepted(true)}>
                I Understand, Join Session
              </Button>
            </div>
          </div>
        )}

        {fullRoomUrl && !error && !loading && safetyAccepted && (
          <div className="flex-1 w-full relative">
            <iframe
              ref={iframeRef}
              className="absolute inset-0 w-full h-full border-none"
              src={fullRoomUrl}
              allow="camera; microphone; autoplay; display-capture"
            />
          </div>
        )}
      </div>
    </div>
  );
}
