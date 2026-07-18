import os

file_path = "src/components/resume/ResumeEditor.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

education_code = """
        {/* Education */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Education</CardTitle>
            <Button variant="outline" size="sm" onClick={() => addArrayItem('education', { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gpa: '', achievements: [] })}>
              <Plus className="h-4 w-4 mr-1" /> Add Education
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {resume.education?.map((edu, i) => (
              <div key={i} className="p-4 border rounded-md relative space-y-4">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeArrayItem('education', i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-2 gap-4 pr-8">
                  <div>
                    <Label>Institution</Label>
                    <Input value={edu.institution} onChange={e => handleArrayChange('education', i, 'institution', e.target.value)} />
                  </div>
                  <div>
                    <Label>Degree</Label>
                    <Input value={edu.degree} onChange={e => handleArrayChange('education', i, 'degree', e.target.value)} />
                  </div>
                  <div>
                    <Label>Field of Study</Label>
                    <Input value={edu.fieldOfStudy} onChange={e => handleArrayChange('education', i, 'fieldOfStudy', e.target.value)} />
                  </div>
                  <div>
                    <Label>GPA</Label>
                    <Input value={edu.gpa} onChange={e => handleArrayChange('education', i, 'gpa', e.target.value)} />
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input type="date" value={edu.startDate} onChange={e => handleArrayChange('education', i, 'startDate', e.target.value)} />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input type="date" value={edu.endDate} onChange={e => handleArrayChange('education', i, 'endDate', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
"""

projects_code = """
        {/* Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Projects</CardTitle>
            <Button variant="outline" size="sm" onClick={() => addArrayItem('projects', { name: '', description: '', liveUrl: '', repoUrl: '', bulletPoints: [] })}>
              <Plus className="h-4 w-4 mr-1" /> Add Project
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {resume.projects?.map((proj, i) => (
              <div key={i} className="p-4 border rounded-md relative space-y-4">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeArrayItem('projects', i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-2 gap-4 pr-8">
                  <div>
                    <Label>Project Name</Label>
                    <Input value={proj.name} onChange={e => handleArrayChange('projects', i, 'name', e.target.value)} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input value={proj.description} onChange={e => handleArrayChange('projects', i, 'description', e.target.value)} />
                  </div>
                  <div>
                    <Label>Live URL</Label>
                    <Input value={proj.liveUrl} onChange={e => handleArrayChange('projects', i, 'liveUrl', e.target.value)} />
                  </div>
                  <div>
                    <Label>Repository URL</Label>
                    <Input value={proj.repoUrl} onChange={e => handleArrayChange('projects', i, 'repoUrl', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="flex justify-between items-center mb-2">
                    Bullet Points
                    <Button type="button" variant="ghost" size="sm" onClick={() => {
                      const bps = [...(proj.bulletPoints || [])];
                      bps.push("");
                      handleArrayChange('projects', i, 'bulletPoints', bps);
                    }}>+ Add Bullet</Button>
                  </Label>
                  {proj.bulletPoints?.map((bp, j) => (
                    <div key={j} className="flex gap-2 mb-2">
                      <Input value={bp} onChange={e => {
                        const bps = [...proj.bulletPoints];
                        bps[j] = e.target.value;
                        handleArrayChange('projects', i, 'bulletPoints', bps);
                      }} />
                      <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => {
                        const bps = [...proj.bulletPoints];
                        bps.splice(j, 1);
                        handleArrayChange('projects', i, 'bulletPoints', bps);
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
"""

skills_code = """
        {/* Skills */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Skills</CardTitle>
            <Button variant="outline" size="sm" onClick={() => addArrayItem('skills', { category: '', items: [] })}>
              <Plus className="h-4 w-4 mr-1" /> Add Category
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {resume.skills?.map((skill, i) => (
              <div key={i} className="p-4 border rounded-md relative space-y-4">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeArrayItem('skills', i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="pr-8 space-y-4">
                  <div>
                    <Label>Category (e.g. Frontend, Tools)</Label>
                    <Input value={skill.category} onChange={e => handleArrayChange('skills', i, 'category', e.target.value)} />
                  </div>
                  <div>
                    <Label>Skills (comma separated)</Label>
                    <Input value={(skill.items || []).join(', ')} onChange={e => handleArrayChange('skills', i, 'items', e.target.value.split(',').map(s => s.trim()))} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
"""

