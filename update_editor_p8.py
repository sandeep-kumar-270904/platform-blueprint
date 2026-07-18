import os

file_path = "src/components/resume/ResumeEditor.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Imports
if "ResumeCompleteness" not in content:
    content = content.replace("import { LinkedInExportModal } from \"./LinkedInExportModal\";", "import { LinkedInExportModal } from \"./LinkedInExportModal\";\nimport { ResumeCompleteness } from \"./ResumeCompleteness\";\nimport { TranslationModal } from \"./TranslationModal\";")

if "Settings," not in content:
    content = content.replace("import { Download, Save, Share2, Linkedin } from \"lucide-react\";", "import { Download, Save, Share2, Linkedin, Settings, Languages, AlertTriangle } from \"lucide-react\";")

# Display Preferences State
pref_state = """
  // Phase 8: Display Preferences
  const [highContrast, setHighContrast] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [textSize, setTextSize] = useState<'normal'|'large'>('normal');
  const [translateOpen, setTranslateOpen] = useState(false);
  const [accessibilityWarnings, setAccessibilityWarnings] = useState<string[]>([]);
"""

if "const [highContrast" not in content:
    content = content.replace("const [linkedinOpen, setLinkedinOpen] = useState(false);", "const [linkedinOpen, setLinkedinOpen] = useState(false);\n" + pref_state)

# Display Preferences Dropdown UI
settings_ui = """
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Accessibility Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setHighContrast(!highContrast)}>
                {highContrast ? 'Disable' : 'Enable'} High Contrast
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDyslexiaFont(!dyslexiaFont)}>
                {dyslexiaFont ? 'Disable' : 'Enable'} Dyslexia Font
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTextSize(textSize === 'normal' ? 'large' : 'normal')}>
                {textSize === 'normal' ? 'Large Text' : 'Normal Text'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTranslateOpen(true)}>
                <Languages className="h-4 w-4 mr-2" /> Translate Resume
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
"""

if "<Settings className=\"h-4 w-4 mr-2\" />" not in content:
    content = content.replace("<Button variant=\"outline\" size=\"sm\" onClick={() => setLinkedinOpen(true)}>", settings_ui + "\n          <Button variant=\"outline\" size=\"sm\" onClick={() => setLinkedinOpen(true)}>")

# Screen Reader Export Option
# Add it to the Download dropdown
screen_reader_export = """
              <DropdownMenuItem onClick={() => handleExport('pdf', 'screen-reader')}>
                Screen Reader Optimized (PDF)
              </DropdownMenuItem>
"""
if "Screen Reader Optimized" not in content:
    content = content.replace("<DropdownMenuItem onClick={() => handleExport('docx')}>", screen_reader_export + "\n              <DropdownMenuItem onClick={() => handleExport('docx')}>")

# Apply CSS classes based on preferences
classes = "flex-1 overflow-auto bg-muted/30 p-8"
if "className={clsx" not in content:
    # Let's just do inline style or template string for the container
    content = content.replace("className=\"flex-1 overflow-auto bg-muted/30 p-8\"", "className={`flex-1 overflow-auto bg-muted/30 p-8 ${highContrast ? 'contrast-150 grayscale' : ''} ${dyslexiaFont ? 'font-opendyslexic tracking-wide' : ''} ${textSize === 'large' ? 'text-lg' : 'text-sm'}`}")

# Completeness & Inclusive Hiring
# Inject into the sidebar, before or after ATS score
completeness_ui = """
          <ResumeCompleteness resumeId={resumeId as string} />
          
          {accessibilityWarnings.length > 0 && (
            <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 p-3 rounded-md text-sm border border-amber-200 dark:border-amber-800">
              <div className="flex items-center font-bold mb-1"><AlertTriangle className="h-4 w-4 mr-2"/> Accessibility Warning</div>
              <ul className="list-disc pl-5">
                {accessibilityWarnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
"""
if "<ResumeCompleteness" not in content:
    content = content.replace("<AtsScoreWidget />", "<AtsScoreWidget />\n" + completeness_ui)

# Update accessibilityWarnings logic based on resume content changes
# E.g. inside a useEffect watching resume object
warning_logic = """
  // Basic heuristic for accessibility
  useEffect(() => {
    let warnings = [];
    // E.g., if we see "table" tags inside descriptions
    let hasTables = false;
    resume.experience?.forEach(exp => {
      if (exp.description?.includes('<table')) hasTables = true;
    });
    if (hasTables) warnings.push("Tables detected in experience descriptions. Tables used for layout can break screen reader parsing order.");
    setAccessibilityWarnings(warnings);
  }, [resume]);
"""
if "setAccessibilityWarnings" not in content:
    content = content.replace("const handleExport", warning_logic + "\n  const handleExport")

# Add TranslationModal at the bottom
if "<TranslationModal" not in content:
    content = content.replace("</ResumeProvider>", "<TranslationModal open={translateOpen} onOpenChange={setTranslateOpen} resumeId={resumeId as string} />\n    </ResumeProvider>")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated ResumeEditor.tsx with Phase 8 UI")
