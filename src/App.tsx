import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const NotesHub = lazy(() => import("./pages/NotesHub"));
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const StudyGroups = lazy(() => import("./pages/StudyGroups"));
const StudyGroupDetail = lazy(() => import("./pages/StudyGroupDetail"));

const Analytics = lazy(() => import("./pages/Analytics"));
const QABoard = lazy(() => import("./pages/QABoard"));
const VirtualClassroom = lazy(() => import("./pages/VirtualClassroom"));
const ClassPreview = lazy(() => import("./pages/ClassPreview").then(m => ({ default: m.ClassPreview })));
const MeetingRoom = lazy(() => import("./pages/MeetingRoom"));
const HostDashboard = lazy(() => import("./pages/HostDashboard"));
const ClassroomRecap = lazy(() => import("./pages/ClassroomRecap"));
const Events = lazy(() => import("./pages/Events"));
const Community = lazy(() => import("./pages/Community"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const Mentors = lazy(() => import("./pages/Mentors"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ResumeDashboard = lazy(() => import("./pages/ResumeDashboard"));
const ResumeEditorPage = lazy(() => import("./pages/ResumeEditorPage"));
const FeedbackThreads = lazy(() => import("./pages/FeedbackThreads").then(m => ({ default: m.FeedbackThreads })));
const CampaignTracker = lazy(() => import("./pages/CampaignTracker").then(m => ({ default: m.CampaignTracker })));
const PeerBenchmarking = lazy(() => import("./pages/PeerBenchmarking").then(m => ({ default: m.PeerBenchmarking })));

const PortfolioEditorPage = lazy(() => import("./pages/PortfolioEditorPage"));
const SuccessStoriesPage = lazy(() => import("./pages/SuccessStoriesPage"));
const InstitutionResumeStats = lazy(() => import("./pages/InstitutionResumeStats"));
const PublicPortfolioPage = lazy(() => import("./pages/PublicPortfolioPage"));
const CareerPath = lazy(() => import("./pages/CareerPath"));
const CareerInsightsPage = lazy(() => import("./pages/CareerInsightsPage"));
const CoverLetterEditorPage = lazy(() => import("./pages/CoverLetterEditorPage"));
const SharedResumeView = lazy(() => import("./pages/SharedResumeView"));
const CollegeInsights = lazy(() => import("./pages/CollegeInsights"));
const AIMentor = lazy(() => import("./pages/AIMentor"));
const CollegeDetail = lazy(() => import("./pages/CollegeDetail"));
const CompareColleges = lazy(() => import("./pages/CompareColleges"));
const ApplicationTracker = lazy(() => import("./pages/ApplicationTracker"));
const InnovationHub = lazy(() => import("./pages/InnovationHub"));
const Scholarships = lazy(() => import("./pages/Scholarships"));
const ScholarshipCommunity = lazy(() => import("./pages/ScholarshipCommunity"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const LearningPathDetail = lazy(() => import("./pages/LearningPathDetail"));
const JobsPortal = lazy(() => import("./pages/JobsPortal"));
const JobDetail = lazy(() => import("./pages/JobDetail"));
const SavedJobs = lazy(() => import("./pages/SavedJobs"));
const JobAlerts = lazy(() => import("./pages/JobAlerts"));
const FollowedCompanies = lazy(() => import("./pages/FollowedCompanies"));
const CampusInsights = lazy(() => import("./pages/CampusInsights"));
const ATSChecker = lazy(() => import("./pages/ATSChecker"));
const MyApplications = lazy(() => import("./pages/MyApplications"));
const ATSDashboard = lazy(() => import("./pages/ATSDashboard"));
const Assessments = lazy(() => import("./pages/Assessments"));
const RecruiterDashboard = lazy(() => import("./pages/RecruiterDashboard"));
const JobAnalytics = lazy(() => import("./pages/JobAnalytics"));
const CandidateSearch = lazy(() => import("./pages/CandidateSearch"));
const QuizHub = lazy(() => import("./pages/QuizHub"));
const Challenges = lazy(() => import("./pages/Challenges"));
const Tournaments = lazy(() => import("./pages/Tournaments"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const SyllabusProgressTracker = lazy(() => import("./pages/SyllabusProgressTracker"));
const QuizCreate = lazy(() => import("./pages/QuizCreate"));
const QuizDetail = lazy(() => import("./pages/QuizDetail"));
const QuizTake = lazy(() => import("./pages/QuizTake"));
const QuizResults = lazy(() => import("./pages/QuizResults"));
const MyQuizzes = lazy(() => import("./pages/MyQuizzes"));
const TechNews = lazy(() => import("./pages/TechNews"));
const PlacementCell = lazy(() => import("./pages/PlacementCell"));
const DSAPractice = lazy(() => import("./pages/DSAPractice"));
const InterviewPrep = lazy(() => import("./pages/InterviewPrep"));
const CompanyPrepDetail = lazy(() => import("./pages/CompanyPrepDetail"));
const MockInterviews = lazy(() => import("./pages/MockInterviews"));
const OASimulator = lazy(() => import("./pages/OASimulator").then(m => ({ default: m.OASimulator })));
const OAResults = lazy(() => import("./pages/OAResults").then(m => ({ default: m.OAResults })));
const PlacementDashboard = lazy(() => import("./pages/PlacementDashboard"));
const GroupDiscussionPrep = lazy(() => import("./pages/GroupDiscussionPrep"));
const PlacementResources = lazy(() => import("./pages/PlacementResources"));
const DoubtSolving = lazy(() => import("./pages/DoubtSolving"));
const QuestionDetail = lazy(() => import("./pages/QuestionDetail"));
const PlacementSearch = lazy(() => import("./pages/PlacementSearch"));

const TeamHunt = lazy(() => import("./pages/TeamHunt"));
const TeamHuntManage = lazy(() => import("./pages/TeamHuntManage"));
const TeamHuntDashboard = lazy(() => import("./pages/TeamHuntDashboard"));
const TeamHuntDetail = lazy(() => import("./pages/TeamHuntDetail"));
const TeamHuntLeaderboard = lazy(() => import("./pages/TeamHuntLeaderboard"));
const RoommateFind = lazy(() => import("./pages/RoommateFind"));
const Wellness = lazy(() => import("./pages/Wellness"));
const AdminCareerOpportunities = lazy(() => import("./pages/admin/AdminCareerOpportunities"));
const RoomRentals = lazy(() => import("./pages/RoomRentals"));
const Roadmaps = lazy(() => import("./pages/Roadmaps"));
const Forum = lazy(() => import("./pages/Forum"));

const SkillSwap = lazy(() => import("./pages/SkillSwap"));
const CreatorsZone = lazy(() => import("./pages/CreatorsZone"));
const CreatorProfilePage = lazy(() => import("./pages/CreatorProfilePage"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AdminCollegePanel = lazy(() => import("./pages/AdminCollegePanel"));
const MentorsAdminDashboard = lazy(() => import("./pages/admin/MentorsAdminDashboard"));
const AdminResumeDashboard = lazy(() => import("./pages/admin/AdminResumeDashboard"));
const AdminCreatorsPanel = lazy(() => import("./pages/admin/AdminCreatorsPanel"));
const AdminClassroomsPanel = lazy(() => import("./pages/admin/AdminClassroomsPanel"));
const DailyHacks = lazy(() => import("./pages/DailyHacks"));
const VideoRoomPage = lazy(() => import("./pages/VideoRoomPage"));
const AdminJobsPanel = lazy(() => import("./pages/admin/AdminJobsPanel"));
const AdminStudyGroupsPanel = lazy(() => import("./pages/admin/AdminStudyGroupsPanel"));
const AdminRoomRentalsPanel = lazy(() => import("./pages/admin/AdminRoomRentalsPanel"));
const AdminRoommatesPanel = lazy(() => import("./pages/admin/AdminRoommatesPanel"));
const RecruiterVerify = lazy(() => import("./pages/RecruiterVerify"));
import { ThemeProvider } from "./components/theme-provider";

const Hostels = lazy(() => import("./pages/Hostels"));
const HostelInquiries = lazy(() => import("./pages/HostelInquiries"));
const SavedHostels = lazy(() => import("./pages/SavedHostels"));
const Repair = lazy(() => import("./pages/Repair"));
const RepairRequests = lazy(() => import("./pages/dashboard/RepairRequests"));
const FoundersPassport = lazy(() => import("./pages/FoundersPassport"));
const InviteAccept = lazy(() => import("./pages/InviteAccept"));
const Search = lazy(() => import("./pages/Search"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const EventCreate = lazy(() => import("./pages/EventCreate"));
const EventManage = lazy(() => import("./pages/EventManage"));
const PublicSkillsProfile = lazy(() => import("./pages/PublicSkillsProfile"));
const MentorProfilePage = lazy(() => import("./pages/MentorProfilePage"));
const MentorCommunity = lazy(() => import("./pages/MentorCommunity"));
const AlumniDirectory = lazy(() => import("./pages/AlumniDirectory"));
const AILearningPaths = lazy(() => import("./pages/AILearningPaths"));
const AMASessionsPage = lazy(() => import("./pages/AMASessionsPage"));
const AMADetailPage = lazy(() => import("./pages/AMADetailPage"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const LiveQuizHost = lazy(() => import("./pages/LiveQuizHost"));
const LiveQuizJoin = lazy(() => import("./pages/LiveQuizJoin"));
const LiveQuizPlay = lazy(() => import("./pages/LiveQuizPlay"));
const CollaborativeQuizPlay = lazy(() => import("./pages/CollaborativeQuizPlay"));
const AdminQuizReports = lazy(() => import("./pages/admin/AdminQuizReports"));
const AdminNewsModeration = lazy(() => import("./pages/admin/AdminNewsModeration"));
const AdminCommunityPanel = lazy(() => import("./pages/admin/AdminCommunityPanel"));
const AdminPlacementPanel = lazy(() => import("./pages/admin/AdminPlacementPanel"));
const ScholarshipDetail = lazy(() => import("./pages/ScholarshipDetail"));
const ScholarshipApply = lazy(() => import("./pages/ScholarshipApply"));
const AdminScholarships = lazy(() => import("./pages/admin/AdminScholarships"));
const AdminSkillSwapPanel = lazy(() => import("./pages/admin/AdminSkillSwapPanel"));
const MyScholarships = lazy(() => import("./pages/MyScholarships"));
const ScholarshipCalculator = lazy(() => import("./pages/ScholarshipCalculator"));
import { AuthProvider } from "./hooks/useAuth";
import { GlobalSocketListener } from "./components/GlobalSocketListener";
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard"));
const CreatorAnalytics = lazy(() => import("./pages/CreatorAnalytics"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const QuestionBank = lazy(() => import("./pages/QuestionBank"));
const PublicTestimonialForm = lazy(() => import("./pages/PublicTestimonialForm").then(m => ({ default: m.PublicTestimonialForm })));
const PublicRecommendationForm = lazy(() => import("./pages/PublicRecommendationForm").then(m => ({ default: m.PublicRecommendationForm })));
const ResumeWorkshops = lazy(() => import("./pages/ResumeWorkshops").then(m => ({ default: m.ResumeWorkshops })));
const WorkshopSession = lazy(() => import("./pages/WorkshopSession").then(m => ({ default: m.WorkshopSession })));
const DeveloperSettings = lazy(() => import("./pages/DeveloperSettings").then(m => ({ default: m.DeveloperSettings })));
const StaticPage = lazy(() => import("./pages/StaticPage").then(m => ({ default: m.StaticPage })));
const AdminHostelsPanel = lazy(() => import("./pages/admin/AdminHostelsPanel").then(m => ({ default: m.AdminHostelsPanel })));
const AdminRepairPanel = lazy(() => import("./pages/admin/AdminRepairPanel").then(m => ({ default: m.AdminRepairPanel })));
const AdminSalaryModeration = lazy(() => import("./pages/admin/AdminSalaryModeration").then(m => ({ default: m.AdminSalaryModeration })));
const AdminAlumniPanel = lazy(() => import("./pages/admin/AdminAlumniPanel"));
import { AnnouncementBanner } from "./components/layout/AnnouncementBanner";
import { MaintenanceModeWrapper } from "./components/layout/MaintenanceMode";
import { ErrorBoundary } from "./components/layout/ErrorBoundary";
import { CookieConsent } from "./components/layout/CookieConsent";
import { CustomCursor } from "./components/ui/CustomCursor";
import { CreatorDetailModal } from '@/components/creators/CreatorDetailModal';
import { AlumniConnectionsHub } from './pages/AlumniConnectionsHub';
import { AlumniDirectoryPage } from './pages/AlumniDirectoryPage';
import { AlumniProfilePage } from './pages/AlumniProfilePage';
import { ConnectionsNetworkPage } from './pages/ConnectionsNetworkPage';
import { MessagingPage } from './pages/MessagingPage';
import { AskAlumniPage } from './pages/AskAlumniPage';
import { AlumniKnowledgePage } from './pages/AlumniKnowledgePage';
import { AlumniOpportunitiesPage } from './pages/AlumniOpportunitiesPage';
import { AlumniEventsPage } from './pages/AlumniEventsPage';
import { ClaimAlumniProfile } from './pages/ClaimAlumniProfile';
const OnboardingFlow = lazy(() => import("./pages/OnboardingFlow"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <CustomCursor />
        <CookieConsent />
        <Toaster />
        <Sonner />
        <GlobalSocketListener />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <a href="#main-content" className="skip-to-content">Skip to main content</a>
          <AnnouncementBanner />
          <MaintenanceModeWrapper>
            <ErrorBoundary>
              <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
              <Routes>
            {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingFlow /></ProtectedRoute>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/create" element={<ProtectedRoute><EventCreate /></ProtectedRoute>} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/events/:id/manage" element={<ProtectedRoute><EventManage /></ProtectedRoute>} />
          <Route path="/video/:id" element={<VideoRoomPage />} />
          <Route path="/recruiter/verify" element={<RecruiterVerify />} />
          <Route path="/recruiter/candidates" element={<CandidateSearch />} />
          <Route path="/scholarships" element={<Scholarships />} />
          <Route path="/scholarships/:id" element={<ScholarshipDetail />} />
          <Route path="/invite/:token" element={<InviteAccept />} />
          <Route path="/search" element={<Search />} />
          <Route path="/p/:slug" element={<StaticPage />} />
          <Route path="/profile/:userId/skills" element={<PublicSkillsProfile />} />
          {/* Alumni Routes */}
          <Route path="/claim-alumni" element={<ClaimAlumniProfile />} />
          <Route path="/alumni/connections" element={<ProtectedRoute><AlumniConnectionsHub /></ProtectedRoute>} />
          <Route path="/alumni/connections/discover" element={<ProtectedRoute><AlumniDirectoryPage /></ProtectedRoute>} />
          <Route path="/alumni/connections/profile/:id" element={<ProtectedRoute><AlumniProfilePage /></ProtectedRoute>} />
          <Route path="/alumni/connections/network" element={<ProtectedRoute><ConnectionsNetworkPage /></ProtectedRoute>} />
          <Route path="/alumni/connections/messages" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />
          <Route path="/alumni/connections/qa" element={<ProtectedRoute><AskAlumniPage /></ProtectedRoute>} />
          <Route path="/alumni/connections/knowledge" element={<ProtectedRoute><AlumniKnowledgePage /></ProtectedRoute>} />
          <Route path="/alumni/connections/opportunities" element={<ProtectedRoute><AlumniOpportunitiesPage /></ProtectedRoute>} />
          <Route path="/alumni/connections/events" element={<ProtectedRoute><AlumniEventsPage /></ProtectedRoute>} />
          {/* Protected Routes */}
            <Route path="/notes" element={<ProtectedRoute><NotesHub /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
  
            <Route path="/placement/oa/simulate/:id" element={<ProtectedRoute><OASimulator /></ProtectedRoute>} />
            <Route path="/placement/oa/results/:id" element={<ProtectedRoute><OAResults /></ProtectedRoute>} />
            <Route path="/placement/resources" element={<ProtectedRoute><PlacementResources /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/community/post/:id" element={<PostDetail />} />
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

            <Route path="/career-path" element={<ProtectedRoute><CareerPath /></ProtectedRoute>} />
            <Route path="/resume-builder/insights" element={<ProtectedRoute><CareerInsightsPage /></ProtectedRoute>} />
            <Route path="/portfolio/:slug" element={<PublicPortfolioPage />} />
          <Route path="/success-stories" element={<SuccessStoriesPage />} />
          <Route path="/institution-dashboard" element={<InstitutionResumeStats />} />
          <Route path="/resume-builder/cover-letter/:id" element={<ProtectedRoute><CoverLetterEditorPage /></ProtectedRoute>} />
          <Route path="/college-insights" element={<ProtectedRoute><CollegeInsights /></ProtectedRoute>} />
          <Route path="/ai-mentor" element={<ProtectedRoute><AIMentor /></ProtectedRoute>} />
          <Route path="/colleges/:id" element={<ProtectedRoute><CollegeDetail /></ProtectedRoute>} />
          <Route path="/compare" element={<ProtectedRoute><CompareColleges /></ProtectedRoute>} />
          <Route path="/tracker" element={<ProtectedRoute><ApplicationTracker /></ProtectedRoute>} />
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
          <Route path="/gd-live/:sessionId/play" element={<ProtectedRoute><CollaborativeQuizPlay /></ProtectedRoute>} />
          <Route path="/attempts/:attemptId/results" element={<ProtectedRoute><QuizResults /></ProtectedRoute>} />
          <Route path="/my-quizzes" element={<ProtectedRoute><MyQuizzes /></ProtectedRoute>} />
          <Route path="/creator-dashboard" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
          <Route path="/analytics/:id" element={<ProtectedRoute><CreatorAnalytics /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/news" element={<ProtectedRoute><TechNews /></ProtectedRoute>} />
          <Route path="/placement" element={<ProtectedRoute><PlacementCell /></ProtectedRoute>} />
          <Route path="/placement/dashboard" element={<ProtectedRoute><PlacementDashboard /></ProtectedRoute>} />
          <Route path="/placement/search" element={<ProtectedRoute><PlacementSearch /></ProtectedRoute>} />
          <Route path="/placement/dsa" element={<ProtectedRoute><DSAPractice /></ProtectedRoute>} />
          <Route path="/placement/group-discussion" element={<ProtectedRoute><GroupDiscussionPrep /></ProtectedRoute>} />
          <Route path="/placement/doubt-solving" element={<ProtectedRoute><DoubtSolving /></ProtectedRoute>} />
          <Route path="/placement/doubt-solving/:id" element={<ProtectedRoute><QuestionDetail /></ProtectedRoute>} />
          <Route path="/placement/interview-prep" element={<ProtectedRoute><InterviewPrep /></ProtectedRoute>} />
          <Route path="/placement/interview-prep/:id" element={<ProtectedRoute><CompanyPrepDetail /></ProtectedRoute>} />
          <Route path="/placement/mock-interviews" element={<ProtectedRoute><MockInterviews /></ProtectedRoute>} />
          
          <Route path="/study-groups" element={<ProtectedRoute><StudyGroups /></ProtectedRoute>} />
          <Route path="/study-groups/:id" element={<ProtectedRoute><StudyGroupDetail /></ProtectedRoute>} />
          <Route path="/placement/study-groups/:id" element={<ProtectedRoute><StudyGroupDetail /></ProtectedRoute>} />

          <Route path="/team-hunt" element={<ProtectedRoute><TeamHunt /></ProtectedRoute>} />
          <Route path="/team-hunt/dashboard" element={<ProtectedRoute><TeamHuntDashboard /></ProtectedRoute>} />
          <Route path="/team-hunt/leaderboard" element={<ProtectedRoute><TeamHuntLeaderboard /></ProtectedRoute>} />
          <Route path="/team-hunt/:id" element={<ProtectedRoute><TeamHuntDetail /></ProtectedRoute>} />
          <Route path="/team-hunt/:id/manage" element={<ProtectedRoute><TeamHuntManage /></ProtectedRoute>} />
          <Route path="/roommate-finder" element={<ProtectedRoute><RoommateFind /></ProtectedRoute>} />
          <Route path="/wellness" element={<ProtectedRoute><Wellness /></ProtectedRoute>} />
          <Route path="/room-rentals" element={<ProtectedRoute><RoomRentals /></ProtectedRoute>} />
          <Route path="/repair" element={<ProtectedRoute><Repair /></ProtectedRoute>} />
          <Route path="/dashboard/repair-requests" element={<ProtectedRoute><RepairRequests /></ProtectedRoute>} />
          <Route path="/qa-board" element={<ProtectedRoute><QABoard /></ProtectedRoute>} />
          {/* Virtual Classroom */}
          <Route path="/classrooms" element={<VirtualClassroom />} />
          <Route path="/class-preview/:id" element={<ClassPreview />} />
          <Route path="/classroom/:id" element={<ProtectedRoute><MeetingRoom /></ProtectedRoute>} />
          <Route path="/host-dashboard" element={<ProtectedRoute><HostDashboard /></ProtectedRoute>} />
          <Route path="/classroom/:id/recap" element={<ProtectedRoute><ClassroomRecap /></ProtectedRoute>} />
          <Route path="/roadmaps" element={<ProtectedRoute><Roadmaps /></ProtectedRoute>} />
          <Route path="/forum" element={<ProtectedRoute><Forum /></ProtectedRoute>} />

          <Route path="/skill-swap" element={<ProtectedRoute><SkillSwap /></ProtectedRoute>} />
          <Route path="/creators" element={<CreatorsZone />} />
          <Route path="/creators/profile/:id" element={<CreatorProfilePage />} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/scholarships" element={<ProtectedRoute><AdminScholarships /></ProtectedRoute>} />
          <Route path="/admin/creators" element={<ProtectedRoute><AdminCreatorsPanel /></ProtectedRoute>} />
          <Route path="/admin/users/:id/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/jobs" element={<ProtectedRoute><AdminJobsPanel /></ProtectedRoute>} />
          <Route path="/admin/colleges" element={<ProtectedRoute><AdminCollegePanel /></ProtectedRoute>} />
          <Route path="/admin/mentors" element={<ProtectedRoute><MentorsAdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/resumes" element={<ProtectedRoute><AdminResumeDashboard /></ProtectedRoute>} />
          <Route path="/admin/community" element={<ProtectedRoute><AdminCommunityPanel /></ProtectedRoute>} />
          <Route path="/admin/career-opportunities" element={<ProtectedRoute><AdminCareerOpportunities /></ProtectedRoute>} />
          <Route path="/admin/placement" element={<ProtectedRoute><AdminPlacementPanel /></ProtectedRoute>} />
          <Route path="/admin/study-groups" element={<ProtectedRoute><AdminStudyGroupsPanel /></ProtectedRoute>} />
          <Route path="/admin/quiz-reports" element={<ProtectedRoute><AdminQuizReports /></ProtectedRoute>} />
          <Route path="/admin/news-moderation" element={<ProtectedRoute><AdminNewsModeration /></ProtectedRoute>} />
          <Route path="/admin/classrooms" element={<ProtectedRoute><AdminClassroomsPanel /></ProtectedRoute>} />
          <Route path="/admin/skill-swap" element={<ProtectedRoute><AdminSkillSwapPanel /></ProtectedRoute>} />
          <Route path="/admin/room-rentals" element={<ProtectedRoute><AdminRoomRentalsPanel /></ProtectedRoute>} />
          <Route path="/admin/roommates" element={<ProtectedRoute><AdminRoommatesPanel /></ProtectedRoute>} />
          <Route path="/admin/hostels" element={<ProtectedRoute><AdminHostelsPanel /></ProtectedRoute>} />
          <Route path="/admin/repair" element={<ProtectedRoute><AdminRepairPanel /></ProtectedRoute>} />
          <Route path="/admin/salary-moderation" element={<ProtectedRoute><AdminSalaryModeration /></ProtectedRoute>} />
          <Route path="/admin/alumni" element={<ProtectedRoute><AdminAlumniPanel /></ProtectedRoute>} />
          <Route path="/recruiter/verify" element={<ProtectedRoute><RecruiterVerify /></ProtectedRoute>} />
          <Route path="/daily-hacks" element={<ProtectedRoute><DailyHacks /></ProtectedRoute>} />

          <Route path="/hostels" element={<ProtectedRoute><Hostels /></ProtectedRoute>} />
          <Route path="/hostels/inquiries" element={<ProtectedRoute><HostelInquiries /></ProtectedRoute>} />
          <Route path="/hostels/saved" element={<ProtectedRoute><SavedHostels /></ProtectedRoute>} />
          <Route path="/repair" element={<ProtectedRoute><Repair /></ProtectedRoute>} />
          <Route path="/founders-passport" element={<ProtectedRoute><FoundersPassport /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="/settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
          <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
          <Route path="/settings/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
          
        <Route path="/public/testimonial/:token" element={<PublicTestimonialForm />} />
        <Route path="/public/recommendation/:token" element={<PublicRecommendationForm />} />
      
        <Route path="/resume/workshops" element={<ResumeWorkshops />} />
        <Route path="/resume/workshops/:id" element={<WorkshopSession />} />
        <Route path="/resume/developer" element={<DeveloperSettings />} />
      </Routes>
              </Suspense>
            </ErrorBoundary>
          </MaintenanceModeWrapper>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
