import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ResumeManager({ resumes, onResumesChange, loading }) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    const toastId = toast.loading('Uploading and parsing resume...');
    try {
      const res = await fetch('/api/resumes/import/file', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (res.ok) {
        toast.success('Resume uploaded successfully', { id: toastId });
        onResumesChange();
      } else {
        toast.error('Failed to parse resume', { id: toastId });
      }
    } catch (error) {
      toast.error('Upload error', { id: toastId });
    } finally {
      setUploading(false);
      e.target.value = null; // reset input
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      const res = await fetch(`/api/resumes/${id}/default`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast.success('Primary resume updated');
        onResumesChange();
      }
    } catch (error) {
      toast.error('Failed to set primary');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      const res = await fetch(`/api/resumes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast.success('Resume deleted');
        onResumesChange();
      }
    } catch (error) {
      toast.error('Failed to delete resume');
    }
  };

  if (loading) return <div>Loading resumes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Your Resumes</h2>
          <p className="text-sm text-slate-500">Upload a PDF or Word document to get started.</p>
        </div>
        <div>
          <input 
            type="file" 
            accept=".pdf,.doc,.docx" 
            className="hidden" 
            id="resume-upload" 
            onChange={handleFileUpload} 
            disabled={uploading}
          />
          <label htmlFor="resume-upload">
            <Button asChild disabled={uploading}>
              <span className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Parsing...' : 'Upload Resume'}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {resumes.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center h-48 text-center text-slate-500 space-y-4">
            <FileText className="w-12 h-12 text-slate-300" />
            <p>You haven't uploaded any resumes yet.<br/>Upload one to start analyzing its ATS compatibility!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map(resume => (
            <Card key={resume._id} className={resume.isDefault ? "border-indigo-500 ring-1 ring-indigo-500 shadow-md" : ""}>
              <CardHeader className="pb-3 bg-slate-50 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-800">{resume.title || 'Untitled Resume'}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Updated: {new Date(resume.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  {resume.isDefault && (
                    <div className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-md flex items-center font-medium">
                      <Star className="w-3 h-3 mr-1 fill-indigo-700" />
                      Primary
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="text-sm text-slate-600">
                  <div className="flex justify-between py-1 border-b">
                    <span>Target Role:</span>
                    <span className="font-medium text-slate-800">{resume.personalInfo?.title || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span>Experience:</span>
                    <span className="font-medium text-slate-800">{resume.experience?.length || 0} roles</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span>Projects:</span>
                    <span className="font-medium text-slate-800">{resume.projects?.length || 0}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Latest ATS Score:</span>
                    <span className="font-medium text-indigo-700">{resume.atsScore?.score ? `${resume.atsScore.score}/100` : 'Not checked'}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {!resume.isDefault && (
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleSetPrimary(resume._id)}>
                      Set Primary
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" className={resume.isDefault ? "w-full" : "px-3"} onClick={() => handleDelete(resume._id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
