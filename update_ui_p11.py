import os

# 1. PortfolioEditorPage.tsx
portfolio_path = "src/pages/PortfolioEditorPage.tsx"
with open(portfolio_path, "r", encoding="utf-8") as f:
    content = f.read()

narrative_pull = """
  const handlePullNarrative = async (blockIndex: number) => {
    try {
      const token = localStorage.getItem('token');
      // If we don't have the draft loaded, we can fetch the resume narrative
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes/${portfolio?.resumeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.narrativeDraft) {
        updateCustomBlock(blockIndex, 'richTextContent', data.narrativeDraft);
        toast.success("Draft pulled from Resume Narrative");
      } else {
        toast("No narrative draft found on the linked resume.");
      }
    } catch (e) {
      toast.error("Failed to pull narrative");
    }
  };
"""

if "handlePullNarrative" not in content:
    content = content.replace("const handleSave = async () => {", narrative_pull + "\n  const handleSave = async () => {")

    # Add button to the Custom Block if it is titled 'About' or similar. 
    # The portfolio custom blocks just map through blocks. We can add the button near the textarea.
    import re
    content = re.sub(
        r'(<Textarea\s*value=\{block\.richTextContent\}\s*onChange=\{\(e\) => updateCustomBlock\(index, \'richTextContent\', e\.target\.value\)\}\s*className="min-h-\[150px\]"\s*/>)',
        r'\1\n                  <Button variant="link" size="sm" onClick={() => handlePullNarrative(index)} className="mt-2 text-primary">Pull Draft from Resume Narrative</Button>',
        content
    )
    with open(portfolio_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated PortfolioEditorPage.tsx")

# 2. ATSDashboard.tsx
ats_path = "src/pages/ATSDashboard.tsx"
with open(ats_path, "r", encoding="utf-8") as f:
    ats = f.read()

rejection_logic = """
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectAppId, setRejectAppId] = useState<string | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState<string | null>(null);
  const [rejectionFeedbackNote, setRejectionFeedbackNote] = useState('');

  const handleOpenRejectModal = (id: string) => {
    setRejectAppId(id);
    setRejectionFeedback(null);
    setRejectionFeedbackNote('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectAppId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/applications/${rejectAppId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          newStatus: 'rejected', 
          note: 'Rejected via ATS',
          rejectionFeedback,
          rejectionFeedbackNote
        })
      });
      if (res.ok) {
        toast.success("Application rejected");
        setApplications(applications.map(app => app._id === rejectAppId ? { ...app, status: 'rejected' } : app));
      }
    } catch (e) {
      toast.error("Error updating status");
    } finally {
      setRejectModalOpen(false);
      setRejectAppId(null);
    }
  };
"""

if "handleOpenRejectModal" not in ats:
    ats = ats.replace("const handleStatusUpdate = async (id: string, newStatus: string) => {", rejection_logic + "\n  const handleStatusUpdate = async (id: string, newStatus: string) => {")
    
    # We need to replace the direct reject call with handleOpenRejectModal
    # Right now, there is a select box for status, not a direct reject button.
    # We will modify the status select onChange or if they have buttons.
    # Ah, let's see how they update status in ATSDashboard.
    # They probably have a select or buttons.
    pass

    modal_ui = """
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Reject Application</h2>
            <p className="text-sm text-gray-500 mb-4">Optional: Provide constructive feedback to the applicant.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium">Primary Reason</label>
                <select 
                  className="w-full mt-1 border rounded p-2 dark:bg-gray-700" 
                  value={rejectionFeedback || ''}
                  onChange={e => setRejectionFeedback(e.target.value || null)}
                >
                  <option value="">-- No specific reason --</option>
                  <option value="skills_gap">Skills Gap</option>
                  <option value="experience_level">Experience Level</option>
                  <option value="culture_fit">Culture Fit</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Additional Note (Private & Supportive)</label>
                <textarea 
                  className="w-full mt-1 border rounded p-2 dark:bg-gray-700 min-h-[100px]" 
                  value={rejectionFeedbackNote}
                  onChange={e => setRejectionFeedbackNote(e.target.value)}
                  placeholder="e.g. We loved your portfolio, but need more React experience."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmReject}>Reject Applicant</Button>
            </div>
          </div>
        </div>
      )}
"""
    ats = ats.replace("return (", "return (\n    <>\n" + modal_ui)
    ats = ats.replace("export default ATSDashboard;", "</>\n  );\n}\n\nexport default ATSDashboard;")
    
    # Let's fix the status update intercept
    ats = ats.replace(
      "const handleStatusUpdate = async (id: string, newStatus: string) => {\n",
      "const handleStatusUpdate = async (id: string, newStatus: string) => {\n    if (newStatus === 'rejected') {\n      handleOpenRejectModal(id);\n      return;\n    }\n"
    )
    
    with open(ats_path, "w", encoding="utf-8") as f:
        f.write(ats)
    print("Updated ATSDashboard.tsx")

