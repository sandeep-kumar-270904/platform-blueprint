import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle, FileText, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ATSChecker: React.FC = () => {
  const navigate = useNavigate();
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCheck = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      toast.error('Please provide both resume text and job description.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/resumes/ats-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ resumeText, jobDescription })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'ATS Check failed');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ATS Resume Checker</h1>
          <p className="text-gray-500">Paste your resume and the job description to see how well they match.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" /> Resume Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste the text of your resume here..."
              className="min-h-[300px]"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-500" /> Job Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste the job description here..."
              className="min-h-[300px]"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex justify-center">
        <Button size="lg" className="px-8 bg-[#0073b1] hover:bg-[#005582] text-white" onClick={handleCheck} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Match'}
        </Button>
      </div>

      {result && (
        <Card className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>How well your resume matches the job requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className={`text-5xl font-bold ${getScoreColor(result.score)}`}>
                  {result.score}%
                </div>
                <p className="text-sm text-gray-500 mt-2 font-medium uppercase tracking-wider">Match Score</p>
              </div>
              
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-green-600 mb-3">
                    <CheckCircle2 className="h-5 w-5" /> Matched Keywords
                  </h3>
                  {result.matchedKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {result.matchedKeywords.map((kw: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm capitalize">
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No matching keywords found.</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-red-600 mb-3">
                    <AlertCircle className="h-5 w-5" /> Missing Keywords
                  </h3>
                  {result.missingKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {result.missingKeywords.map((kw: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm capitalize">
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Great job! You hit all the detected keywords.</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ATSChecker;
