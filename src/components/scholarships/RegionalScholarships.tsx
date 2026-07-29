import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const RegionalScholarships = () => {
  const { user } = useAuth();
  const [location, setLocation] = useState(user?.location || '');
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (user?.location) {
      fetchRegional(user.location);
    }
  }, [user]);

  const fetchRegional = async (locQuery: string) => {
    if (!locQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`${API_URL}/api/scholarships/regional/near-you?zipCode=${encodeURIComponent(locQuery)}`);
      if (res.ok) {
        setScholarships(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRegional(location);
  };

  if (!searched && !user?.location) {
    return (
      <Card className="mb-8 border-primary/20 shadow-sm bg-gradient-to-r from-background to-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Scholarships Near You
              </h3>
              <p className="text-sm text-muted-foreground">
                Enter your ZIP code or city to find local and regional opportunities with less competition.
              </p>
            </div>
            <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-2">
              <Input 
                placeholder="ZIP Code or City" 
                value={location} 
                onChange={e => setLocation(e.target.value)}
                className="bg-background"
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Find'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" /> Near You
          </h2>
          <p className="text-sm text-muted-foreground">Local opportunities matching: <strong>{location}</strong></p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input 
            placeholder="Change location..." 
            value={location} 
            onChange={e => setLocation(e.target.value)}
            className="w-40 md:w-48 bg-background"
          />
          <Button type="submit" variant="outline" size="icon" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          </Button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : scholarships.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
          <CardContent>
            <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No local scholarships found for this area right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scholarships.slice(0, 3).map(s => (
            <Card key={s._id} className="flex flex-col border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="text-lg line-clamp-2">{s.title}</CardTitle>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                    Regional
                  </Badge>
                  {s.competitionSignal && (
                    <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                      {s.competitionSignal.label}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                <div className="text-2xl font-bold text-primary mb-2">
                  ${s.amount?.toLocaleString() || "Varies"}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button asChild className="w-full" variant="outline">
                  <Link to={`/scholarships/${s._id}`}>
                    View Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
