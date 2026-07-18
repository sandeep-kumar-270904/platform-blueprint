import os

file_path = "src/components/resume/ResumeEditor.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports for DropdownMenu and Download icon
if "DropdownMenu," not in content:
    content = content.replace("import { Card, CardContent } from '@/components/ui/card';", "import { Card, CardContent } from '@/components/ui/card';\nimport { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';")

if "Download," not in content:
    content = content.replace("History,", "History, Download,")

# Add downloadFormat function
download_fn = """
  const handleDownloadFormat = async (format: string) => {
    try {
      const res = await api.get(`/resumes/${resumeId}/export/${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${resume.title.replace(/\\s+/g, '_')}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      trackExport?.();
    } catch (error) {
      console.error(error);
    }
  };
"""
content = content.replace("const scoreResume = async () => {", download_fn + "\n  const scoreResume = async () => {")

# Replace PDFDownloadLink block
target = """<PDFDownloadLink
                  document={<ResumePDF resume={resume} />}
                  fileName={`${resume.title.replace(/\\s+/g, '_')}.pdf`}
                  className="w-full"
                  onClick={() => trackExport?.()}
                >
                  {({ loading }) => (
                    <Button variant="outline" className="w-full gap-2" disabled={loading}>
                      <LayoutPanelLeft className="h-4 w-4" /> 
                      {loading ? 'Generating PDF...' : 'Export to PDF'}
                    </Button>
                  )}
                </PDFDownloadLink>"""

replacement = """<DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full gap-2">
                      <Download className="h-4 w-4" /> Export Resume
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    <DropdownMenuItem asChild>
                      <PDFDownloadLink
                        document={<ResumePDF resume={resume} />}
                        fileName={`${resume.title.replace(/\\s+/g, '_')}.pdf`}
                        className="w-full flex items-center cursor-pointer"
                        onClick={() => trackExport?.()}
                      >
                        {({ loading }) => loading ? 'Generating PDF...' : 'Export as PDF'}
                      </PDFDownloadLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownloadFormat('docx')} className="cursor-pointer">
                      Export as DOCX
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownloadFormat('txt')} className="cursor-pointer">
                      Export as TXT
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownloadFormat('json')} className="cursor-pointer">
                      Export as JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>"""

content = content.replace(target, replacement)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated ResumeEditor.tsx with export dropdown")
