import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface BatchUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const BatchUploadDialog = ({ open, onOpenChange, onSuccess }: BatchUploadDialogProps) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Common metadata
  const [subject, setSubject] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [category, setCategory] = useState("Lecture Notes");
  const [enhanceWithAI, setEnhanceWithAI] = useState(true);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    const validFiles = selectedFiles.filter(file => {
      if (file.type !== "application/pdf") {
        toast.error(`Skipped ${file.name}: Not a PDF`);
        return false;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`Skipped ${file.name}: Exceeds 50MB`);
        return false;
      }
      return true;
    });

    if (files.length + validFiles.length > 20) {
      toast.error("You can only upload up to 20 files at once");
      setFiles(prev => [...prev, ...validFiles].slice(0, 20));
    } else {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFiles([]);
    setSubject("");
    setBranch("");
    setSemester("");
    setCategory("Lecture Notes");
    setProgress(0);
    setUploading(false);
  };

  const handleBatchUpload = async () => {
    if (!user || files.length === 0) return;
    if (!subject) {
      toast.error("Subject is required for all files");
      return;
    }

    setUploading(true);
    setProgress(0);
    
    try {
      const token = localStorage.getItem("token");
      let successCount = 0;
      
      // We'll upload sequentially but track overall progress
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", file.name.replace(".pdf", ""));
        formData.append("subject", subject);
        if (branch) formData.append("branch", branch);
        if (semester) formData.append("semester", semester);
        if (category) formData.append("category", category);
        formData.append("description", `Batch uploaded notes for ${subject}`);

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "http://localhost:5000/api/notes");
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const fileProgress = event.loaded / event.total;
              const overallProgress = Math.round(((i + fileProgress) / files.length) * 100);
              setProgress(overallProgress);
            }
          };
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              successCount++;
              resolve(xhr.response);
            } else {
              reject(new Error("Failed to upload note"));
            }
          };
          
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(formData);
        });
      }

      setProgress(100);
      toast.success(`Successfully uploaded ${successCount} notes!`);
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "An error occurred during batch upload");
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v && !uploading) resetForm(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Batch Upload Notes
          </DialogTitle>
          <DialogDescription>
            Upload multiple notes at once. All files will share the same subject and category metadata.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Left Column: Metadata */}
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-4">
              <h4 className="font-semibold text-sm">Common Metadata</h4>
              <p className="text-xs text-muted-foreground">This metadata will be applied to all uploaded files.</p>
              
              <div>
                <Label>Subject <span className="text-destructive">*</span></Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Data Structures" disabled={uploading} className="mt-1" />
              </div>

              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory} disabled={uploading}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lecture Notes">Lecture Notes</SelectItem>
                    <SelectItem value="Assignment">Assignment</SelectItem>
                    <SelectItem value="Previous Year Paper">Previous Year Paper</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Branch</Label>
                  <Input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="e.g., CSE" disabled={uploading} className="mt-1" />
                </div>
                <div>
                  <Label>Semester</Label>
                  <Input value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="e.g., 3" disabled={uploading} className="mt-1" type="number" />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="batch-ai" checked={enhanceWithAI} onCheckedChange={(c) => setEnhanceWithAI(!!c)} disabled={uploading} />
                <Label htmlFor="batch-ai" className="text-sm cursor-pointer">AI Enhance PDFs</Label>
              </div>
            </div>
          </div>

          {/* Right Column: Files */}
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => !uploading && document.getElementById('batch-file-input')?.click()}
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="font-medium text-sm">Select multiple PDFs</p>
              <p className="text-xs text-muted-foreground mt-1">Up to 20 files, max 50MB each</p>
              <Input id="batch-file-input" type="file" accept="application/pdf" multiple onChange={handleFileSelect} disabled={uploading} className="hidden" />
            </div>

            {files.length > 0 && (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span>Selected Files ({files.length})</span>
                  {files.length > 0 && !uploading && (
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-destructive" onClick={() => setFiles([])}>Clear All</Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted border border-border/50 text-sm">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                        {!uploading ? (
                          <button onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-destructive">
                            <X className="h-4 w-4" />
                          </button>
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {uploading && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading {files.length} files...</span>
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
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>Cancel</Button>
          <Button onClick={handleBatchUpload} disabled={files.length === 0 || !subject || uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {uploading ? "Uploading..." : `Upload ${files.length} Notes`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
