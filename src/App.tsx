import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NotesHub from "./pages/NotesHub";
import Auth from "./pages/Auth";
import StudySession from "./pages/StudySession";
import Analytics from "./pages/Analytics";
import QABoard from "./pages/QABoard";
import Gamification from "./pages/Gamification";
import VirtualClassroom from "./pages/VirtualClassroom";
import MeetingRoom from "./pages/MeetingRoom";
import HostDashboard from "./pages/HostDashboard";
import ClassroomRecap from "./pages/ClassroomRecap";
import Events from "./pages/Events";
import Community from "./pages/Community";
import Mentors from "./pages/Mentors";
import Dashboard from "./pages/Dashboard";
import ResumeBuilder from "./pages/ResumeBuilder";
import CollegeInsights from "./pages/CollegeInsights";
import CollegeDetail from "./pages/CollegeDetail";
import CompareColleges from "./pages/CompareColleges";
import InnovationHub from "./pages/InnovationHub";
import Scholarships from "./pages/Scholarships";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import LearningPathDetail from "./pages/LearningPathDetail";
import JobsPortal from "./pages/JobsPortal";
import QuizHub from "./pages/QuizHub";
import SkillZone from "./pages/SkillZone";
import TechNews from "./pages/TechNews";
import PlacementCell from "./pages/PlacementCell";
import StudyGroups from "./pages/StudyGroups";
import TeamHunt from "./pages/TeamHunt";
import RoommateFind from "./pages/RoommateFind";
import Wellness from "./pages/Wellness";
import Flashcards from "./pages/Flashcards";
import RoomRentals from "./pages/RoomRentals";
import FoodServices from "./pages/FoodServices";
import Transport from "./pages/Transport";
import Roadmaps from "./pages/Roadmaps";
import Forum from "./pages/Forum";
import Sessions from "./pages/Sessions";
import TechVault from "./pages/TechVault";
import SkillSwap from "./pages/SkillSwap";
import CreatorsZone from "./pages/CreatorsZone";
import AdminPanel from "./pages/AdminPanel";
import AdminCollegePanel from "./pages/AdminCollegePanel";
import DailyHacks from "./pages/DailyHacks";
import PostSkill from "./pages/PostSkill";
import Hostels from "./pages/Hostels";
import Repair from "./pages/Repair";
import Shopping from "./pages/Shopping";
import FoundersPassport from "./pages/FoundersPassport";
import InviteAccept from "./pages/InviteAccept";
import Search from "./pages/Search";
import EventDetail from "./pages/EventDetail";
import { AuthProvider } from "./hooks/useAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/invite/:token" element={<InviteAccept />} />
          <Route path="/search" element={<Search />} />
          
          {/* Protected Routes */}
          <Route path="/notes" element={<ProtectedRoute><NotesHub /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/study-session/:sessionId" element={<ProtectedRoute><StudySession /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="/mentors" element={<ProtectedRoute><Mentors /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
          <Route path="/college-insights" element={<ProtectedRoute><CollegeInsights /></ProtectedRoute>} />
          <Route path="/colleges/:id" element={<ProtectedRoute><CollegeDetail /></ProtectedRoute>} />
          <Route path="/compare" element={<ProtectedRoute><CompareColleges /></ProtectedRoute>} />
          <Route path="/innovation-hub" element={<ProtectedRoute><InnovationHub /></ProtectedRoute>} />
          <Route path="/scholarships" element={<ProtectedRoute><Scholarships /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
          <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
          <Route path="/learning-paths/:id" element={<ProtectedRoute><LearningPathDetail /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute><JobsPortal /></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><QuizHub /></ProtectedRoute>} />
          <Route path="/skills" element={<ProtectedRoute><SkillZone /></ProtectedRoute>} />
          <Route path="/news" element={<ProtectedRoute><TechNews /></ProtectedRoute>} />
          <Route path="/placement" element={<ProtectedRoute><PlacementCell /></ProtectedRoute>} />
          <Route path="/study-groups" element={<ProtectedRoute><StudyGroups /></ProtectedRoute>} />
          <Route path="/team-hunt" element={<ProtectedRoute><TeamHunt /></ProtectedRoute>} />
          <Route path="/roommate-finder" element={<ProtectedRoute><RoommateFind /></ProtectedRoute>} />
          <Route path="/wellness" element={<ProtectedRoute><Wellness /></ProtectedRoute>} />
          <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
          <Route path="/room-rentals" element={<ProtectedRoute><RoomRentals /></ProtectedRoute>} />
          <Route path="/food" element={<ProtectedRoute><FoodServices /></ProtectedRoute>} />
          <Route path="/transport" element={<ProtectedRoute><Transport /></ProtectedRoute>} />
          <Route path="/qa-board" element={<ProtectedRoute><QABoard /></ProtectedRoute>} />
          <Route path="/gamification" element={<ProtectedRoute><Gamification /></ProtectedRoute>} />
          <Route path="/virtual-classroom" element={<ProtectedRoute><VirtualClassroom /></ProtectedRoute>} />
          <Route path="/classroom/:id" element={<ProtectedRoute><MeetingRoom /></ProtectedRoute>} />
          <Route path="/host-dashboard" element={<ProtectedRoute><HostDashboard /></ProtectedRoute>} />
          <Route path="/classroom/:id/recap" element={<ProtectedRoute><ClassroomRecap /></ProtectedRoute>} />
          <Route path="/roadmaps" element={<ProtectedRoute><Roadmaps /></ProtectedRoute>} />
          <Route path="/forum" element={<ProtectedRoute><Forum /></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
          <Route path="/tech-vault" element={<ProtectedRoute><TechVault /></ProtectedRoute>} />
          <Route path="/skill-swap" element={<ProtectedRoute><SkillSwap /></ProtectedRoute>} />
          <Route path="/creators" element={<ProtectedRoute><CreatorsZone /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/colleges" element={<ProtectedRoute><AdminCollegePanel /></ProtectedRoute>} />
          <Route path="/daily-hacks" element={<ProtectedRoute><DailyHacks /></ProtectedRoute>} />
          <Route path="/post-skill" element={<ProtectedRoute><PostSkill /></ProtectedRoute>} />
          <Route path="/hostels" element={<ProtectedRoute><Hostels /></ProtectedRoute>} />
          <Route path="/repair" element={<ProtectedRoute><Repair /></ProtectedRoute>} />
          <Route path="/shopping" element={<ProtectedRoute><Shopping /></ProtectedRoute>} />
          <Route path="/founders-passport" element={<ProtectedRoute><FoundersPassport /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
