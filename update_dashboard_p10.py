import os

file_path = "src/pages/ResumeDashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

imports = """
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, ArchiveRestore } from "lucide-react";
"""

if "ArchiveRestore" not in content:
    content = content.replace("import { Trash2, Edit, FileText, Copy, Link as LinkIcon, Share2, PlayCircle, Bot } from \"lucide-react\";", "import { Trash2, Edit, FileText, Copy, Link as LinkIcon, Share2, PlayCircle, Bot, ArchiveRestore, AlertTriangle } from \"lucide-react\";\nimport { Tabs, TabsContent, TabsList, TabsTrigger } from \"@/components/ui/tabs\";")

# We need to change how resumes are fetched to support archived toggle
# But wait, resumeController handles `isArchived` query param. 
# We'll fetch active resumes by default, and archived resumes separately or together.
# To keep it simple in script editing, let's fetch BOTH separately or just fetch all and filter client side.
# Wait, my backend logic excluded isArchived by default `const isArchived = req.query.archived === 'true';`.
# I will modify the dashboard's fetch logic.
fetch_replace = """
  const [archivedResumes, setArchivedResumes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('active');

  const fetchResumes = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setResumes(await res.json());
      }
      
      const aRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes?archived=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (aRes.ok) {
        setArchivedResumes(await aRes.json());
      }
    } catch (error) {
      console.error("Error fetching resumes:", error);
    }
  };
"""

if "setArchivedResumes" not in content:
    content = content.replace("const fetchResumes = async () => {", fetch_replace + "\n  const oldFetch = () => {")

# Actions for restore
restore_action = """
  const handleRestore = async (id: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes/${id}/restore`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchResumes();
    } catch (e) {
      console.error(e);
    }
  };
"""
if "handleRestore" not in content:
    content = content.replace("const handleDuplicate", restore_action + "\n  const handleDuplicate")

ui_replace = """
      <div className="flex justify-between items-end">
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="active">Active Resumes ({resumes.length})</TabsTrigger>
              <TabsTrigger value="archived">Archived ({archivedResumes.length})</TabsTrigger>
            </TabsList>
            <Button onClick={handleCreateNew}>
              <FileText className="w-4 h-4 mr-2" />
              Create New Resume
            </Button>
          </div>

          <TabsContent value="active" className="space-y-6">
            {resumes.filter(r => new Date(r.updated_at).getTime() < Date.now() - 31536000000).length > 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Stale Resumes Detected</h4>
                  <p className="text-sm">You have resumes that haven't been updated in over a year. Consider archiving them to keep your dashboard clean.</p>
                </div>
              </div>
            )}
"""

if "TabsList" not in content:
    # replace the grid header with Tabs
    content = content.replace("<div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">", ui_replace + "\n      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">")

    # close TabsContent and add archived TabsContent
    archived_ui = """
          </TabsContent>
          <TabsContent value="archived" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {archivedResumes.map((resume) => (
                <Card key={resume._id} className="opacity-75">
                  <CardHeader>
                    <CardTitle className="truncate">{resume.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">Archived</p>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => handleRestore(resume._id)}>
                      <ArchiveRestore className="w-4 h-4 mr-2" /> Restore
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              {archivedResumes.length === 0 && (
                <div className="col-span-full py-12 text-center border rounded-lg bg-muted/20">
                  <p className="text-muted-foreground">No archived resumes.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
"""
    content = content.replace("</Card>\n        ))}\n      </div>", "</Card>\n        ))}\n      </div>\n" + archived_ui)


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated ResumeDashboard.tsx for Phase 10")
