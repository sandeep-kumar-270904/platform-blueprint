import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { CollegeCard } from "@/components/colleges/CollegeCard";
import { EventCard } from "@/components/events/EventCard";
import { SkeletonCollegeCard } from "@/components/colleges/SkeletonCollegeCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Search as SearchIcon, Calendar, ArrowRight } from "lucide-react";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<{ colleges: any[]; events: any[] }>({ colleges: [], events: [] });
  
  useEffect(() => {
    if (!query) {
      setResults({ colleges: [], events: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/search?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        setResults({ colleges: data.colleges || [], events: data.events || [] });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query]);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  
  const typeColorClass = (t: string) => {
    return t === 'hackathon' ? 'bg-blue-600 text-white' :
           t === 'competition' ? 'bg-orange-600 text-white' :
           t === 'workshop' ? 'bg-purple-600 text-white' :
           'bg-green-600 text-white';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8 border-b pb-6">
          <h1 className="text-3xl font-bold mb-2">Search Results</h1>
          {query ? (
            <p className="text-muted-foreground">Showing results for "<span className="font-medium text-foreground">{query}</span>"</p>
          ) : (
            <p className="text-muted-foreground">Enter a search term in the navigation bar to find colleges and events.</p>
          )}
        </div>

        {loading ? (
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-bold mb-6">Colleges</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => <SkeletonCollegeCard key={i} />)}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-6">Events</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-40 bg-muted"></div>
                    <CardHeader><div className="h-6 bg-muted rounded w-3/4"></div></CardHeader>
                    <CardContent className="space-y-3">
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : !query ? (
          <div className="text-center py-20 text-muted-foreground border rounded-lg border-dashed">
            <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Ready to search.</p>
          </div>
        ) : (results.colleges.length === 0 && results.events.length === 0) ? (
          <div className="text-center py-24 text-muted-foreground border rounded-lg border-dashed">
            <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No results for "{query}"</h3>
            <p className="mb-6">We couldn't find anything matching your search. Try adjusting your spelling or searching for something else.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => navigate('/college-insights')} className="flex items-center gap-2 hover:text-primary transition-colors">
                Browse Colleges <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => navigate('/events')} className="flex items-center gap-2 hover:text-primary transition-colors">
                Browse Events <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {results.colleges.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Colleges</h2>
                  <span className="text-sm text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md">{results.colleges.length} found</span>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {results.colleges.map(college => (
                    <CollegeCard 
                      key={college._id} 
                      college={{...college, id: college._id}} 
                      onClick={() => navigate(`/college-insights/${college._id}`)} 
                    />
                  ))}
                </div>
              </div>
            )}

            {results.events.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Events</h2>
                  <span className="text-sm text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md">{results.events.length} found</span>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {results.events.map(event => (
                    <EventCard 
                      key={event._id} 
                      event={{...event, id: event._id}} 
                      registered={false} // Would need a hook to check, but search view can just hide it or say "See details"
                      fmtDate={fmtDate} 
                      typeColorClass={typeColorClass}
                      onClick={() => navigate(`/events/${event._id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
