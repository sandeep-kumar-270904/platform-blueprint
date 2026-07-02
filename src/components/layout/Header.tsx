import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { GraduationCap, Menu, X, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navigationGroups = [
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
    ],
  },
  {
    title: "Learning & Skills",
    items: [
      { title: "Quiz & Tests", href: "/quiz", desc: "Mock exams and practice" },
      { title: "Skill Zone", href: "/skills", desc: "Video courses and certifications" },
      { title: "Tech News", href: "/news", desc: "Latest AI and tech updates" },
      { title: "Virtual Classroom", href: "/virtual-classroom", desc: "Live learning sessions" },
      { title: "Flashcards", href: "/flashcards", desc: "Spaced repetition study" },
    ],
  },
  {
    title: "Collaboration",
    items: [
      { title: "Study Groups", href: "/study-groups", desc: "Virtual study rooms" },
      { title: "Team Hunt", href: "/team-hunt", desc: "Find collaborators" },
      { title: "Tech Vault", href: "/tech-vault", desc: "Code snippets and docs" },
      { title: "Skill Swap", href: "/skill-swap", desc: "Exchange knowledge" },
      { title: "Creators Zone", href: "/creators", desc: "Content platform" },
      { title: "Q&A Board", href: "/qa-board", desc: "Stack Overflow style" },
      { title: "Forum", href: "/forum", desc: "Discussion threads" },
    ],
  },
  {
    title: "Engagement",
    items: [
      { title: "Daily Hacks", href: "/daily-hacks", desc: "Tips and showcases" },
      { title: "Gamification", href: "/gamification", desc: "Points and badges" },
      { title: "Wellness Tracker", href: "/wellness", desc: "Mental health support" },
      { title: "Sessions", href: "/sessions", desc: "Study & mentoring sessions" },
    ],
  },
  {
    title: "Local Services",
    items: [
      { title: "Room Rentals", href: "/room-rentals", desc: "Find accommodation" },
      { title: "Hostel Info", href: "/hostels", desc: "Campus housing" },
      { title: "Food & Restaurants", href: "/food", desc: "Student discounts" },
      { title: "Transport", href: "/transport", desc: "Bus routes and shuttles" },
      { title: "Repair Services", href: "/repair", desc: "Maintenance help" },
      { title: "Shopping", href: "/shopping", desc: "Local stores" },
    ],
  },
  {
    title: "More",
    items: [
      { title: "Post Your Skill", href: "/post-skill", desc: "Freelance services" },
      { title: "Find Roommate", href: "/roommate-finder", desc: "Connect with peers" },
      { title: "Dashboard", href: "/dashboard", desc: "Your personal hub" },
      { title: "Analytics", href: "/analytics", desc: "Your study stats" },
      { title: "Admin Panel", href: "/admin", desc: "Platform management" },
    ],
  },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={cn(
      "navbar transition-all duration-300",
      isScrolled ? "py-0 shadow-sm" : "py-2"
    )}>
      <div className="container mx-auto flex h-16 items-center justify-between gap-8">
        {/* Left Side (Logo) */}
        <div className="flex-1 flex justify-start min-w-max">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="icon-box bg-[var(--ink)] text-white shadow-sm transition-all group-hover:scale-110">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-foreground display-font tracking-tight">
              StudentHub
            </span>
          </Link>
        </div>

        {/* Desktop Navigation (Center) */}
        <nav className="hidden lg:flex justify-center">
          <NavigationMenu delayDuration={200}>
            <NavigationMenuList className="flex gap-6 lg:gap-8">
              {navigationGroups.map((group) => (
                <NavigationMenuItem key={group.title}>
                  <NavigationMenuTrigger className="text-sm font-medium h-10 bg-transparent">
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
                                "flex items-start gap-3 select-none rounded-lg p-3 no-underline outline-none transition-all hover:bg-muted hover:text-primary active:scale-[0.98]",
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

        {/* Right Side Actions */}
        <div className="flex-1 flex items-center justify-end gap-3 min-w-max">
          {user && (
            <Link to="/dashboard">
              <Button className="btn-secondary hidden md:inline-flex">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          )}
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
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
            {user && (
              <div className="flex flex-col gap-2 pt-4 border-t border-border/40">
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
