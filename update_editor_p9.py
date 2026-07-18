import os

file_path = "src/components/resume/ResumeEditor.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

imports = """
import { AiEditingAssistant } from "./AiEditingAssistant";
import { TestimonialManager } from "./TestimonialManager";
import { RecommendationManager } from "./RecommendationManager";
"""

if "AiEditingAssistant" not in content:
    content = content.replace("import { TranslationModal } from \"./TranslationModal\";", "import { TranslationModal } from \"./TranslationModal\";\n" + imports)

# We want to add these components inside the right sidebar (where AtsScoreWidget is).
# Or maybe the AiEditingAssistant goes in the sidebar, and TestimonialManager / RecommendationManager go in a new tab or at the bottom.
sidebar_additions = """
          <AiEditingAssistant resumeId={resumeId as string} />
"""

if "AiEditingAssistant resumeId" not in content:
    content = content.replace("<AtsScoreWidget />", "<AtsScoreWidget />\n" + sidebar_additions)

# Add Freelance profile toggle near the top of the main area
profile_toggle = """
          <div className="flex items-center justify-between bg-muted/20 p-4 rounded-md border border-muted/50 mb-8">
            <div>
              <h3 className="text-sm font-semibold">Profile Type</h3>
              <p className="text-xs text-muted-foreground">Switch between traditional chronological format and a freelance/consulting portfolio format.</p>
            </div>
            <select 
              className="text-sm border rounded-md p-1.5 bg-background"
              value={resume.profileType || 'traditional'}
              onChange={(e) => updateResume({ profileType: e.target.value })}
            >
              <option value="traditional">Traditional</option>
              <option value="freelance">Freelance & Consulting</option>
            </select>
          </div>
"""

if "Profile Type" not in content:
    content = content.replace("<ResumeSection title=\"Summary\">", profile_toggle + "\n          <ResumeSection title=\"Summary\">")

# If freelance, render the TestimonialManager and Services sections
freelance_ui = """
          {resume.profileType === 'freelance' && (
            <div className="space-y-8 mt-8 border-t pt-8">
              <ResumeSection title="Services Offered">
                <p className="text-xs text-muted-foreground mb-4">Define your consulting services, rates, and engagement types.</p>
                {/* Simplified placeholder for Services array editing */}
                <Button variant="outline" size="sm" onClick={() => {
                  const newService = { title: 'New Service', description: '', rateType: 'hourly', rateRange: '' };
                  updateResume({ services: [...(resume.services || []), newService] });
                }}>+ Add Service</Button>
                
                <div className="space-y-4 mt-4">
                  {(resume.services || []).map((s: any, idx: number) => (
                    <div key={idx} className="bg-background p-4 rounded-md border space-y-2">
                      <Input value={s.title} onChange={e => {
                        const newS = [...resume.services];
                        newS[idx].title = e.target.value;
                        updateResume({ services: newS });
                      }} placeholder="Service Title" />
                      <select className="text-sm border rounded-md p-1.5 w-full" value={s.rateType} onChange={e => {
                        const newS = [...resume.services];
                        newS[idx].rateType = e.target.value;
                        updateResume({ services: newS });
                      }}>
                        <option value="hourly">Hourly</option>
                        <option value="project">Project-based</option>
                        <option value="retainer">Retainer</option>
                      </select>
                    </div>
                  ))}
                </div>
              </ResumeSection>
              
              <ResumeSection title="Client Testimonials">
                <TestimonialManager resumeId={resumeId as string} />
              </ResumeSection>
            </div>
          )}

          <div className="mt-8 pt-8 border-t">
            <ResumeSection title="Digital Recommendation Letters">
              <RecommendationManager />
            </ResumeSection>
          </div>
"""

if "Services Offered" not in content:
    content = content.replace("</ResumeSection>\n          <div className=\"pt-8 mt-8 border-t border-muted-foreground/10\">", freelance_ui + "\n          </ResumeSection>\n          <div className=\"pt-8 mt-8 border-t border-muted-foreground/10\">")


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added Freelance UI and AI Assistant to ResumeEditor")
