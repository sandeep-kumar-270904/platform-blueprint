import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export const MenteeSubscription = () => {
  const [loading, setLoading] = useState(true);
  const [currentTier, setCurrentTier] = useState<'free' | 'plus' | 'pro'>('free');
  const [upgrading, setUpgrading] = useState(false);
  const { toast } = useToast();

  const fetchStatus = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/subscriptions/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentTier(data.subscriptionTier);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleUpgrade = async (tier: 'plus' | 'pro') => {
    setUpgrading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/api/subscriptions/create-checkout-session`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tier })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({ title: "Success", description: data.message });
        setCurrentTier(tier); // Optimistic update
        await fetchStatus();
      } else {
        toast({ title: "Error", description: data.message || "Failed to upgrade", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const plans = [
    {
      name: "Free",
      id: "free",
      price: "$0",
      description: "Basic access to mentorship.",
      features: ["Standard mentor search", "Basic messaging", "Pay full session fees"],
      icon: <Star className="h-5 w-5 text-muted-foreground" />,
    },
    {
      name: "Plus",
      id: "plus",
      price: "$9.99/mo",
      description: "For active learners.",
      features: ["Priority search ranking", "5% off all mentor sessions", "Early access to slots", "Advanced analytics"],
      icon: <Zap className="h-5 w-5 text-blue-500" />,
      popular: true,
    },
    {
      name: "Pro",
      id: "pro",
      price: "$19.99/mo",
      description: "Ultimate growth acceleration.",
      features: ["Top priority search ranking", "15% off all mentor sessions", "VIP early slots access", "Direct intro requests"],
      icon: <Star className="h-5 w-5 text-purple-500 fill-purple-500" />,
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upgrade Your Plan</h2>
        <p className="text-muted-foreground">Unlock priority features and session discounts.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isActive = currentTier === plan.id;
          return (
            <Card key={plan.id} className={`relative flex flex-col ${isActive ? 'border-primary shadow-sm' : ''} ${plan.popular && !isActive ? 'border-blue-200' : ''}`}>
              {isActive && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <Badge className="bg-primary hover:bg-primary uppercase tracking-wider text-[10px] font-bold">Current Plan</Badge>
                </div>
              )}
              {plan.popular && !isActive && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 uppercase tracking-wider text-[10px] font-bold">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    {plan.icon} {plan.name}
                  </CardTitle>
                </div>
                <CardDescription className="pt-2">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={isActive ? "outline" : (plan.popular ? "default" : "secondary")}
                  disabled={isActive || upgrading}
                  onClick={() => plan.id !== 'free' ? handleUpgrade(plan.id as 'plus'|'pro') : undefined}
                >
                  {isActive ? "Active" : `Upgrade to ${plan.name}`}
                  {upgrading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
