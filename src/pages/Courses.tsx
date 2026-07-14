import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Clock, Users, Star, Award, Layers, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import debounce from "lodash/debounce";

const Courses = () => {
  const [activeTab, setActiveTab] = useState("courses");
  
  // URL state sync
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || "");
  const [category, setCategory] = useState(searchParams.get('category') || "All");
  const [level, setLevel] = useState(searchParams.get('level') || "All");
  const [provider, setProvider] = useState(searchParams.get('provider') || "All");
  const [price, setPrice] = useState(searchParams.get('price') || "All");
  const [sort, setSort] = useState(searchParams.get('sort') || "newest");
  const [localSearch, setLocalSearch] = useState(search);

  // Sync state to URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category !== 'All') params.set('category', category);
    if (level !== 'All') params.set('level', level);
    if (provider !== 'All') params.set('provider', provider);
    if (price !== 'All') params.set('price', price);
    if (sort !== 'newest') params.set('sort', sort);
    setSearchParams(params, { replace: true });
  }, [search, category, level, provider, price, sort, setSearchParams]);

  const debouncedSetSearch = useCallback(
    debounce((value) => setSearch(value), 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  const clearFilters = () => {
    setLocalSearch("");
    setSearch("");
    setCategory("All");
    setLevel("All");
    setProvider("All");
    setPrice("All");
    setSort("newest");
  };

  const hasActiveFilters = localSearch || category !== "All" || level !== "All" || provider !== "All" || price !== "All" || sort !== "newest";

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses', search, category, level, sort],
    queryFn: async () => {
      let url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/courses?limit=100`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (category !== 'All') url += `&category=${encodeURIComponent(category)}`;
      if (level !== 'All') url += `&level=${encodeURIComponent(level)}`;
      if (sort !== 'newest') url += `&sort=${encodeURIComponent(sort)}`;
      // Provider and Price filtering are handled on frontend since backend doesn't support them out of the box right now
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    }
  });

  const { data: paths, isLoading: pathsLoading } = useQuery({
    queryKey: ['learning-paths'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/learning-paths`);
      if (!res.ok) throw new Error('Failed to fetch learning paths');
      return res.json();
    }
  });

  // Client-side filtering for Provider and Price (as backend only handles specific ones)
  let filteredCourses = coursesData?.courses || [];
  if (provider !== 'All') {
    filteredCourses = filteredCourses.filter((c: any) => c.provider === provider);
  }
  if (price !== 'All') {
    filteredCourses = filteredCourses.filter((c: any) => 
      price === 'Free' ? c.price === 0 : c.price > 0
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="accent" className="mb-6">
                  <BookOpen className="mr-1 h-3 w-3" />
                  Learn New Skills
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Online{" "}
                  <span className="text-foreground display-font">
                    Courses & Workshops
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Upskill with industry-relevant courses, curated learning paths, and earn certifications.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="courses">Browse Courses</TabsTrigger>
              <TabsTrigger value="paths">Learning Paths</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="courses" className="mt-0">
            <ScrollReveal delay={0.1}>
              <div className="mb-8 flex flex-col gap-4">
                <div className="flex flex-col xl:flex-row items-center justify-between gap-4 border-b border-border/50 pb-4">
                  {/* Left: Search Bar */}
                  <div className="relative w-full xl:w-[380px] shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for courses..."
                      value={localSearch}
                      onChange={handleSearchChange}
                      className="pl-10 h-12 text-md bg-background"
                    />
                    {localSearch && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleSearchChange({ target: { value: '' } } as any)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Right: Filters and Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-3 flex-1 w-full">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className={`w-[140px] h-11 ${category !== 'All' ? 'bg-primary/10 border-primary/30 text-primary font-medium' : ''}`}>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Categories</SelectItem>
                        <SelectItem value="Web Development">Web Development</SelectItem>
                        <SelectItem value="AI/ML">AI/ML</SelectItem>
                        <SelectItem value="Cybersecurity">Cybersecurity</SelectItem>
                        <SelectItem value="Data Science">Data Science</SelectItem>
                        <SelectItem value="Cloud">Cloud</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger className={`w-[140px] h-11 ${level !== 'All' ? 'bg-primary/10 border-primary/30 text-primary font-medium' : ''}`}>
                        <SelectValue placeholder="Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Levels</SelectItem>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={provider} onValueChange={setProvider}>
                      <SelectTrigger className={`w-[140px] h-11 ${provider !== 'All' ? 'bg-primary/10 border-primary/30 text-primary font-medium' : ''}`}>
                        <SelectValue placeholder="Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Providers</SelectItem>
                        <SelectItem value="Coursera">Coursera</SelectItem>
                        <SelectItem value="YouTube">YouTube</SelectItem>
                        <SelectItem value="freeCodeCamp">freeCodeCamp</SelectItem>
                        <SelectItem value="Udemy">Udemy</SelectItem>
                        <SelectItem value="Internal">Internal</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={price} onValueChange={setPrice}>
                      <SelectTrigger className={`w-[140px] h-11 ${price !== 'All' ? 'bg-primary/10 border-primary/30 text-primary font-medium' : ''}`}>
                        <SelectValue placeholder="Price" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">Any Price</SelectItem>
                        <SelectItem value="Free">Free</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sort} onValueChange={setSort}>
                      <SelectTrigger className="w-[140px] h-11 bg-background">
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="enrollments">Most Enrolled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    {!coursesLoading && (
                      <span>Showing <strong className="text-foreground">{filteredCourses.length}</strong> courses</span>
                    )}
                  </div>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground">
                      Clear filters
                    </Button>
                  )}
                </div>
              </div>
            </ScrollReveal>

            {coursesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="h-[300px]">
                    <CardHeader><Skeleton className="h-6 w-3/4 mb-2"/><Skeleton className="h-4 w-1/2"/></CardHeader>
                    <CardContent><Skeleton className="h-20 w-full"/></CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <EmptyState icon={BookOpen} title="No Courses Found" description="Try adjusting your filters or search query." action={{ label: "Clear Filters", onClick: clearFilters }} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course: any, index: number) => (
                  <ScrollReveal key={course._id} delay={0.05 * (index % 10)}>
                    <Card className="hover-scale flex flex-col h-full bg-card/60 backdrop-blur border-border/50 shadow-sm hover:shadow-md transition-all">
                      {course.thumbnailImage && (
                        <div className="w-full h-40 overflow-hidden rounded-t-xl shrink-0">
                          <img src={course.thumbnailImage} alt={course.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                        </div>
                      )}
                      <CardHeader className={course.thumbnailImage ? "pt-4 pb-2" : "pb-2"}>
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant={course.price === 0 ? "secondary" : "default"} className="font-semibold">
                            {course.price === 0 ? "Free" : `$${course.price}`}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{course.level}</Badge>
                        </div>
                        <h3 className="text-lg font-bold line-clamp-2 leading-tight">{course.title}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] uppercase bg-muted/50">{course.category}</Badge>
                          <span className="truncate">{course.provider}</span>
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-3 flex-grow pt-2">
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{course.duration}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground font-medium">
                            <Users className="h-3.5 w-3.5" />
                            <span>{course.totalEnrollments || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                          <span className="font-bold text-sm">{course.rating?.toFixed(1) || "New"}</span>
                          {course.totalRatings > 0 && <span className="text-xs text-muted-foreground">({course.totalRatings})</span>}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button asChild className="w-full gap-2">
                          <Link to={`/courses/${course._id}`}>
                            <BookOpen className="h-4 w-4" />
                            View Course
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="paths" className="mt-0">
            {pathsLoading ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="h-[250px]"><CardContent className="pt-6"><Skeleton className="h-32 w-full"/></CardContent></Card>
                ))}
              </div>
            ) : !paths || paths.length === 0 ? (
              <EmptyState icon={Layers} title="No Learning Paths" description="Curated paths will appear here soon." />
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                {paths.map((path: any, index: number) => (
                  <ScrollReveal key={path._id} delay={0.1 * index}>
                    <Card className="hover-scale overflow-hidden flex flex-col h-full shadow-md border-border/60">
                      <div className="w-full h-48 shrink-0 relative overflow-hidden group">
                        <img src={path.thumbnailImage} alt={path.title} className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10" />
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          <Badge className="bg-primary hover:bg-primary text-white mb-2">{path.level}</Badge>
                          <h3 className="text-2xl font-bold leading-tight">{path.title}</h3>
                        </div>
                      </div>
                      <div className="flex flex-col flex-grow p-6">
                        <Badge variant="outline" className="w-max mb-3">{path.category}</Badge>
                        <p className="text-sm font-semibold text-primary mb-2">{path.goal}</p>
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-grow">
                          {path.description}
                        </p>
                        <div className="flex items-center justify-between text-sm font-medium mb-6 bg-muted/30 p-3 rounded-lg border border-border/50">
                          <div className="flex items-center gap-1.5">
                            <Layers className="h-4 w-4 text-primary" />
                            <span>{path.courseIds?.length || 0} Courses</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{path.estimatedDuration}</span>
                          </div>
                        </div>
                        <Button asChild className="w-full mt-auto shadow-sm">
                          <Link to={`/learning-paths/${path._id}`}>Explore Path</Link>
                        </Button>
                      </div>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Courses;
