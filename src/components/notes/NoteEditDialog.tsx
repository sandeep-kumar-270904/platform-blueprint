import { useState } from "react";

import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  "Lecture Notes", "Textbook", "Assignment", "Lab Manual",
  "Previous Year Paper", "Reference Material", "Handwritten Notes",
  "Presentation", "Research Paper", "Tutorial", "Other"
];

const BRANCHES = [
  { value: "CSE", label: "Computer Science & Engineering" },
  { value: "ECE", label: "Electronics & Communication" },
  { value: "ME", label: "Mechanical Engineering" },
  { value: "CE", label: "Civil Engineering" },
  { value: "EE", label: "Electrical Engineering" },
  { value: "IT", label: "Information Technology" },
  { value: "BIO", label: "Biotechnology" },
  { value: "CHE", label: "Chemical Engineering" },
  { value: "OTHER", label: "Other" },
];

interface NoteEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: any;
  onSuccess: () => void;
}

export const NoteEditDialog = ({ open, onOpenChange, note, onSuccess }: NoteEditDialogProps) => {
  const [title, setTitle] = useState(note?.title || "");
  const [subject, setSubject] = useState(note?.subject || "");
  const [description, setDescription] = useState(note?.description || "");
  const [category, setCategory] = useState(note?.category || "");
  const [branch, setBranch] = useState(note?.branch || "");
  const [semester, setSemester] = useState(note?.semester?.toString() || "");
  const [university, setUniversity] = useState(note?.university || "");
  const [year, setYear] = useState(note?.year?.toString() || "");
  const [tags, setTags] = useState(note?.tags?.join(", ") || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !subject.trim()) {
      toast.error("Title and subject are required");
      return;
    }
    setSaving(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim(),
          description: description.trim() || null,
          category: category || null,
          branch: branch || null,
          semester: semester ? parseInt(semester) : null,
          university: university.trim() || null,
          year: year ? parseInt(year) : null,
          tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update note");
      }
      
      toast.success("Note updated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={title} onChange={e => setTitle(e.target.value.slice(0, 200))} className="mt-1.5" />
          </div>
          <div>
            <Label>Subject <span className="text-destructive">*</span></Label>
            <Input value={subject} onChange={e => setSubject(e.target.value.slice(0, 100))} className="mt-1.5" />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Description</Label><Textarea id="description" value={description} onChange={e => setDescription(e.target.value.slice(0, 500))} rows={3} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Branch</Label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {BRANCHES.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="university">University</Label><Input id="university" value={university} onChange={e => setUniversity(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  {[2026,2025,2024,2023,2022,2021,2020].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Tags <span className="text-xs text-muted-foreground">(comma-separated)</span></Label>
            <Input value={tags} onChange={e => setTags(e.target.value)} className="mt-1.5" />
            {tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.split(",").map(t => t.trim()).filter(Boolean).map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
