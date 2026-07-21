import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Download, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AccountSettings() {
  const { user } = useAuth();
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settings/request-data-export`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-activity.json';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Data export downloaded successfully");
    } catch (e) {
      toast.error("Failed to export data");
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteEmail !== user?.email) {
      toast.error("Email does not match");
      return;
    }
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settings/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: deleteEmail })
      });
      if (!res.ok) throw new Error("Deletion failed");
      toast.success("Account anonymized successfully");
      setTimeout(() => window.location.href = "/", 1000);
    } catch (e) {
      toast.error("Failed to delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>Download a copy of your community posts, comments, and likes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExportData} disabled={exportLoading}>
                {exportLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                Download My Activity
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Danger Zone</CardTitle>
              <CardDescription>
                Permanently delete your account. Your community posts and comments will be retained but anonymized as "Deleted User".
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showDeleteConfirm ? (
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>Delete Account</Button>
              ) : (
                <div className="space-y-4 p-4 border rounded-lg bg-red-50/50">
                  <p className="text-sm font-medium">Please type <strong>{user?.email}</strong> to confirm.</p>
                  <Input 
                    value={deleteEmail} 
                    onChange={e => setDeleteEmail(e.target.value)} 
                    placeholder="Enter your email"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteLoading || deleteEmail !== user?.email}>
                      {deleteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Confirm Deletion
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
