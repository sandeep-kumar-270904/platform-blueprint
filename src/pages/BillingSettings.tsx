import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Star, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function BillingSettings() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // In a real app we'd fetch the user profile from context or an endpoint
    // For this prototype, we'll hit a generic profile endpoint if it exists
    api.get('/auth/me').then(res => setUser(res.data)).catch(() => {
        // mock
        setUser({ username: 'Test User', isPremium: false });
    });
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await api.post('/payments/create-checkout-session');
      window.location.href = res.data.url;
    } catch (e) {
      toast.error('Failed to initiate checkout');
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    toast.info('Redirecting to Stripe Customer Portal...');
    // Mock for now, would redirect to create-portal-session
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className={`w-5 h-5 ${user?.isPremium ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                Premium Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border flex items-center justify-between">
                <div>
                  <p className="font-semibold">{user?.isPremium ? 'Active Subscription' : 'Free Plan'}</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.isPremium ? 'You have access to all premium features.' : 'Upgrade to unlock advanced features.'}
                  </p>
                </div>
              </div>

              {!user?.isPremium ? (
                <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700" onClick={handleSubscribe} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Upgrade to Premium - $9.99/mo
                </Button>
              ) : (
                <Button variant="outline" className="w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950" onClick={handleCancel}>
                  Cancel Subscription
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Billing History
              </CardTitle>
              <CardDescription>Your recent transactions and receipts</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
                 No recent transactions found.
               </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
