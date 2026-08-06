import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Sparkles, FileText, BookOpen } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface NoteUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newNote: any) => void;
}

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

export const NoteUploadDialog = ({ open, onOpenChange, onSuccess }: NoteUploadDialogProps) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [category, setCategory] = useState("");
  const [university, setUniversity] = useState("");
  const [year, setYear] = useState("");
  const [tags, setTags] = useState("");
  const [enhanceWithAI, setEnhanceWithAI] = useState(true);
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv"
      ];
      if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(pdf|doc|docx|xls|xlsx|csv)$/i)) {
        toast.error("Please upload a PDF, Word, or Excel file");
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error("File size must be under 50MB");
        return;
      }
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const validateStep1 = () => {
    if (!file) { toast.error("Please select a file to upload"); return false; }
    if (!title.trim() || title.trim().length < 5) { toast.error("Title must be at least 5 characters long"); return false; }
    if (!subject.trim()) { toast.error("Subject is required"); return false; }
    if (!category) { toast.error("Please select a category"); return false; }
    if (description.trim() && description.trim().length < 10) { toast.error("Description should be at least 10 characters long if provided"); return false; }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const resetForm = () => {
    setFile(null); setTitle(""); setSubject(""); setDescription("");
    setBranch(""); setSemester(""); setCategory(""); setUniversity("");
    setYear(""); setTags(""); setStep(1); setProgress(0); setUploading(false);
  };

  const handleUpload = async () => {
    if (!user || !file) {
      toast.error("Please sign in and select a file");
      return;
    }

    setUploading(true);
    setProgress(0);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      formData.append("subject", subject.trim());
      if (description) formData.append("description", description.trim());
      if (branch) formData.append("branch", branch);
      if (semester) formData.append("semester", semester);
      if (category) formData.append("category", category);
      if (university) formData.append("university", university.trim());
      if (year) formData.append("year", year);
      if (tags) formData.append("tags", tags);

      const token = localStorage.getItem("token");
      
      const newNote = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:5000/api/notes");
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            // Cap at 95% until we actually get the server response
            setProgress(Math.min(percentComplete, 95));
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress(100);
            try {
              resolve(JSON.parse(xhr.response));
            } catch {
              resolve({});
            }
          } else {
            try {
              const err = JSON.parse(xhr.response);
              reject(new Error(err.error || "Failed to upload note"));
            } catch {
              reject(new Error("Failed to upload note"));
            }
          }
        };
        
        xhr.onerror = () => reject(new Error("Network error occurred"));
        xhr.send(formData);
      });

      toast.success("Note uploaded successfully! 🎉");
      onSuccess(newNote);
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload note");
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v && !uploading) resetForm(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Upload Note
          </DialogTitle>
          <DialogDescription>
            Share your notes with the community. Fill in the details to help others find them.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>1</div>
          <div className={`flex-1 h-1 rounded ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <Label htmlFor="file" className="text-sm font-medium">Document File <span className="text-destructive">*</span></Label>
              <div className="mt-1.5 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => !uploading && document.getElementById('file-input')?.click()}>
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Badge variant="secondary">FILE</Badge>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to select or drag & drop a PDF, Word, or Excel file</p>
                    <p className="text-xs text-muted-foreground mt-1">Max file size: 50MB</p>
                  </div>
                )}
              </div>
              <Input id="file-input" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv" onChange={handleFileChange} disabled={uploading} className="hidden" />
            </div>

            {/* AI Enhancement */}
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Checkbox id="enhance" checked={enhanceWithAI} onCheckedChange={(checked) => setEnhanceWithAI(checked as boolean)} disabled={uploading} />
              <Label htmlFor="enhance" className="flex items-center gap-2 cursor-pointer text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                Enhance with AI (clean shadows, straighten pages, enhance contrast, OCR)
              </Label>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 200))} placeholder="e.g., Data Structures — Lecture 5: Binary Trees" disabled={uploading} className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1">{title.length}/200 characters</p>
            </div>

            {/* Subject */}
            <div>
              <Label htmlFor="subject">Subject <span className="text-destructive">*</span></Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value.slice(0, 100))} placeholder="e.g., Data Structures and Algorithms" disabled={uploading} className="mt-1.5" />
            </div>

            {/* Category */}
            <div>
              <Label>Category <span className="text-destructive">*</span></Label>
              <Select value={category} onValueChange={setCategory} disabled={uploading}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description <span className="text-xs text-muted-foreground font-normal">(Optional)</span></Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value.slice(0, 500))} placeholder="Briefly describe what these notes cover..." disabled={uploading} rows={3} className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1">{description.length}/500 characters</p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>Cancel</Button>
              <Button onClick={handleNext} disabled={uploading}>Next →</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Branch <span className="text-xs text-muted-foreground font-normal">(Optional)</span></Label>
                <Select value={branch} onValueChange={setBranch} disabled={uploading}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map((b) => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Semester <span className="text-xs text-muted-foreground font-normal">(Optional)</span></Label>
                <Select value={semester} onValueChange={setSemester} disabled={uploading}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select semester" /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="university">University / College <span className="text-xs text-muted-foreground font-normal">(Optional)</span></Label>
                <Input id="university" value={university} onChange={(e) => setUniversity(e.target.value.slice(0, 150))} placeholder="e.g., IIT Delhi" disabled={uploading} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="year">Year <span className="text-xs text-muted-foreground font-normal">(Optional)</span></Label>
                <Select value={year} onValueChange={setYear} disabled={uploading}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags <span className="text-xs text-muted-foreground">(comma-separated)</span></Label>
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value.slice(0, 200))} placeholder="e.g., algorithms, sorting, trees, mid-sem" disabled={uploading} className="mt-1.5" />
              {tags && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Summary Preview */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <h4 className="text-sm font-semibold mb-2">Upload Summary</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-muted-foreground">File:</span><span className="truncate">{file?.name}</span>
                <span className="text-muted-foreground">Title:</span><span className="truncate">{title}</span>
                <span className="text-muted-foreground">Subject:</span><span>{subject}</span>
                <span className="text-muted-foreground">Category:</span><span>{category}</span>
                {branch && <><span className="text-muted-foreground">Branch:</span><span>{BRANCHES.find(b => b.value === branch)?.label}</span></>}
                {semester && <><span className="text-muted-foreground">Semester:</span><span>{semester}</span></>}
                {university && <><span className="text-muted-foreground">University:</span><span>{university}</span></>}
                <span className="text-muted-foreground">AI Enhanced:</span><span>{enhanceWithAI ? "Yes ✨" : "No"}</span>
              </div>
            </div>

            {uploading && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setStep(1)} disabled={uploading}>← Back</Button>
              <Button onClick={handleUpload} disabled={!file || uploading}>
                <Upload className="mr-2 h-4 w-4" />Upload Note
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
