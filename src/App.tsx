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
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
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
import ResumeDashboard from "./pages/ResumeDashboard";
import ResumeEditorPage from "./pages/ResumeEditorPage";
import { FeedbackThreads } from "./pages/FeedbackThreads";
import { CampaignTracker } from "./pages/CampaignTracker";
import { PeerBenchmarking } from "./pages/PeerBenchmarking";

import PortfolioEditorPage from "./pages/PortfolioEditorPage";
import SuccessStoriesPage from "./pages/SuccessStoriesPage";
import InstitutionResumeStats from "./pages/InstitutionResumeStats";
import PublicPortfolioPage from "./pages/PublicPortfolioPage";
import CareerInsightsPage from "./pages/CareerInsightsPage";
import CoverLetterEditorPage from "./pages/CoverLetterEditorPage";
import SharedResumeView from "./pages/SharedResumeView";
import CollegeInsights from "./pages/CollegeInsights";
import CollegeDetail from "./pages/CollegeDetail";
import CompareColleges from "./pages/CompareColleges";
import InnovationHub from "./pages/InnovationHub";
import Scholarships from "./pages/Scholarships";
import ScholarshipCommunity from "./pages/ScholarshipCommunity";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import LearningPathDetail from "./pages/LearningPathDetail";
import JobsPortal from "./pages/JobsPortal";
import JobDetail from "./pages/JobDetail";
import SavedJobs from "./pages/SavedJobs";
import JobAlerts from "./pages/JobAlerts";
import FollowedCompanies from "./pages/FollowedCompanies";
import CampusInsights from "./pages/CampusInsights";
import ATSChecker from "./pages/ATSChecker";
import MyApplications from "./pages/MyApplications";
import ATSDashboard from "./pages/ATSDashboard";
import Assessments from "./pages/Assessments";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import JobAnalytics from "./pages/JobAnalytics";
import CandidateSearch from "./pages/CandidateSearch";
import QuizHub from "./pages/QuizHub";
import Challenges from "./pages/Challenges";
import Tournaments from "./pages/Tournaments";
import TeacherDashboard from "./pages/TeacherDashboard";
import SyllabusProgressTracker from "./pages/SyllabusProgressTracker";
import QuizCreate from "./pages/QuizCreate";
import QuizDetail from "./pages/QuizDetail";
import QuizTake from "./pages/QuizTake";
import QuizResults from "./pages/QuizResults";
import MyQuizzes from "./pages/MyQuizzes";
import SkillZone from "./pages/SkillZone";
import TechNews from "./pages/TechNews";
import PlacementCell from "./pages/PlacementCell";
import StudyGroups from "./pages/StudyGroups";
import TeamHunt from "./pages/TeamHunt";
import RoommateFind from "./pages/RoommateFind";
import Wellness from "./pages/Wellness";
import AdminCareerOpportunities from './pages/admin/AdminCareerOpportunities';
import FlashcardDeckView from './pages/FlashcardDeckView';
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
import MentorsAdminDashboard from "./pages/admin/MentorsAdminDashboard";
import AdminResumeDashboard from "./pages/admin/AdminResumeDashboard";
import DailyHacks from "./pages/DailyHacks";
import VideoRoomPage from "./pages/VideoRoomPage";
import AdminJobsPanel from "./pages/admin/AdminJobsPanel";
import RecruiterVerify from "./pages/RecruiterVerify";
import { ThemeProvider } from "./components/theme-provider";
import PostSkill from "./pages/PostSkill";
import Hostels from "./pages/Hostels";
import Repair from "./pages/Repair";
import Shopping from "./pages/Shopping";
import FoundersPassport from "./pages/FoundersPassport";
import InviteAccept from "./pages/InviteAccept";
import Search from "./pages/Search";
import EventDetail from "./pages/EventDetail";
import PublicSkillsProfile from "./pages/PublicSkillsProfile";
import MentorProfilePage from "./pages/MentorProfilePage";
import MentorCommunity from "./pages/MentorCommunity";
import AlumniDirectory from "./pages/AlumniDirectory";
import AILearningPaths from "./pages/AILearningPaths";
import AMASessionsPage from "./pages/AMASessionsPage";
import AMADetailPage from "./pages/AMADetailPage";
import NotificationSettings from "./pages/NotificationSettings";
import LiveQuizHost from "./pages/LiveQuizHost";
import LiveQuizJoin from "./pages/LiveQuizJoin";
import LiveQuizPlay from "./pages/LiveQuizPlay";
import AdminQuizReports from "./pages/admin/AdminQuizReports";
import AdminNewsModeration from "./pages/admin/AdminNewsModeration";
import ScholarshipDetail from "./pages/ScholarshipDetail";
import ScholarshipApply from "./pages/ScholarshipApply";
import AdminScholarships from "./pages/admin/AdminScholarships";
import MyScholarships from "./pages/MyScholarships";
import ScholarshipCalculator from "./pages/ScholarshipCalculator";
import { AuthProvider } from "./hooks/useAuth";
import { GlobalSocketListener } from "./components/GlobalSocketListener";
import CreatorDashboard from "./pages/CreatorDashboard";
import CreatorAnalytics from "./pages/CreatorAnalytics";
import Leaderboard from "./pages/Leaderboard";
import QuestionBank from "./pages/QuestionBank";
import { PublicTestimonialForm } from "./pages/PublicTestimonialForm";
import { PublicRecommendationForm } from "./pages/PublicRecommendationForm";
import { ResumeWorkshops } from "./pages/ResumeWorkshops";
import { WorkshopSession } from "./pages/WorkshopSession";
import { DeveloperSettings } from "./pages/DeveloperSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <GlobalSocketListener />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/video/:id" element={<VideoRoomPage />} />
          <Route path="/recruiter/verify" element={<RecruiterVerify />} />
          <Route path="/recruiter/candidates" element={<CandidateSearch />} />
          <Route path="/scholarships" element={<Scholarships />} />
          <Route path="/scholarships/community" element={<ScholarshipCommunity />} />
          <Route path="/invite/:token" element={<InviteAccept />} />
          <Route path="/search" element={<Search />} />
          <Route path="/profile/:userId/skills" element={<PublicSkillsProfile />} />
          {/* Protected Routes */}
          <Route path="/notes" element={<ProtectedRoute><NotesHub /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/study-session/:sessionId" element={<ProtectedRoute><StudySession /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          {/* Public or Auth-free routes could be outside ProtectedRoute if needed, but App.tsx structure has them in a wrapper. SharedResumeView should probably be outside ProtectedRoute so recruiters can view without account. */}
          <Route path="/resume/shared/:linkId" element={<SharedResumeView />} />
          <Route path="/mentors" element={<ProtectedRoute><Mentors /></ProtectedRoute>} />
          <Route path="/mentors/amas" element={<ProtectedRoute><AMASessionsPage /></ProtectedRoute>} />
          <Route path="/mentors/amas/:id" element={<ProtectedRoute><AMADetailPage /></ProtectedRoute>} />
          <Route path="/mentors/:id" element={<ProtectedRoute><MentorProfilePage /></ProtectedRoute>} />
          <Route path="/mentors/community" element={<ProtectedRoute><MentorCommunity /></ProtectedRoute>} />
          <Route path="/mentors/alumni" element={<ProtectedRoute><AlumniDirectory /></ProtectedRoute>} />
          <Route path="/mentors/ai-paths" element={<ProtectedRoute><AILearningPaths /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/resume-builder" element={<ProtectedRoute><ResumeDashboard /></ProtectedRoute>} />
          <Route path="/resume-builder/editor/:id" element={<ProtectedRoute><ResumeEditorPage /></ProtectedRoute>} />
            <Route path="/resume-builder/portfolio" element={<ProtectedRoute><PortfolioEditorPage /></ProtectedRoute>} />
          <Route path="/resume-builder/feedback" element={<ProtectedRoute><FeedbackThreads /></ProtectedRoute>} />
          <Route path="/resume-builder/campaigns" element={<ProtectedRoute><CampaignTracker /></ProtectedRoute>} />
          <Route path="/resume-builder/benchmarking" element={<ProtectedRoute><PeerBenchmarking /></ProtectedRoute>} />

            <Route path="/resume-builder/insights" element={<ProtectedRoute><CareerInsightsPage /></ProtectedRoute>} />
            <Route path="/portfolio/:slug" element={<PublicPortfolioPage />} />
          <Route path="/success-stories" element={<SuccessStoriesPage />} />
          <Route path="/institution-dashboard" element={<InstitutionResumeStats />} />
          <Route path="/resume-builder/cover-letter/:id" element={<ProtectedRoute><CoverLetterEditorPage /></ProtectedRoute>} />
          <Route path="/college-insights" element={<ProtectedRoute><CollegeInsights /></ProtectedRoute>} />
          <Route path="/colleges/:id" element={<ProtectedRoute><CollegeDetail /></ProtectedRoute>} />
          <Route path="/compare" element={<ProtectedRoute><CompareColleges /></ProtectedRoute>} />
          <Route path="/innovation-hub" element={<ProtectedRoute><InnovationHub /></ProtectedRoute>} />
          <Route path="/scholarships" element={<ProtectedRoute><Scholarships /></ProtectedRoute>} />
          <Route path="/scholarships/my-scholarships" element={<ProtectedRoute><MyScholarships /></ProtectedRoute>} />
          <Route path="/scholarships/calculator" element={<ProtectedRoute><ScholarshipCalculator /></ProtectedRoute>} />
          <Route path="/scholarships/:id" element={<ScholarshipDetail />} />
          <Route path="/scholarships/:id/apply" element={<ProtectedRoute><ScholarshipApply /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
          <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
          <Route path="/learning-paths/:id" element={<ProtectedRoute><LearningPathDetail /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute><JobsPortal /></ProtectedRoute>} />
          <Route path="/jobs/saved" element={<ProtectedRoute><SavedJobs /></ProtectedRoute>} />
          <Route path="/job-alerts" element={<ProtectedRoute><JobAlerts /></ProtectedRoute>} />
          <Route path="/companies/followed" element={<ProtectedRoute><FollowedCompanies /></ProtectedRoute>} />
          <Route path="/insights" element={<ProtectedRoute><CampusInsights /></ProtectedRoute>} />
          <Route path="/resume/ats-check" element={<ProtectedRoute><ATSChecker /></ProtectedRoute>} />
          <Route path="/assessments" element={<ProtectedRoute><Assessments /></ProtectedRoute>} />
          <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute><MyApplications /></ProtectedRoute>} />
          <Route path="/recruiter/dashboard" element={<ProtectedRoute><RecruiterDashboard /></ProtectedRoute>} />
          <Route path="/recruiter/jobs/:id/applicants" element={<ProtectedRoute><ATSDashboard /></ProtectedRoute>} />
          <Route path="/recruiter/jobs/:id/analytics" element={<ProtectedRoute><JobAnalytics /></ProtectedRoute>} />
          <Route path="/quizzes" element={<ProtectedRoute><QuizHub /></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><QuizHub /></ProtectedRoute>} />
          <Route path="/quiz/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
          <Route path="/quiz/tournaments" element={<ProtectedRoute><Tournaments /></ProtectedRoute>} />
          <Route path="/quiz/classes" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/quiz/progress" element={<ProtectedRoute><SyllabusProgressTracker /></ProtectedRoute>} />
          <Route path="/quizzes/new" element={<ProtectedRoute><QuizCreate /></ProtectedRoute>} />
          <Route path="/quizzes/:id" element={<ProtectedRoute><QuizDetail /></ProtectedRoute>} />
          <Route path="/quizzes/:id/take" element={<ProtectedRoute><QuizTake /></ProtectedRoute>} />
          <Route path="/question-bank" element={<ProtectedRoute><QuestionBank /></ProtectedRoute>} />
          <Route path="/quizzes/:id/host" element={<ProtectedRoute><LiveQuizHost /></ProtectedRoute>} />
          <Route path="/live/join" element={<ProtectedRoute><LiveQuizJoin /></ProtectedRoute>} />
          <Route path="/live/:sessionId/play" element={<ProtectedRoute><LiveQuizPlay /></ProtectedRoute>} />
          <Route path="/attempts/:attemptId/results" element={<ProtectedRoute><QuizResults /></ProtectedRoute>} />
          <Route path="/my-quizzes" element={<ProtectedRoute><MyQuizzes /></ProtectedRoute>} />
          <Route path="/creator-dashboard" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
          <Route path="/analytics/:id" element={<ProtectedRoute><CreatorAnalytics /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
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
          <Route path="/admin/scholarships" element={<ProtectedRoute><AdminScholarships /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/jobs" element={<ProtectedRoute><AdminJobsPanel /></ProtectedRoute>} />
          <Route path="/admin/colleges" element={<ProtectedRoute><AdminCollegePanel /></ProtectedRoute>} />
          <Route path="/admin/mentors" element={<ProtectedRoute><MentorsAdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/resumes" element={<ProtectedRoute><AdminResumeDashboard /></ProtectedRoute>} />
          <Route path="/admin/career-opportunities" element={<ProtectedRoute><AdminCareerOpportunities /></ProtectedRoute>} />
          <Route path="/admin/quiz-reports" element={<ProtectedRoute><AdminQuizReports /></ProtectedRoute>} />
          <Route path="/admin/news-moderation" element={<ProtectedRoute><AdminNewsModeration /></ProtectedRoute>} />
          <Route path="/recruiter/verify" element={<ProtectedRoute><RecruiterVerify /></ProtectedRoute>} />
          <Route path="/daily-hacks" element={<ProtectedRoute><DailyHacks /></ProtectedRoute>} />
          <Route path="/post-skill" element={<ProtectedRoute><PostSkill /></ProtectedRoute>} />
          <Route path="/hostels" element={<ProtectedRoute><Hostels /></ProtectedRoute>} />
          <Route path="/repair" element={<ProtectedRoute><Repair /></ProtectedRoute>} />
          <Route path="/shopping" element={<ProtectedRoute><Shopping /></ProtectedRoute>} />
          <Route path="/founders-passport" element={<ProtectedRoute><FoundersPassport /></ProtectedRoute>} />
          <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
          
        <Route path="/public/testimonial/:token" element={<PublicTestimonialForm />} />
        <Route path="/public/recommendation/:token" element={<PublicRecommendationForm />} />
      
        <Route path="/resume/workshops" element={<ResumeWorkshops />} />
        <Route path="/resume/workshops/:id" element={<WorkshopSession />} />
        <Route path="/resume/developer" element={<DeveloperSettings />} />
      </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
