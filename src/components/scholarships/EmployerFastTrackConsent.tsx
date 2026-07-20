import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Briefcase, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function EmployerFastTrackConsent({ scholarshipId, sponsorCompany }: { scholarshipId: string, sponsorCompany: string }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [consented, setConsented] = useState<boolean | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const checkConsent = async () => {
            if (!user) return;
            try {
                // Fetch the application for this user and scholarship to check fastTrackConsent
                const token = localStorage.getItem('token');
                const appsRes = await fetch(`${API_URL}/api/scholarships/applications`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (appsRes.ok) {
                    const apps = await appsRes.json();
                    const app = apps.find((a: any) => a.scholarshipId === scholarshipId || a.scholarshipId?._id === scholarshipId);
                    if (app && app.fastTrackConsent !== undefined) {
                        setConsented(app.fastTrackConsent);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        checkConsent();
    }, [user, scholarshipId]);

    const handleConsent = async (consent: boolean) => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/scholarships/${scholarshipId}/fast-track-consent`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ consent })
            });

            if (res.ok) {
                setConsented(consent);
                if (consent) {
                    toast.success(`You've been fast-tracked for opportunities at ${sponsorCompany}!`);
                }
            } else {
                toast.error("Failed to update consent preferences");
            }
        } catch (err) {
            console.error(err);
            toast.error("Network error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || consented !== null) {
        if (consented === true) {
            return (
                <div className="flex items-center gap-2 text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 p-3 rounded-md mb-6">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-sm font-medium">You have agreed to share your profile with {sponsorCompany}'s hiring team.</span>
                </div>
            );
        }
        return null;
    }

    return (
        <Card className="border-blue-500/30 bg-blue-50 dark:bg-blue-900/10 mb-6">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <Briefcase className="h-5 w-5" /> Fast-Track Career Opportunity
                </CardTitle>
                <CardDescription className="text-blue-600/80 dark:text-blue-400/80">
                    Congratulations on being awarded! {sponsorCompany} would like to consider you for their upcoming internship and early-career programs.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm mb-4">
                    Would you like to share your StudentHub profile and scholarship application with {sponsorCompany}'s hiring team? 
                    This is completely optional and will not affect your scholarship award.
                </p>
                <div className="flex flex-wrap gap-3">
                    <Button 
                        onClick={() => handleConsent(true)} 
                        disabled={submitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                        Yes, share my profile
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={() => handleConsent(false)}
                        disabled={submitting}
                        className="border-blue-200 hover:bg-blue-100 dark:border-blue-800 dark:hover:bg-blue-900/50"
                    >
                        No thanks
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
