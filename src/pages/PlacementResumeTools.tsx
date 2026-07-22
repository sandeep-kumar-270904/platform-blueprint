import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, CheckCircle, Lightbulb } from 'lucide-react';
import ResumeManager from '@/components/placement/ResumeManager';
import ATSScoreChecker from '@/components/placement/ATSScoreChecker';
import CompanyResumeTips from '@/components/placement/CompanyResumeTips';

export default function PlacementResumeTools() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const res = await fetch('/api/resumes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResumes(data);
      }
    } catch (error) {
      console.error('Error fetching resumes', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button 
          onClick={() => navigate('/placement')}
          className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Placement Cell
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Resume & ATS Tools</h1>
          <p className="text-slate-600">Manage your resumes, check ATS compatibility, and get company-specific advice.</p>
        </div>

        <Tabs defaultValue="manager" className="w-full space-y-6">
          <TabsList className="bg-white border p-1 rounded-xl w-full max-w-md h-12">
            <TabsTrigger value="manager" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 flex-1">
              <FileText className="w-4 h-4 mr-2" />
              Manager
            </TabsTrigger>
            <TabsTrigger value="ats" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 flex-1">
              <CheckCircle className="w-4 h-4 mr-2" />
              ATS Checker
            </TabsTrigger>
            <TabsTrigger value="tips" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 flex-1">
              <Lightbulb className="w-4 h-4 mr-2" />
              Company Tips
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manager" className="mt-0 outline-none">
            <ResumeManager resumes={resumes} onResumesChange={fetchResumes} loading={loading} />
          </TabsContent>

          <TabsContent value="ats" className="mt-0 outline-none">
            <ATSScoreChecker resumes={resumes} onResumesChange={fetchResumes} />
          </TabsContent>

          <TabsContent value="tips" className="mt-0 outline-none">
            <CompanyResumeTips />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
