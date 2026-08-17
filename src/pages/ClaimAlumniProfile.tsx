import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ClaimAlumniProfile: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [registryInfo, setRegistryInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentRole, setCurrentRole] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [about, setAbout] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No claim token provided in the URL.");
      setLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await fetch(`${API_URL}/api/alumni/claim/${token}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Invalid or expired token.');
      }
      const data = await res.json();
      setRegistryInfo(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const authToken = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!authToken) {
      toast.error('You must be logged in to claim a profile.');
      navigate('/login?redirect=/claim-alumni?token=' + token);
      return;
    }

    const { value: proofDetails, isConfirmed } = await MySwal.fire({
      title: 'Verify Your Identity',
      html: `
        <div class="text-left space-y-4 mt-4 px-2">
          <p class="text-sm text-gray-600 mb-4 text-center">To maintain trust in our alumni network, please provide your Student ID, Graduation Roll Number, or a link to a credential proving your graduation.</p>
          <input id="swal-proof-input" class="swal2-input border-2 border-primary/20 rounded-xl focus:border-primary text-sm w-[90%] mx-auto block" placeholder="e.g. Roll No. 2019-XXX or Credential Link">
        </div>
      `,
      icon: 'info',
      iconColor: '#3b82f6',
      showCancelButton: true,
      confirmButtonText: 'Submit & Claim',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      customClass: {
        popup: 'rounded-2xl border-none shadow-2xl',
        title: 'text-2xl font-serif text-gray-800',
        confirmButton: 'rounded-xl px-6 py-2 font-medium',
        cancelButton: 'rounded-xl px-6 py-2 font-medium',
      },
      preConfirm: () => {
        const input = document.getElementById('swal-proof-input') as HTMLInputElement;
        if (!input.value.trim()) {
          Swal.showValidationMessage('Please provide your proof of identity');
        }
        return input.value;
      }
    });

    if (isConfirmed) {
      await performSubmit(proofDetails);
    }
  };

  const performSubmit = async (proofDetails: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/alumni/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          token,
          currentRole,
          currentCompany,
          about,
          linkedInUrl
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to claim profile.');
      }

      toast.success('Successfully claimed your Alumni profile!');
      navigate('/alumni/connections/hub');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      <main className="max-w-xl mx-auto p-4 md:p-6 mt-12 pb-20">
        <Card className="border-none shadow-md">
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-serif">Claim Your Alumni Profile</CardTitle>
            <CardDescription className="text-base mt-2">
              Complete your profile to connect with students and other alumni.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading details...</div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-medium text-destructive mb-2">Invalid Request</h3>
                <p className="text-muted-foreground">{error}</p>
                <Button className="mt-6" variant="outline" onClick={() => navigate('/alumni/connections/hub')}>
                  Go to Alumni Hub
                </Button>
              </div>
            ) : (
              <form onSubmit={handlePreSubmit} className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">Institutional Record</h3>
                  <p className="font-medium">{registryInfo?.collegeName}</p>
                  <p className="text-sm text-gray-600">
                    {registryInfo?.degree} in {registryInfo?.branch} • Class of {registryInfo?.graduationYear}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentRole">Current Role (Optional)</Label>
                    <Input 
                      id="currentRole" 
                      placeholder="e.g. Software Engineer" 
                      value={currentRole}
                      onChange={(e) => setCurrentRole(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currentCompany">Current Company (Optional)</Label>
                    <Input 
                      id="currentCompany" 
                      placeholder="e.g. Google" 
                      value={currentCompany}
                      onChange={(e) => setCurrentCompany(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedInUrl">LinkedIn URL (Optional)</Label>
                    <Input 
                      id="linkedInUrl" 
                      placeholder="https://linkedin.com/in/yourprofile" 
                      type="url"
                      value={linkedInUrl}
                      onChange={(e) => setLinkedInUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="about">About (Optional)</Label>
                    <Textarea 
                      id="about" 
                      placeholder="Share a bit about your journey since graduation..." 
                      rows={4}
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? 'Claiming Profile...' : 'Claim Profile'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
