import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Download, Upload, Target, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PlacementResources = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "General",
    file: null as File | null
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const res = await fetch(`${API_URL}/api/placement-resources`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setResources(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) {
      toast({ title: "Error", description: "Please select a file.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("category", formData.category);
    data.append("file", formData.file);

    try {
      const res = await fetch(`${API_URL}/api/placement-resources`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: data
      });

      if (res.ok) {
        toast({ title: "Success", description: "Resource uploaded successfully!" });
        setShowUpload(false);
        setFormData({ title: "", description: "", category: "General", file: null });
        fetchResources();
      } else {
        throw new Error("Failed to upload");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const filteredResources = filterCategory === "All" ? resources : resources.filter(r => r.category === filterCategory);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Target className="text-primary w-8 h-8" />
              Placement Resources
            </h1>
            <p className="text-muted-foreground mt-2">
              Combined view of official and community-uploaded study materials.
            </p>
          </div>
          <Button onClick={() => setShowUpload(!showUpload)}>
            <Upload className="w-4 h-4 mr-2" /> Upload Resource
          </Button>
        </div>

        {showUpload && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Share a Resource</CardTitle>
              <CardDescription>Upload PDFs or documents to help your peers prepare.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Google Interview Guide" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DSA">DSA</SelectItem>
                        <SelectItem value="Aptitude">Aptitude</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Company Specific">Company Specific</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="What does this resource contain?" />
                </div>
                <div className="space-y-2">
                  <Label>File (PDF/DOC)</Label>
                  <Input type="file" required onChange={e => setFormData({ ...formData, file: e.target.files?.[0] || null })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setShowUpload(false)}>Cancel</Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Upload
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {["All", "DSA", "Aptitude", "HR", "Company Specific", "General"].map(cat => (
            <Badge 
              key={cat} 
              variant={filterCategory === cat ? "default" : "outline"} 
              className="cursor-pointer text-sm py-1 px-3"
              onClick={() => setFilterCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/10">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <p className="text-muted-foreground font-medium">No resources found in this category.</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to upload one!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((res: any) => (
              <Card key={res._id} className="hover:shadow-md transition-shadow flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={res.isAdminUpload ? "default" : "secondary"}>
                      {res.category}
                    </Badge>
                    {res.isAdminUpload && <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Official</Badge>}
                  </div>
                  <CardTitle className="text-lg line-clamp-2" title={res.title}>{res.title}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">{res.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-4 border-t flex items-center justify-between">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {res.uploadedBy?.avatar_url ? (
                        <img src={`${API_URL}${res.uploadedBy.avatar_url}`} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{res.uploadedBy?.full_name?.charAt(0) || '?'}</span>
                      )}
                    </div>
                    <span>By {res.uploadedBy?.full_name || 'Anonymous'}</span>
                  </div>
                  <Button size="sm" variant="ghost" asChild>
                    <a href={`${API_URL}${res.fileUrl}`} target="_blank" rel="noreferrer" download>
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlacementResources;
