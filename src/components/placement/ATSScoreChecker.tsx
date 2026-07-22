import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Info, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function ATSScoreChecker({ resumes, onResumesChange }) {
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [scoring, setScoring] = useState(false);
  
  const selectedResume = resumes.find(r => r._id === selectedResumeId);

  const handleScore = async () => {
    if (!selectedResumeId) return toast.error('Please select a resume first');
    
    setScoring(true);
    const toastId = toast.loading('Running ATS analysis...');
    
    try {
      const res = await fetch(`/api/resumes/${selectedResumeId}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ jobDescription })
      });
      
      if (res.ok) {
        toast.success('Analysis complete!', { id: toastId });
        onResumesChange(); // Refreshes the resumes list to pull new atsScore
      } else {
        toast.error('Failed to run analysis', { id: toastId });
      }
    } catch (error) {
      toast.error('Analysis error', { id: toastId });
    } finally {
      setScoring(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (!resumes || resumes.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center h-48 text-center text-slate-500 space-y-4">
          <FileText className="w-12 h-12 text-slate-300" />
          <p>Please upload a resume in the Manager tab first to use the ATS Checker.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Input Section */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>ATS Configuration</CardTitle>
            <CardDescription>Select a resume and optional job description to test keyword matching.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Resume Version</label>
              <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a resume" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map(r => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.title || 'Untitled'} {r.isDefault ? '(Primary)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Job Description (Optional)</label>
              <Textarea 
                placeholder="Paste the job description here for keyword match analysis..."
                className="h-48 resize-none"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleScore} 
              disabled={!selectedResumeId || scoring}
            >
              {scoring ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              {scoring ? 'Analyzing...' : 'Run ATS Scan'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-2">
        {!selectedResume ? (
          <Card className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-500 border-dashed border-2">
            <Info className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">No Resume Selected</h3>
            <p>Select a resume from the dropdown on the left and run a scan to see ATS compatibility results.</p>
          </Card>
        ) : !selectedResume.atsScore?.score ? (
          <Card className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-500 border-dashed border-2">
            <CheckCircle className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">Ready to Scan</h3>
            <p>Click "Run ATS Scan" to evaluate <strong>{selectedResume.title}</strong>.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex flex-col items-center justify-center w-40 h-40 rounded-full border-8 border-slate-100 relative">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="10"
                        className="text-slate-100"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="10"
                        strokeDasharray={`${selectedResume.atsScore.score * 2.827} 282.7`}
                        className={`${getProgressColor(selectedResume.atsScore.score)} transition-all duration-1000 ease-out`}
                      />
                    </svg>
                    <span className={`text-4xl font-bold ${getScoreColor(selectedResume.atsScore.score)}`}>
                      {selectedResume.atsScore.score}
                    </span>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">/ 100</span>
                  </div>
                  
                  <div className="flex-1 space-y-4 w-full">
                    <h3 className="text-xl font-bold text-slate-800">Score Breakdown</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(selectedResume.atsScore.breakdown || {}).map(([key, value]) => (
                        <div key={key} className="bg-slate-50 p-3 rounded-lg border">
                          <div className="text-xs text-slate-500 uppercase font-medium mb-1">{key.replace(/_/g, ' ')}</div>
                          <div className={`font-semibold ${value === 'Excellent' ? 'text-green-600' : value === 'Good' ? 'text-amber-500' : 'text-red-500'}`}>
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedResume.atsScore.jobDescriptionMatch && selectedResume.atsScore.jobDescriptionMatch.missingKeywords && selectedResume.atsScore.jobDescriptionMatch.missingKeywords.length > 0 && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
                        <h4 className="text-sm font-semibold text-red-800 flex items-center mb-2">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Missing Job Keywords
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedResume.atsScore.jobDescriptionMatch.missingKeywords.map((kw, i) => (
                            <span key={i} className="px-2 py-1 bg-white text-red-700 text-xs font-medium rounded border border-red-200">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actionable Tips</CardTitle>
                <CardDescription>Address these issues to improve your ATS compatibility.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedResume.atsScore.tips?.map((tip, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border flex gap-3 ${tip.severity === 'high' ? 'bg-red-50 border-red-100' : tip.severity === 'medium' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                      <div className="mt-0.5">
                        {tip.severity === 'high' ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <Info className={`w-5 h-5 ${tip.severity === 'medium' ? 'text-amber-500' : 'text-blue-500'}`} />}
                      </div>
                      <div>
                        <h4 className={`font-semibold ${tip.severity === 'high' ? 'text-red-800' : tip.severity === 'medium' ? 'text-amber-800' : 'text-blue-800'}`}>
                          {tip.issue}
                        </h4>
                        <p className="text-sm text-slate-700 mt-1">{tip.tip}</p>
                      </div>
                    </div>
                  ))}
                  {(!selectedResume.atsScore.tips || selectedResume.atsScore.tips.length === 0) && (
                    <div className="text-center p-6 text-slate-500 bg-slate-50 rounded-lg">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <p>Your resume looks great! No specific issues found.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
