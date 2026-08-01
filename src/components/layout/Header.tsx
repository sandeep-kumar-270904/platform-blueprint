import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger
} from "@/components/ui/navigation-menu";
import { Building2, Search, Sun, Moon, Calendar, MapPin, UserPlus, UsersRound, BookOpen, MessageCircle, Wrench, Star, GraduationCap, X, Menu, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useSiteContent } from "@/hooks/useSiteContent";

const defaultNavigationGroups = [
  {
    title: "Academic & Career",
    items: [
      { title: "Notes Hub", href: "/notes", desc: "Share and access study materials" },
      { title: "Resume Builder", href: "/resume-builder", desc: "ATS-optimized resume tips" },
      { title: "College Insights", href: "/college-insights", desc: "Reviews and comparisons" },
      { title: "Innovation Hub", href: "/innovation-hub", desc: "Startup ideas and pitches" },
      { title: "Events & Hackathons", href: "/events", desc: "Competitions and workshops" },
      { title: "Scholarships", href: "/scholarships", desc: "Find funding opportunities" },
      { title: "Courses & Internships", href: "/courses", desc: "Learning resources" },
      { title: "Roadmaps", href: "/roadmaps", desc: "Career path guidance" },
      { title: "Mentors", href: "/mentors", desc: "Book guidance sessions" },
      { title: "Community Forum", href: "/community", desc: "Ask and discuss" },
      { title: "Jobs Portal", href: "/jobs", desc: "Career opportunities" },
      { title: "Placement Cell", href: "/placement", desc: "Interview prep resources" },
      { title: "Admin Panel", href: "/admin", desc: "Platform management" },
    ],
  },
  {
    title: "Learning & Skills",
    items: [
      { title: "Quiz & Tests", href: "/quizzes", desc: "Mock exams and practice" },
      { title: "Tech News", href: "/news", desc: "Latest AI and tech updates" },
      { title: "Virtual Classroom", href: "/classrooms", desc: "Live learning sessions" },
      { title: "Analytics", href: "/analytics", desc: "Your study stats" },
    ],
  },
  {
    title: "Collaboration",
    items: [
      { title: "Study Groups", href: "/study-groups", desc: "Virtual study rooms" },
      { title: "Team Hunt", href: "/team-hunt", desc: "Find collaborators" },
      { title: "Skill Swap", href: "/skill-swap", desc: "Exchange knowledge" },
      { title: "Scholarship Community", href: "/scholarships/community", desc: "Coach, Buddies & Circles" },
      { title: "Creators Zone", href: "/creators", desc: "Content platform" },
      { title: "Q&A Board", href: "/qa-board", desc: "Stack Overflow style" },
      { title: "Forum", href: "/forum", desc: "Discussion threads" },
    ],
  },
  {
    title: "Engagement",
    items: [
      { title: "Daily Hacks", href: "/daily-hacks", desc: "Tips and showcases" },
      { title: "Wellness Tracker", href: "/wellness", desc: "Mental health support" },
    ],
  },
  {
    title: "Local Services",
    items: [
      { title: "Room Rentals", href: "/room-rentals", desc: "Find accommodation" },
      { title: "Hostel Info", href: "/hostels", desc: "Campus housing" },
      { title: "Repair Services", href: "/repair", desc: "Maintenance help" },
      { title: "Find Roommate", href: "/roommate-finder", desc: "Connect with peers" },
    ],
  },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: siteData } = useSiteContent();
  
  const isUserAdmin = user?.role === 'admin' || user?.adminRole === 'super_admin' || user?.adminRole === 'moderator' || (user?.email && ['admin@studenthub.com'].includes(user.email));
  
  const rawGroups = siteData?.navigation?.groups?.length >= 2 ? siteData.navigation.groups : defaultNavigationGroups;
  const navigationGroups = rawGroups.map((group: any) => ({
    ...group,
    items: group.items.filter((item: any) => item.title !== "Admin Panel" || isUserAdmin)
  })).filter((group: any) => group.items.length > 0);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches;
        setIsDarkMode(newTheme);
        if (newTheme) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    if (!localStorage.getItem('theme')) {
      const isSystemDark = mediaQuery.matches;
      if (isSystemDark !== isDarkMode) {
        setIsDarkMode(isSystemDark);
        if (isSystemDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }
    }
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{colleges: any[], events: any[], courses: any[], posts?: any[], tags?: any[], providers?: any[], roommateProfiles?: any[], roommateGroups?: any[]}>({ colleges: [], events: [], courses: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults({ colleges: [], events: [], courses: [] });
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.json())
      .then(data => setSearchResults({ 
        colleges: data.colleges || [], 
        events: data.events || [], 
        courses: data.courses || [], 
        posts: data.posts, 
        tags: data.tags, 
        providers: data.providers,
        roommateProfiles: data.roommateProfiles || [],
        roommateGroups: data.roommateGroups || []
      }))
      .catch(console.error)
      .finally(() => setIsSearching(false));
  }, [debouncedQuery]);

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowSearchDropdown(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {user && user.isEmailVerified === false && !bannerDismissed && (
        <div className="bg-[var(--gold-light)] border-b border-[var(--gold)] py-2 px-4 text-center text-sm font-medium text-[var(--ink-deep)] flex items-center justify-center relative">
          <span>Please verify your email address to unlock all platform features. A link was sent during registration.</span>
          <button 
            onClick={() => setBannerDismissed(true)} 
            className="absolute right-4 p-1 hover:bg-black/5 rounded-full transition-colors"
            title="Dismiss for this session"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <header className={cn(
        "navbar transition-all duration-300",
        isScrolled ? "py-0 shadow-sm" : "py-2"
      )}>
      <div className="container mx-auto flex h-16 items-center justify-between gap-8">
        <div className="flex-1 flex justify-start min-w-max">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="icon-box bg-[var(--ink)] text-white shadow-sm transition-all group-hover:scale-110">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-foreground display-font tracking-tight">
              StudentHub
            </span>
          </Link>
        </div>

        <nav className="hidden lg:flex justify-center">
          <NavigationMenu delayDuration={200}>
            <NavigationMenuList className="flex gap-6 lg:gap-8">
              {navigationGroups.map((group) => (
                <NavigationMenuItem key={group.title}>
                  <NavigationMenuTrigger className="text-sm font-medium h-8 bg-transparent hover-underline">
                    {group.title}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[600px] gap-3 p-6 md:grid-cols-2">
                      {group.items.map((item) => (
                        <li key={item.href}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={item.href}
                              className={cn(
                                "flex items-start gap-3 select-none rounded-lg p-3 no-underline outline-none transition-all hover:bg-muted hover:text-primary active:scale-[0.98] group relative hover-underline",
                                location.pathname === item.href && "bg-muted text-primary"
                              )}
                            >
                              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background shadow-sm border border-border">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="text-sm font-semibold leading-none display-font">
                                  {item.title}
                                </p>
                                <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                                  {item.desc}
                                </p>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        <div className="flex-1 flex items-center justify-end gap-3 min-w-max">
          {location.pathname !== '/' && (
            <div className="relative hidden md:block w-48 lg:w-64" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search colleges, events..." 
              className="pl-9 h-9 bg-muted/50 border-transparent focus-visible:bg-background"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              onKeyDown={handleSearchSubmit}
            />
            {showSearchDropdown && searchQuery && (
              <div className="absolute top-full mt-2 w-80 lg:w-96 right-0 bg-popover text-popover-foreground rounded-lg shadow-lg border p-2 z-50 flex flex-col gap-2">
                {isSearching ? (
                  <div className="p-4 flex justify-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : (
                  <>
                    {(searchQuery.toLowerCase().includes('roommate') || searchQuery.toLowerCase().includes('flatmate') || searchQuery.toLowerCase().includes('connections')) && (
                      <div className="space-y-1 mb-2">
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Links</div>
                        <div onClick={() => { setShowSearchDropdown(false); navigate('/roommates'); }} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors">
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center"><UserPlus className="h-4 w-4 text-primary" /></div>
                          <div className="text-sm font-medium">Find Roommates</div>
                        </div>
                        <div onClick={() => { setShowSearchDropdown(false); navigate('/roommates/connections'); }} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors">
                          <div className="h-8 w-8 rounded bg-indigo-500/10 flex items-center justify-center"><UsersRound className="h-4 w-4 text-indigo-500" /></div>
                          <div className="text-sm font-medium">My Connections</div>
                        </div>
                      </div>
                    )}

                    {searchResults.colleges.length > 0 && (
                      <div className="space-y-1">
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Colleges</div>
                        {searchResults.colleges.slice(0, 5).map(college => (
                          <div 
                            key={college._id} 
                            onClick={() => { setShowSearchDropdown(false); navigate(`/college-insights/${college._id}`); }}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                          >
                            {college.imageUrl ? (
                              <img src={college.imageUrl} alt={college.name} className="h-8 w-8 rounded object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><Building2 className="h-4 w-4 opacity-50" /></div>
                            )}
                            <div className="overflow-hidden">
                              <div className="text-sm font-medium truncate">{college.name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {college.location?.city}, {college.location?.state}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {searchResults.events.length > 0 && (
                      <div className="space-y-1">
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Events</div>
                        {searchResults.events.slice(0, 5).map(event => (
                          <div 
                            key={event._id} 
                            onClick={() => { setShowSearchDropdown(false); navigate(`/events/${event._id}`); }}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                          >
                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-primary" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-sm font-medium truncate">{event.title}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {new Date(event.startDate).toLocaleDateString()} • <span className="capitalize">{event.eventType}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.courses?.length > 0 && (
                      <div className="space-y-1 mt-2">
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Courses</div>
                        {searchResults.courses.slice(0, 3).map(course => (
                          <div 
                            key={course._id} 
                            onClick={() => { setShowSearchDropdown(false); navigate(course.searchType === 'path' ? `/learning-paths/${course._id}` : `/courses/${course._id}`); }}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                          >
                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                              <BookOpen className="h-4 w-4 text-primary" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-sm font-medium truncate">{course.title}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {course.searchType === 'path' ? 'Learning Path' : course.provider || 'Course'} • <span className="capitalize">{course.category}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.posts?.length > 0 && (
                      <div className="space-y-1 mt-2">
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Community Posts</div>
                        {searchResults.posts.slice(0, 3).map(post => (
                          <div 
                            key={post._id} 
                            onClick={() => { setShowSearchDropdown(false); navigate(`/community`); }}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                          >
                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                              <MessageCircle className="h-4 w-4 text-primary" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-sm font-medium truncate">{post.content}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                By {post.user_id?.full_name || 'Anonymous'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {searchResults.providers?.length > 0 && (
                      <div className="space-y-1 mt-2 flex flex-col gap-1 px-2 pb-2">
                        <div className="w-full py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Local Services</div>
                        {searchResults.providers.slice(0, 3).map(provider => (
                          <div 
                            key={provider._id} 
                            onClick={() => { setShowSearchDropdown(false); navigate(`/repair?provider=${provider._id}`); }}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                          >
                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                              <Wrench className="h-4 w-4 text-primary" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-sm font-medium truncate">{provider.name}</div>
                              <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                {provider.category} • <Star className="h-3 w-3 fill-amber-400 text-amber-400 inline"/> {provider.rating}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {searchResults.tags?.length > 0 && (
                      <div className="space-y-1 mt-2 flex flex-wrap gap-1 px-2 pb-2">
                        <div className="w-full py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</div>
                        {searchResults.tags.map(tag => (
                          <div 
                            key={tag} 
                            onClick={() => { setShowSearchDropdown(false); navigate(`/community?tag=${tag}`); }}
                            className="bg-secondary/50 text-xs px-2 py-1 rounded-full cursor-pointer hover:bg-secondary transition-colors"
                          >
                            #{tag}
                          </div>
                        ))}
                      </div>
                    )}

                    {(searchResults.roommateProfiles?.length > 0 || searchResults.roommateGroups?.length > 0) && (
                      <div className="space-y-1 mt-2">
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Roommate Finder</div>
                        
                        {searchResults.roommateProfiles?.slice(0, 3).map(profile => (
                          <div 
                            key={profile._id} 
                            onClick={() => { setShowSearchDropdown(false); navigate(`/roommates?profile=${profile._id}`); }}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                          >
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                              {profile.user?.avatar_url || profile.user?.profilePicture ? (
                                <img src={profile.user.avatar_url || profile.user.profilePicture} alt="User" className="h-full w-full object-cover" />
                              ) : (
                                <UserPlus className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-sm font-medium truncate">{profile.user?.name || profile.user?.full_name || 'Roommate'}</div>
                              <div className="text-xs text-muted-foreground truncate">{profile.bio || `Budget: $${profile.budgetRange?.max || 0}`}</div>
                            </div>
                          </div>
                        ))}

                        {searchResults.roommateGroups?.slice(0, 2).map(group => (
                          <div 
                            key={group._id} 
                            onClick={() => { setShowSearchDropdown(false); navigate(`/roommates?group=${group._id}`); }}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                          >
                            <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                              <UsersRound className="h-4 w-4 text-indigo-500" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-sm font-medium truncate">{group.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{group.status} • {group.targetSize} members</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {searchResults.colleges.length === 0 && searchResults.events.length === 0 && (!searchResults.courses || searchResults.courses.length === 0) && (!searchResults.posts || searchResults.posts.length === 0) && (!searchResults.roommateProfiles || searchResults.roommateProfiles.length === 0) && (!searchResults.roommateGroups || searchResults.roommateGroups.length === 0) ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">No results for "{searchQuery}"</div>
                    ) : (
                      <div 
                        className="p-2 mt-1 text-center text-sm text-primary font-medium hover:underline cursor-pointer border-t"
                        onClick={() => { setShowSearchDropdown(false); navigate(`/search?q=${encodeURIComponent(searchQuery)}`); }}
                      >
                        See all results for "{searchQuery}"
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          )}

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            className="hidden sm:inline-flex mr-1"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user ? (
            <>
              <NotificationBell />
            </>
          ) : (
            <Link to="/auth">
              <Button className="hidden sm:inline-flex whitespace-nowrap">Sign In</Button>
            </Link>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            className="sm:hidden"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border/40 bg-background/95 backdrop-blur-xl lg:hidden max-h-[80vh] overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            {navigationGroups.map((group) => (
              <div key={group.title} className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                  {group.title}
                </h3>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "block rounded-lg p-3 transition-all hover:bg-accent/50",
                          location.pathname === item.href && "bg-accent/30"
                        )}
                      >
                        <div className="font-medium">{item.title}</div>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {user ? (
              <div className="flex flex-col gap-2 pt-4 border-t border-border/40">
                <Button variant="outline" className="w-full justify-center gap-2" onClick={toggleTheme}>
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-4 border-t border-border/40">
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full justify-center">Sign In</Button>
                </Link>
                <Button variant="outline" className="w-full justify-center gap-2" onClick={toggleTheme}>
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
    </>
  );
};

export default Header;
