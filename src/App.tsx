import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NotesHub from "./pages/NotesHub";
import Auth from "./pages/Auth";
import StudySession from "./pages/StudySession";
import Analytics from "./pages/Analytics";
import QABoard from "./pages/QABoard";
import Gamification from "./pages/Gamification";
import VirtualClassroom from "./pages/VirtualClassroom";
import Events from "./pages/Events";
import Community from "./pages/Community";
import Mentors from "./pages/Mentors";
import Dashboard from "./pages/Dashboard";
import ResumeBuilder from "./pages/ResumeBuilder";
import CollegeInsights from "./pages/CollegeInsights";
import InnovationHub from "./pages/InnovationHub";
import Scholarships from "./pages/Scholarships";
import Courses from "./pages/Courses";
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
import DailyHacks from "./pages/DailyHacks";
import PostSkill from "./pages/PostSkill";
import Hostels from "./pages/Hostels";
import Repair from "./pages/Repair";
import Shopping from "./pages/Shopping";
import FoundersPassport from "./pages/FoundersPassport";
import InviteAccept from "./pages/InviteAccept";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/notes" element={<NotesHub />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/study-session/:sessionId" element={<StudySession />} />
          <Route path="/events" element={<Events />} />
          <Route path="/community" element={<Community />} />
          <Route path="/mentors" element={<Mentors />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/resume-builder" element={<ResumeBuilder />} />
          <Route path="/college-insights" element={<CollegeInsights />} />
          <Route path="/innovation-hub" element={<InnovationHub />} />
          <Route path="/scholarships" element={<Scholarships />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/jobs" element={<JobsPortal />} />
          <Route path="/quiz" element={<QuizHub />} />
          <Route path="/skills" element={<SkillZone />} />
          <Route path="/news" element={<TechNews />} />
          <Route path="/placement" element={<PlacementCell />} />
          <Route path="/study-groups" element={<StudyGroups />} />
          <Route path="/team-hunt" element={<TeamHunt />} />
          <Route path="/roommate-finder" element={<RoommateFind />} />
          <Route path="/wellness" element={<Wellness />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/room-rentals" element={<RoomRentals />} />
          <Route path="/food" element={<FoodServices />} />
          <Route path="/transport" element={<Transport />} />
          <Route path="/qa-board" element={<QABoard />} />
          <Route path="/gamification" element={<Gamification />} />
          <Route path="/virtual-classroom" element={<VirtualClassroom />} />
          <Route path="/roadmaps" element={<Roadmaps />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/tech-vault" element={<TechVault />} />
          <Route path="/skill-swap" element={<SkillSwap />} />
          <Route path="/creators" element={<CreatorsZone />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/daily-hacks" element={<DailyHacks />} />
          <Route path="/post-skill" element={<PostSkill />} />
          <Route path="/hostels" element={<Hostels />} />
          <Route path="/repair" element={<Repair />} />
          <Route path="/shopping" element={<Shopping />} />
          <Route path="/founders-passport" element={<FoundersPassport />} />
          <Route path="/invite/:token" element={<InviteAccept />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
