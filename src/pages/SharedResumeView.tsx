import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Lock } from 'lucide-react';
import { ResumePDF } from '@/components/resume/PDFRenderer';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SharedResumeView = () => {
  const { linkId } = useParams();
  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);

  useEffect(() => {
    fetchSharedResume();
  }, [linkId]);

  const fetchSharedResume = async (pwd?: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/resumes/shared/${linkId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
      });
      const data = await res.json();
      
      if (res.status === 401) {
        setIsPasswordRequired(true);
        setLoading(false);
        return;
      }
      
      if (!res.ok) throw new Error(data.message || 'Failed to load resume');
      
      setResume(data.resume);
      setIsPasswordRequired(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSharedResume(password);
  };

  const trackExport = async () => {
    try {
      await fetch(`${API_URL}/api/resumes/shared/${linkId}/export`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to track export', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isPasswordRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-center">Password Protected</CardTitle>
            <CardDescription className="text-center">
              This resume requires a password to view.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input 
                type="password" 
                placeholder="Enter password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full">Unlock</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Resume Not Found</h2>
        <p className="text-gray-500">{error || 'This link may have expired or does not exist.'}</p>
        <Button asChild variant="outline">
          <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" /> Return Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="font-bold text-lg">{resume.personalInfo?.fullName}'s Resume</h1>
          {resume.showAtsScore && resume.atsScore && (
            <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded font-medium ml-2">
              ATS Score: {resume.atsScore.score}
            </span>
          )}
        </div>
        <div className="flex gap-4">
          <PDFDownloadLink
            document={<ResumePDF resume={resume} />}
            fileName={`${resume.personalInfo?.fullName?.replace(/\s+/g, '_')}_Resume.pdf`}
            onClick={() => trackExport()}
          >
            {({ loading }) => (
              <Button disabled={loading}>
                {loading ? 'Preparing...' : 'Download PDF'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>
      
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto h-[80vh] shadow-xl rounded-lg overflow-hidden bg-white">
          <PDFViewer width="100%" height="100%" className="border-none">
            <ResumePDF resume={resume} />
          </PDFViewer>
        </div>
      </div>
    </div>
  );
};

export default SharedResumeView;
