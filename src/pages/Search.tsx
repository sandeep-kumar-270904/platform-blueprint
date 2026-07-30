import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { CollegeCard } from "@/components/colleges/CollegeCard";
import { EventCard } from "@/components/events/EventCard";
import { SkeletonCollegeCard } from "@/components/colleges/SkeletonCollegeCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Search as SearchIcon, Calendar, ArrowRight, BookOpen } from "lucide-react";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<{ colleges: any[]; events: any[]; courses: any[]; providers?: any[] }>({ colleges: [], events: [], courses: [] });
  
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
        setResults({ colleges: data.colleges || [], events: data.events || [], courses: data.courses || [], providers: data.providers || [] });
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
        ) : (results.colleges.length === 0 && results.events.length === 0 && results.courses.length === 0 && (!results.providers || results.providers.length === 0)) ? (
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

            {results.providers && results.providers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Local Services</h2>
                  <span className="text-sm text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md">{results.providers.length} found</span>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {results.providers.map(provider => (
                    <Card key={provider._id} className="hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full overflow-hidden" onClick={() => navigate(`/repair?provider=${provider._id}`)}>
                      <div className="h-32 bg-muted relative">
                        {provider.imageUrl ? (
                          <img src={provider.imageUrl} alt={provider.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                            <span className="text-muted-foreground capitalize font-medium">{provider.category}</span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                          <span className="text-amber-500">★</span> {provider.rating}
                        </div>
                      </div>
                      <CardContent className="p-4 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold line-clamp-1 flex-1">{provider.name}</h3>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mb-4">
                          <span className="capitalize">{provider.category}</span>
                        </div>
                        <div className="mt-auto pt-4 flex items-center text-primary font-medium text-sm">
                          View Details <ArrowRight className="h-4 w-4 ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {results.courses.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Courses & Learning Paths</h2>
                  <span className="text-sm text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md">{results.courses.length} found</span>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {results.courses.map(course => (
                    <Card key={course._id} className="hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full overflow-hidden" onClick={() => navigate(course.searchType === 'path' ? `/learning-paths/${course._id}` : `/courses/${course._id}`)}>
                      <div className="aspect-video bg-muted relative">
                        {course.thumbnailImage ? (
                          <img src={course.thumbnailImage} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                            <BookOpen className="h-12 w-12 opacity-50" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold uppercase">
                          {course.searchType === 'path' ? 'Learning Path' : 'Course'}
                        </div>
                      </div>
                      <CardContent className="p-5 flex flex-col flex-1">
                        <div className="text-xs text-primary font-semibold mb-2 uppercase tracking-wider">{course.category}</div>
                        <h3 className="font-bold text-lg mb-2 line-clamp-2">{course.title}</h3>
                        <div className="mt-auto pt-4 flex items-center justify-between text-sm text-muted-foreground">
                          {course.provider && <span>By {course.provider}</span>}
                          <span className="capitalize">{course.level || 'All Levels'}</span>
                        </div>
                      </CardContent>
                    </Card>
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
