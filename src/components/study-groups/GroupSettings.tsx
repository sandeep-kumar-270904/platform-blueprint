import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, Settings, ShieldAlert, Trash2 } from 'lucide-react';
import { useStudyGroups, StudyGroupDetailType } from '@/hooks/useStudyGroups';

interface GroupSettingsProps {
  group: StudyGroupDetailType;
  onUpdate: () => void;
}

export default function GroupSettings({ group, onUpdate }: GroupSettingsProps) {
  const { updateGroup, transferOwnership, deleteGroup } = useStudyGroups();

  // Settings Form State
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [category, setCategory] = useState(group.category);
  const [privacy, setPrivacy] = useState(group.privacy);
  const [memberLimit, setMemberLimit] = useState(group.member_limit.toString());
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transfer Ownership State
  const [newOwnerId, setNewOwnerId] = useState<string>("");
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  // Delete Group State
  const [deleteConfirmationName, setDeleteConfirmationName] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeMembersCount = group.memberships.filter(m => m.status === 'active').length;
  const eligibleNewOwners = group.memberships.filter(m => m.status === 'active' && m.user._id !== group.owner_id);

  const handleSaveSettings = async () => {
    setError(null);
    const limit = parseInt(memberLimit, 10);

    if (isNaN(limit) || limit < 2) {
      setError("Member limit must be at least 2.");
      return;
    }
    
    if (limit < activeMembersCount) {
      setError(`Cannot lower member limit below the current active member count (${activeMembersCount}).`);
      return;
    }

    try {
      setIsSaving(true);
      await updateGroup(group._id, {
        name,
        description,
        category,
        privacy,
        member_limit: limit
      });
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to update group settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!newOwnerId) return;
    try {
      setIsTransferring(true);
      await transferOwnership(group._id, newOwnerId);
      setIsTransferDialogOpen(false);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to transfer ownership.");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (deleteConfirmationName !== group.name) return;
    try {
      setIsDeleting(true);
      await deleteGroup(group._id);
      // Navigation is handled by the hook (or we could navigate here if the hook doesn't)
      window.location.href = '/placement/study-groups'; // Force navigation
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to delete group.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5"/> Group Settings</CardTitle>
          <CardDescription>Update your group's profile and preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Group Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Focus Area</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Data Structures">Data Structures & Algorithms</SelectItem>
                  <SelectItem value="System Design">System Design</SelectItem>
                  <SelectItem value="Frontend">Frontend (React/Web)</SelectItem>
                  <SelectItem value="Backend">Backend (Node/Java/etc)</SelectItem>
                  <SelectItem value="Behavioral">Behavioral / HR</SelectItem>
                  <SelectItem value="General">General Prep</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Member Limit</Label>
              <Input 
                type="number" 
                value={memberLimit} 
                onChange={e => setMemberLimit(e.target.value)} 
                min={activeMembersCount}
              />
              <p className="text-xs text-muted-foreground">Current active members: {activeMembersCount}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Privacy</Label>
            <RadioGroup value={privacy} onValueChange={setPrivacy} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="font-normal">Public (Anyone can join)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="font-normal">Private (Approval required)</Label>
              </div>
            </RadioGroup>
          </div>

          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50/10">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2"><ShieldAlert className="w-5 h-5"/> Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for your group.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Transfer Ownership */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-red-100 rounded-lg bg-background">
            <div>
              <h4 className="font-semibold text-foreground">Transfer Ownership</h4>
              <p className="text-sm text-muted-foreground">Transfer full administrative rights to another member. You will become a regular member.</p>
            </div>
            
            <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 whitespace-nowrap">Transfer</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Transfer Ownership</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <p className="text-sm text-muted-foreground">Select an active member to transfer ownership to. This action cannot be undone by you.</p>
                  
                  {eligibleNewOwners.length === 0 ? (
                    <Alert><AlertDescription>There are no other active members in this group to transfer ownership to.</AlertDescription></Alert>
                  ) : (
                    <Select value={newOwnerId} onValueChange={setNewOwnerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a member..." />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleNewOwners.map(m => (
                          <SelectItem key={m.user._id} value={m.user._id}>{m.user.username}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleTransferOwnership} disabled={!newOwnerId || isTransferring}>
                    {isTransferring ? "Transferring..." : "Transfer Ownership"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Delete Group */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-red-100 rounded-lg bg-background">
            <div>
              <h4 className="font-semibold text-foreground">Delete this group</h4>
              <p className="text-sm text-muted-foreground">Once you delete a group, there is no going back. Please be certain.</p>
            </div>
            
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="whitespace-nowrap"><Trash2 className="w-4 h-4 mr-2"/> Delete Group</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-red-600">Are you absolutely sure?</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <p className="text-sm text-muted-foreground">This action cannot be undone. This will permanently delete the <strong>{group.name}</strong> group, messages, sessions, and remove all member associations.</p>
                  
                  <div className="space-y-2">
                    <Label>Please type <span className="font-bold select-none">{group.name}</span> to confirm.</Label>
                    <Input 
                      value={deleteConfirmationName} 
                      onChange={e => setDeleteConfirmationName(e.target.value)}
                      placeholder={group.name}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setDeleteConfirmationName(""); }}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDeleteGroup} disabled={deleteConfirmationName !== group.name || isDeleting}>
                    {isDeleting ? "Deleting..." : "I understand the consequences, delete this group"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
