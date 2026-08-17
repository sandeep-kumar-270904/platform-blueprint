import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export const AdminSalaryModeration = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/salary/admin/queue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (err) {
      console.error("Failed to fetch salary queue", err);
      toast.error("Failed to load queue");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, status: string) => {
    setProcessingId(id);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/salary/admin/queue/${id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status, adminNote: adminNotes[id] })
      });
      
      if (res.ok) {
        toast.success(`Entry marked as ${status}`);
        setEntries(prev => prev.filter(e => e._id !== id));
      } else {
        throw new Error("Update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update entry");
    } finally {
      setProcessingId(null);
    }
  };

  const handleNoteChange = (id: string, val: string) => {
    setAdminNotes(prev => ({ ...prev, [id]: val }));
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Salary Moderation</h2>
          <p className="text-muted-foreground">Review pending and flagged salary entries before they appear in College Insights.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Moderation Queue ({entries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No entries pending review.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User / College</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>CTC Band</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Admin Note</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry._id}>
                      <TableCell>
                        <div className="font-medium">{entry.userId?.name || entry.userId?.full_name}</div>
                        <div className="text-xs text-muted-foreground">{entry.userId?.email}</div>
                        <div className="text-xs text-muted-foreground mt-1">College: {entry.collegeId?.name || "Unknown"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">Role: {entry.currentRole}</div>
                        <div className="text-sm">Company: {entry.currentCompany || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.branch} • {entry.graduationYear} • {entry.yearsOfExperience} YOE
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.ctcBand}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.status === 'flagged' ? 'destructive' : 'secondary'}>
                          {entry.status === 'flagged' && <AlertTriangle className="mr-1 h-3 w-3" />}
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input 
                          placeholder="Note (optional)" 
                          value={adminNotes[entry._id] || ""}
                          onChange={(e) => handleNoteChange(entry._id, e.target.value)}
                          className="h-8 text-xs w-32"
                        />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700"
                          onClick={() => handleUpdate(entry._id, 'approved')}
                          disabled={processingId === entry._id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:text-red-700"
                          onClick={() => handleUpdate(entry._id, 'rejected')}
                          disabled={processingId === entry._id}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
