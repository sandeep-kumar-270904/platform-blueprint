import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ShieldCheck, ShieldAlert, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const CertificationWallet = () => {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/certifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setCerts(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  const addCert = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/certifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: 'New Certification',
          issuer: 'Issuer',
          issueDate: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        fetchCerts();
        toast("Certification Added", {
          description: "Share this milestone with the community?",
          action: {
            label: "Share",
            onClick: () => navigate(`/community?template=achievement&prefill=I+just+earned+my+New+Certification+certification!`)
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteCert = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/certifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchCerts();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Certifications Wallet</h2>
          <p className="text-muted-foreground">Manage your verified certifications in one place.</p>
        </div>
        <Button onClick={addCert}><Plus className="h-4 w-4 mr-1" /> Add Certification</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certs.map(cert => (
          <Card key={cert._id}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <CardTitle className="text-lg">{cert.name}</CardTitle>
              {cert.verificationStatus === 'platform_verified' ? (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><ShieldCheck className="h-3 w-3 mr-1" /> Verified</Badge>
              ) : (
                <Badge variant="secondary"><ShieldAlert className="h-3 w-3 mr-1" /> Unverified</Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Issuer:</strong> {cert.issuer}</p>
                <p><strong>Issued:</strong> {new Date(cert.issueDate).toLocaleDateString()}</p>
                <div className="flex justify-end pt-4">
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCert(cert._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {certs.length === 0 && (
          <div className="col-span-full text-center py-12 border-2 border-dashed rounded-xl">
            <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold">No Certifications</h3>
            <p className="text-muted-foreground mb-4">Add your first certification to your wallet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
