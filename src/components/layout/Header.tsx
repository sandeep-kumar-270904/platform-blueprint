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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Building2, Search, Sun, Moon, Calendar, MapPin, UserPlus, UsersRound, BookOpen, MessageCircle, Wrench, Star, GraduationCap, X, Menu, Loader2, LogOut, Settings, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useSiteContent } from "@/hooks/useSiteContent";
import { motion, useReducedMotion } from "framer-motion";

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
  const { user, signOut } = useAuth();
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
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    return sessionStorage.getItem('email_banner_dismissed') === 'true';
  });

  useEffect(() => {
    if (user && user.isEmailVerified === false && !bannerDismissed) {
      const timer = setTimeout(() => {
        setBannerDismissed(true);
        sessionStorage.setItem('email_banner_dismissed', 'true');
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [user, bannerDismissed]);

  const dismissBanner = () => {
    setBannerDismissed(true);
    sessionStorage.setItem('email_banner_dismissed', 'true');
  };
  const shouldReduceMotion = useReducedMotion();
  const masterEasing = [0.16, 1, 0.3, 1];

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
          <span>Please verify your email address to unlock all platform features. A link was sent during registration (Please check your Spam/Junk folder if you can't find it).</span>
          <button 
            onClick={dismissBanner} 
            className="absolute right-4 p-1 hover:bg-black/5 rounded-full transition-colors"
            title="Dismiss for this session"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <motion.header 
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: masterEasing }}
        className={cn(
          "navbar transition-all duration-300",
          isScrolled ? "py-0 shadow-sm" : "py-2"
        )}
      >
      <div className="container mx-auto px-4 flex h-16 items-center justify-between gap-4">
        {/* Left: Logo */}
        <div className="flex items-center shrink-0">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center group">
            <img src="/logo.png" alt="StudentHub Logo" className="h-10 w-auto object-contain transition-transform group-hover:scale-105" />
          </Link>
        </div>

        {/* Center: Navigation */}
        <div className="hidden lg:flex flex-1 justify-center px-4">
          <nav className="flex items-center">
            {user && (
              <Link to="/dashboard" className="text-sm font-medium mr-10 xl:mr-14 hover-underline text-foreground/80 hover:text-foreground transition-colors">
                Dashboard
              </Link>
            )}
            <div className="flex gap-8 xl:gap-12">
              {navigationGroups.map((group) => {
                const isActiveGroup = group.items.some((item: any) => location.pathname === item.href || location.pathname.startsWith(item.href + '/'));
                return (
                  <NavigationMenu key={group.title} delayDuration={100}>
                    <NavigationMenuList>
                      <NavigationMenuItem>
                        <NavigationMenuTrigger className={cn(
                          "text-sm font-medium h-8 bg-transparent hover-underline px-0 transition-colors",
                          isActiveGroup ? "text-primary border-b-2 border-primary rounded-none" : "text-muted-foreground hover:text-foreground"
                        )}>
                          {group.title}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="grid w-[600px] gap-3 p-6 md:grid-cols-2">
                            {group.items.map((item: any) => (
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
                    </NavigationMenuList>
                  </NavigationMenu>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Right: Search & Actions */}
        <div className="flex items-center justify-end gap-3 shrink-0">
          {location.pathname !== '/' && (
            <div className="hidden md:block shrink-0">
              <Dialog open={showSearchDropdown} onOpenChange={setShowSearchDropdown}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-10 lg:w-56 h-9 justify-center lg:justify-start text-muted-foreground px-0 lg:px-3 bg-muted/20 border-border/60 hover:bg-muted/50 transition-colors">
                    <Search className="h-4 w-4 lg:mr-2" />
                    <span className="hidden lg:inline">Search StudentHub...</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden top-[20%] translate-y-0">
                  <DialogTitle className="sr-only">Search</DialogTitle>
                  <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <Input 
                      placeholder="Search colleges, events, users..." 
                      className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground border-none shadow-none focus-visible:ring-0 focus-visible:outline-none focus-visible:border-none focus-visible:ring-offset-0"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchSubmit}
                      autoFocus
                    />
                  </div>
                  {searchQuery && (
                    <div className="max-h-[50vh] overflow-y-auto p-2 flex flex-col gap-2">
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
            </DialogContent>
          </Dialog>
        </div>
      )}

          <div className="flex items-center gap-1 sm:gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleTheme} 
                  className="hidden sm:inline-flex text-muted-foreground hover:text-foreground"
                  aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{isDarkMode ? "Light Mode" : "Dark Mode"}</p>
              </TooltipContent>
            </Tooltip>

            {user ? (
              <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-border/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <NotificationBell />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Notifications</p>
                  </TooltipContent>
                </Tooltip>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full border border-border/50 hover:bg-accent/50 overflow-hidden ml-1">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.avatar_url || user?.profilePicture} alt={user?.name || user?.full_name || "User"} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {(user?.name || user?.full_name || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal p-3">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name || user?.full_name || "User"}</p>
                        <p className="text-xs leading-none text-muted-foreground mt-1">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="p-2.5">
                      <Link to="/profile" className="cursor-pointer flex items-center w-full">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="p-2.5">
                      <Link to="/dashboard" className="cursor-pointer flex items-center w-full">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="p-2.5">
                      <Link to="/settings" className="cursor-pointer flex items-center w-full">
                        <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={async () => { await signOut(); navigate('/'); }} 
                      className="cursor-pointer p-2.5 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-border/50">
                <Link to="/auth">
                  <Button className="hidden sm:inline-flex whitespace-nowrap h-9 px-4">Sign In</Button>
                </Link>
              </div>
            )}
          </div>
          
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
            {user && (
              <div className="mb-6">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block rounded-lg p-3 transition-all hover:bg-accent/50",
                    location.pathname === "/dashboard" && "bg-accent/30"
                  )}
                >
                  <div className="font-medium text-primary">Dashboard</div>
                  <p className="text-sm text-muted-foreground">Go to your personal dashboard</p>
                </Link>
              </div>
            )}
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
      </motion.header>
    </>
  );
};

export default Header;
