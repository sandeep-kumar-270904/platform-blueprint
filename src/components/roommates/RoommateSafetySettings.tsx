import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shield, Unlock, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { RoommateVerificationPanel } from '@/components/roommates/RoommateVerificationPanel';
import { VerificationStatus } from '@/components/roommates/RoommateVerificationBadge';

export const RoommateSafetySettings: React.FC = () => {
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('none');
  const { toast } = useToast();

  const fetchBlockedUsers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/roommates/safety/blocks`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const handleUnblock = async (targetUserId: string, targetUserName: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/roommates/safety/unblock`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ targetUserId })
      });
      if (res.ok) {
        toast({ title: "User Unblocked", description: `${targetUserName} has been unblocked.` });
        setBlockedUsers(prev => prev.filter(u => u._id !== targetUserId));
      } else {
        throw new Error('Failed to unblock');
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/roommates/safety/export`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to generate export');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roommate_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Success", description: "Your data has been exported." });
    } catch (err: any) {
      toast({ title: "Error", description: "Something went wrong generating your export - try again.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Safety & Privacy</h2>
      </div>

      <RoommateVerificationPanel currentStatus={verificationStatus} onStatusChange={setVerificationStatus} />
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Blocked Users</CardTitle>
          <CardDescription>
            Users you have blocked cannot view your profile, send you messages, or send connection requests. Unblocking a user will allow them to discover you again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">Loading...</div>
          ) : blockedUsers.length === 0 ? (
            <EmptyState 
              icon={Shield} 
              title="No blocked users" 
              description="You have not blocked anyone." 
            />
          ) : (
            <ul className="divide-y border rounded-md">
              {blockedUsers.map(user => (
                <li key={user._id} className="flex items-center justify-between p-4 bg-background">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.profilePicture || user.avatar_url} />
                      <AvatarFallback>{user.name?.charAt(0) || user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name || user.full_name}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleUnblock(user._id, user.name || user.full_name)}>
                    <Unlock className="w-4 h-4 mr-2" /> Unblock
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Data Portability</CardTitle>
          <CardDescription>
            Download a copy of your Roommate Finder data, including your profile, connections, groups, and agreements. 
            Chat messages are not included in this export per our privacy policy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExportData} disabled={exporting}>
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {exporting ? 'Generating Export...' : 'Download My Data'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
