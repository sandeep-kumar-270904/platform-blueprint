import { useState } from "react";
import { Hostel, useOwnerHostels, useDeleteHostel, useToggleAvailability } from "@/hooks/useHostels";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  MapPin, 
  Pencil, 
  Trash2, 
  EyeOff, 
  Eye,
  ShieldAlert,
  ShieldCheck,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface MyHostelsListProps {
  onEdit: (hostel: Hostel) => void;
}

export const MyHostelsList = ({ onEdit }: MyHostelsListProps) => {
  const { data: hostels, isLoading } = useOwnerHostels();
  const deleteMutation = useDeleteHostel();
  const toggleMutation = useToggleAvailability();
  const { toast } = useToast();

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null
  });

  const handleDelete = async () => {
    if (deleteDialog.id) {
      try {
        await deleteMutation.mutateAsync(deleteDialog.id);
        toast({ title: "Listing deleted" });
      } catch (err: any) {
        toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
      }
    }
    setDeleteDialog({ open: false, id: null });
  };

  const handleToggle = async (hostel: Hostel) => {
    try {
      await toggleMutation.mutateAsync({ id: hostel._id, isFull: !hostel.isFull });
      toast({ title: hostel.isFull ? "Marked as Available" : "Marked as Full" });
    } catch (err: any) {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!hostels || hostels.length === 0) {
    return (
      <div className="text-center py-24 bg-secondary/20 rounded-xl border border-border/50">
        <Building2 className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-2">You haven't listed any hostels</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Add your first hostel to start receiving inquiries from students.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
        {hostels.map((hostel) => (
          <Card key={hostel._id} className={`overflow-hidden flex flex-col ${hostel.isFull ? 'opacity-80 grayscale-[0.5]' : ''}`}>
            <div className="relative h-48 bg-muted">
              {hostel.photos && hostel.photos.length > 0 ? (
                <img
                  src={`http://localhost:5000${hostel.photos[0]}`}
                  alt={hostel.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary">
                  <Building2 className="h-12 w-12 text-muted-foreground opacity-20" />
                </div>
              )}
              <div className="absolute top-2 left-2 flex flex-col gap-2">
                {hostel.verificationStatus === "verified" ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 shadow-sm">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                ) : hostel.verificationStatus === "pending" ? (
                  <Badge variant="secondary" className="bg-amber-500/90 hover:bg-amber-500 text-white shadow-sm">
                    <ShieldAlert className="w-3 h-3 mr-1" /> Pending Verification
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="shadow-sm">
                    Unverified
                  </Badge>
                )}
                {hostel.isFull && (
                  <Badge variant="destructive" className="shadow-sm uppercase font-bold tracking-wider">
                    Full
                  </Badge>
                )}
              </div>
            </div>
            
            <CardHeader className="p-4 pb-2">
              <CardTitle className="line-clamp-1">{hostel.name}</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="line-clamp-1">{hostel.address}</span>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 pt-0 flex-grow">
              <div className="flex justify-between items-center mt-2">
                <p className="font-semibold text-lg text-primary">₹{hostel.pricing.toLocaleString()}</p>
                <Badge variant="outline">{hostel.type}</Badge>
              </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex flex-wrap gap-2 border-t mt-auto">
              <div className="w-full grid grid-cols-2 gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => onEdit(hostel)}>
                  <Pencil className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleToggle(hostel)}
                  className={hostel.isFull ? "text-emerald-600 hover:text-emerald-700" : "text-amber-600 hover:text-amber-700"}
                  disabled={toggleMutation.isPending}
                >
                  {hostel.isFull ? (
                    <><Eye className="w-4 h-4 mr-2" /> Mark Available</>
                  ) : (
                    <><EyeOff className="w-4 h-4 mr-2" /> Mark Full</>
                  )}
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="col-span-2"
                  onClick={() => setDeleteDialog({ open: true, id: hostel._id })}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Listing
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, id: deleteDialog.id })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your hostel listing and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
