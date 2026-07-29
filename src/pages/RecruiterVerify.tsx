import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Building2, Globe, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RecruiterVerify: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    companyWebsite: '',
    verificationDocUrl: ''
  });

  // Redirect if already verified or pending
  useEffect(() => {
    if (user?.recruiterProfile?.verificationStatus === 'pending') {
      toast.info('Your verification is already pending review.');
      navigate('/jobs');
    } else if (user?.recruiterProfile?.verificationStatus === 'verified') {
      toast.success('You are already a verified recruiter.');
      navigate('/jobs');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/recruiter/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification request failed');
      
      toast.success('Verification request submitted successfully!');
      navigate('/jobs');
      // In a real app, you might want to refresh the user context here
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Recruiter Verification</h1>
        <p className="text-gray-500 mt-2">Get a verified badge to build trust with candidates.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Provide details about your organization to get verified.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  className="pl-9" 
                  required 
                  placeholder="Acme Corp" 
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Company Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  className="pl-9" 
                  type="url"
                  required 
                  placeholder="https://acmecorp.com" 
                  value={formData.companyWebsite}
                  onChange={e => setFormData({...formData, companyWebsite: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Verification Document URL</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  className="pl-9" 
                  type="url"
                  required 
                  placeholder="Link to Business Registration, ID, or Proof of Employment" 
                  value={formData.verificationDocUrl}
                  onChange={e => setFormData({...formData, verificationDocUrl: e.target.value})}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Upload to a secure cloud drive (e.g. Google Drive) and paste the link here.</p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecruiterVerify;