certifications_code = """
        {/* Certifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Certifications</CardTitle>
            <Button variant="outline" size="sm" onClick={() => addArrayItem('certifications', { name: '', issuer: '', issueDate: '', credentialUrl: '' })}>
              <Plus className="h-4 w-4 mr-1" /> Add Certification
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {resume.certifications?.map((cert, i) => (
              <div key={i} className="p-4 border rounded-md relative space-y-4">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeArrayItem('certifications', i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-2 gap-4 pr-8">
                  <div>
                    <Label>Name</Label>
                    <Input value={cert.name} onChange={e => handleArrayChange('certifications', i, 'name', e.target.value)} />
                  </div>
                  <div>
                    <Label>Issuer</Label>
                    <Input value={cert.issuer} onChange={e => handleArrayChange('certifications', i, 'issuer', e.target.value)} />
                  </div>
                  <div>
                    <Label>Issue Date</Label>
                    <Input type="date" value={cert.issueDate} onChange={e => handleArrayChange('certifications', i, 'issueDate', e.target.value)} />
                  </div>
                  <div>
                    <Label>Credential URL</Label>
                    <Input value={cert.credentialUrl} onChange={e => handleArrayChange('certifications', i, 'credentialUrl', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
"""

achievements_code = """
        {/* Achievements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Achievements</CardTitle>
            <Button variant="outline" size="sm" onClick={() => addArrayItem('achievements', { title: '', description: '', date: '' })}>
              <Plus className="h-4 w-4 mr-1" /> Add Achievement
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {resume.achievements?.map((ach, i) => (
              <div key={i} className="p-4 border rounded-md relative space-y-4">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeArrayItem('achievements', i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-2 gap-4 pr-8">
                  <div>
                    <Label>Title</Label>
                    <Input value={ach.title} onChange={e => handleArrayChange('achievements', i, 'title', e.target.value)} />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={ach.date} onChange={e => handleArrayChange('achievements', i, 'date', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Textarea value={ach.description} onChange={e => handleArrayChange('achievements', i, 'description', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
"""

languages_code = """
        {/* Languages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Languages</CardTitle>
            <Button variant="outline" size="sm" onClick={() => addArrayItem('languages', { name: '', proficiency: '' })}>
              <Plus className="h-4 w-4 mr-1" /> Add Language
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {resume.languages?.map((lang, i) => (
              <div key={i} className="p-4 border rounded-md relative space-y-4">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeArrayItem('languages', i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-2 gap-4 pr-8">
                  <div>
                    <Label>Language</Label>
                    <Input value={lang.name} onChange={e => handleArrayChange('languages', i, 'name', e.target.value)} />
                  </div>
                  <div>
                    <Label>Proficiency</Label>
                    <Input value={lang.proficiency} onChange={e => handleArrayChange('languages', i, 'proficiency', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
"""

links_code = """
        {/* Links */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Links</CardTitle>
            <Button variant="outline" size="sm" onClick={() => addArrayItem('links', { label: '', url: '' })}>
              <Plus className="h-4 w-4 mr-1" /> Add Link
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {resume.links?.map((link, i) => (
              <div key={i} className="p-4 border rounded-md relative space-y-4">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeArrayItem('links', i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-2 gap-4 pr-8">
                  <div>
                    <Label>Label</Label>
                    <Input value={link.label} onChange={e => handleArrayChange('links', i, 'label', e.target.value)} />
                  </div>
                  <div>
                    <Label>URL</Label>
                    <Input value={link.url} onChange={e => handleArrayChange('links', i, 'url', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
"""

target = '</CardContent>\n        </Card>\n      </div>\n\n      {/* Sidebar Col */}'
insertion = education_code + projects_code + skills_code + certifications_code + achievements_code + languages_code + links_code

new_content = content.replace(target, '</CardContent>\n        </Card>\n' + insertion + '\n      </div>\n\n      {/* Sidebar Col */}')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Injected all new sections into ResumeEditor.tsx")
