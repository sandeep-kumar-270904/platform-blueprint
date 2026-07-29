import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle,
  Trash2,
  CheckCircle,
  XCircle,
  MoreVertical,
  Flag
} from "lucide-react";
import { useHostels, Hostel } from "@/hooks/useHostels";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AdminHostelsPanel = () => {
  const queryClient = useQueryClient();
  const { data: hostels, isLoading } = useHostels({});
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean, hostel: Hostel | null }>({ open: false, hostel: null });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'verified' | 'none' }) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/hostels/${id}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update verification status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
      toast.success('Verification status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    }
  });

  const handleDelete = () => {
    // In a real app, this would hit DELETE /api/hostels/:id
    toast.success("Listing removed successfully (Mock)");
    setDeleteDialog({ open: false, hostel: null });
  };

  const pendingVerifications = hostels?.filter(h => h.verificationStatus === 'pending') || [];
  
  // Mock reports logic since we didn't add it to the backend model yet
  const getReportsCount = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash % 10 === 0 ? (hash % 3) + 1 : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link to="/admin" className="hover:text-primary">Admin Control Center</Link>
              <span>/</span>
              <span>Hostels</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              Student Hostels Moderation
            </h1>
            <p className="text-muted-foreground mt-2">Manage listings, approve verifications, and handle reports.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{hostels?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Pending Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingVerifications.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Reported Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{hostels?.filter(h => getReportsCount(h._id) > 0).length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Listings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 rounded-tl-lg">Hostel</th>
                      <th className="px-6 py-3">Type & Price</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Reports</th>
                      <th className="px-6 py-3 rounded-tr-lg text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hostels?.map((hostel: Hostel) => {
                      const reports = getReportsCount(hostel._id);
                      return (
                        <tr key={hostel._id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-6 py-4">
                            <p className="font-semibold">{hostel.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1 w-48">{hostel.address}</p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="mb-1 capitalize">{hostel.type}</Badge>
                            <p className="font-medium">₹{hostel.pricing.toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-4">
                            {hostel.verificationStatus === 'verified' ? (
                              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none">
                                <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                              </Badge>
                            ) : hostel.verificationStatus === 'pending' ? (
                              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-none">
                                <ShieldAlert className="w-3 h-3 mr-1" /> Pending
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Unverified
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {reports > 0 ? (
                              <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-none">
                                <Flag className="w-3 h-3 mr-1" /> {reports}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">None</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {hostel.verificationStatus === 'pending' && (
                                  <>
                                    <DropdownMenuItem onClick={() => verifyMutation.mutate({ id: hostel._id, status: 'verified' })}>
                                      <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" /> Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => verifyMutation.mutate({ id: hostel._id, status: 'none' })}>
                                      <XCircle className="w-4 h-4 mr-2 text-amber-500" /> Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {hostel.verificationStatus === 'verified' && (
                                  <DropdownMenuItem onClick={() => verifyMutation.mutate({ id: hostel._id, status: 'none' })}>
                                    <XCircle className="w-4 h-4 mr-2 text-amber-500" /> Revoke Verification
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => setDeleteDialog({ open: true, hostel })}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Remove Listing
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {hostels?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No hostels found.</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, hostel: deleteDialog.hostel })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the listing for "{deleteDialog.hostel?.name}"? 
              This action cannot be undone and the owner will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove Listing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
