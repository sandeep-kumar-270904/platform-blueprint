import os

stories_path = "src/pages/SuccessStoriesPage.tsx"
with open(stories_path, "r", encoding="utf-8") as f:
    stories_content = f.read()

# Add a "Submit Your Story" button and modal state
if "Submit Your Story" not in stories_content:
    stories_content = stories_content.replace(
        "import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';",
        "import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';\nimport { Button } from '@/components/ui/button';\nimport { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';\nimport { Textarea } from '@/components/ui/textarea';\nimport { Input } from '@/components/ui/input';"
    )
    
    header_old = """          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">Alumni Success Stories</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            See how our platform has helped students land their dream jobs, and learn from their winning resumes.
            </p>
          </div>"""
    
    header_new = """          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">Alumni Success Stories</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            See how our platform has helped students land their dream jobs, and learn from their winning resumes.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Submit Your Story</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Your Success Story</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm font-medium">Company Landed</label>
                    <Input placeholder="e.g. Google" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <Input placeholder="e.g. Software Engineer" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Your Narrative</label>
                    <Textarea placeholder="How did the platform help you?" />
                  </div>
                  <Button className="w-full">Submit for Review</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>"""
    
    stories_content = stories_content.replace(header_old, header_new)

    with open(stories_path, "w", encoding="utf-8") as f:
        f.write(stories_content)
    print("Updated SuccessStoriesPage.tsx")

editor_path = "src/pages/ResumeEditorPage.tsx"
with open(editor_path, "r", encoding="utf-8") as f:
    editor_content = f.read()

if "Seal Time Capsule" not in editor_content:
    editor_content = editor_content.replace(
        "import { ArrowLeft } from 'lucide-react';",
        "import { ArrowLeft, Archive } from 'lucide-react';\nimport { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';\nimport { Input } from '@/components/ui/input';"
    )
    
    top_bar_old = """        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/resume-builder')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Resumes
          </Button>
        </div>"""
        
    top_bar_new = """        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/resume-builder')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Resumes
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><Archive className="h-4 w-4" /> Seal Time Capsule</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Seal Time Capsule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">Creating a Time Capsule preserves a permanent, un-editable snapshot of your resume at this exact moment, immune to the 20-version auto-prune limit.</p>
                <div>
                  <label className="text-sm font-medium">Capsule Note</label>
                  <Input placeholder="e.g. Fall 2026 Career Fair Final Version" />
                </div>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Seal Capsule</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>"""
        
    editor_content = editor_content.replace(top_bar_old, top_bar_new)

    with open(editor_path, "w", encoding="utf-8") as f:
        f.write(editor_content)
    print("Updated ResumeEditorPage.tsx")

