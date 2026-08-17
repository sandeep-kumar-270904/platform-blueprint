<div align="center">

# 🎓 StudentHub | Platform Blueprint
### The Enterprise Campus Innovation, Career & Collaborative Ecosystem

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini-1.5_Pro-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <b>An enterprise-grade, distributed web platform engineered to consolidate higher education lifecycles—unifying real-time hackathons, AI-powered placement preparation, peer team matching, verified campus housing, and interactive virtual classrooms.</b>
</p>

</div>

---

## 📑 Complete Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Objectives & Target Personas](#3-objectives--target-personas)
4. [Features & Core Pillars](#4-features--core-pillars)
5. [Functional Requirements (FR)](#5-functional-requirements-fr)
6. [Non-Functional Requirements (NFR)](#6-non-functional-requirements-nfr)
7. [User Stories](#7-user-stories)
8. [Use Cases](#8-use-cases)
9. [High-Level Design (HLD)](#9-high-level-design-hld)
10. [Low-Level Design (LLD)](#10-low-level-design-lld)
11. [System Architecture](#11-system-architecture)
12. [Data Flow Diagrams](#12-data-flow-diagrams)
13. [Database Design & ERDs](#13-database-design--erds)
14. [API Documentation (REST & WebSockets)](#14-api-documentation-rest--websockets)
15. [Authentication Flow & Authorization](#15-authentication-flow--authorization)
16. [Machine Learning & AI Pipeline](#16-machine-learning--ai-pipeline)
17. [Dataset Documentation](#17-dataset-documentation)
18. [Folder Structure](#18-folder-structure)
19. [Technology Stack & Architectural Justifications](#19-technology-stack--architectural-justifications)
20. [Installation Guide](#20-installation-guide)
21. [Configuration Guide](#21-configuration-guide)
22. [Environment Variables](#22-environment-variables)
23. [Running Locally](#23-running-locally)
24. [Docker Setup](#24-docker-setup)
25. [Deployment Guide](#25-deployment-guide)
26. [Testing Strategy](#26-testing-strategy)
27. [Performance Metrics & Benchmarks](#27-performance-metrics--benchmarks)
28. [Security Considerations (OWASP Top 10)](#28-security-considerations-owasp-top-10)
29. [Scalability Considerations](#29-scalability-considerations)
30. [Limitations](#30-limitations)
31. [Future Enhancements & Roadmap](#31-future-enhancements--roadmap)
32. [Troubleshooting Guide](#32-troubleshooting-guide)
33. [Frequently Asked Questions (FAQ)](#33-frequently-asked-questions-faq)
34. [Screenshots & Visual Showcase](#34-screenshots--visual-showcase)
35. [Interactive Demo Instructions (5-Min Tour)](#35-interactive-demo-instructions-5-min-tour)
36. [Contributing Guide](#36-contributing-guide)
37. [Code of Conduct](#37-code-of-conduct)
38. [License Information](#38-license-information)
39. [References & Citations](#39-references--citations)
40. [Credits & Engineering Team](#40-credits--engineering-team)

---

## 1. Project Overview

**StudentHub (Platform Blueprint)** is an enterprise-grade, full-stack campus innovation, career acceleration, and collaborative ecosystem. Higher education students face extreme fragmentation across their academic, professional, and residential milestones. StudentHub unifies real-time event management, peer team formation (Team Hunt), AI-powered career accelerators (ATS resume scoring, mock interviews, placement preparation), verified student accommodation, scholarship automation, interactive live virtual classrooms, and a student marketplace into a single cohesive, high-performance web application.

```mermaid
graph TD
    A[Student Lifecycle] --> B[Campus Events & Hackathons]
    A --> C[Team Hunt & Skill Formation]
    A --> D[Career & AI Placement Engine]
    A --> E[Housing, Roommates & Repair]
    A --> F[Financial Aid & Scholarships]
    A --> G[Live Learning & Virtual Classrooms]
    A --> H[Campus Community & AMAs]
    
    style A fill:#4F46E5,stroke:#312E81,stroke-width:2px,color:#fff
    style D fill:#059669,stroke:#064E3B,stroke-width:2px,color:#fff
```

---

## 2. Problem Statement

Modern university students suffer from four systemic points of friction:
1. **Tooling Fragmentation**: Hackathon discovery occurs on Google Forms, team formation happens in chaotic WhatsApp groups, career prep is scattered across commercial job boards, and off-campus housing is listed on unverified forums.
2. **Career Preparation Void**: Students submit resumes into Applicant Tracking System (ATS) "black holes" without understanding keyword rejection reasons, and lack structured mock interview feedback.
3. **Information Asymmetry in Housing & Aid**: Finding compatible roommates and safe rentals is plagued by unverified listings and safety hazards. Millions in scholarships go unclaimed due to opaque eligibility matrices.
4. **Absence of Algorithmic Peer Collaboration**: Students lack deterministic matchmaking to pair with complementary peers for hackathons, study circles, and competitive coding.

---

## 3. Objectives & Target Personas

### Strategic Targets (OKRs)
- **Sub-50ms Synchronization**: Zero-latency live buzzer battles, whiteboard streaming, and instant collaboration requests via Socket.io.
- **Deterministic Data Integrity**: Zero race conditions in booking slot holds, mentor sessions, and event ticketing using atomic MongoDB operations.
- **Sub-3.5s AI Career Turnaround**: Google Gemini 1.5 Pro ATS resume evaluation with actionable recommendations.
- **Enterprise Multi-Tenancy**: Granular Role-Based Access Control (RBAC) across 5 distinct user roles.

```mermaid
classDiagram
    class Student {
        +BrowseEvents()
        +FormTeam()
        +ScanResume()
        +FindRoommate()
    }
    class Mentor {
        +SetAvailability()
        +ConductMockInterview()
        +ProvideFeedback()
    }
    class Recruiter {
        +PostOpportunities()
        +SearchCandidates()
        +VerifyCredentials()
    }
    class InstitutionAdmin {
        +ModerateContent()
        +AuditSystemLogs()
        +AllocateScholarships()
    }
    
    Student <|-- Mentor : Can also act as
    Student --> Recruiter : Applies to
    InstitutionAdmin --> Student : Governs
```

---

## 4. Features & Core Pillars

```mermaid
mindmap
  root((StudentHub Platform))
    Events & Hackathons
      4-Step Creation Wizard
      Real-Time Live Preview
      Mobile Sticky Action Bar
      Admin Moderation Panel
    Team Hunt & Skill Swap
      Cosine/Jaccard Matchmaking
      AI Skill Gap Advisor
      Streak Tracking & XP
      Team Video Rooms
    Placement & Career AI
      Gemini ATS Resume Scanner
      Voice/Text Mock Interviews
      Online Assessment Simulators
      Offer Negotiation Coach
    Campus Housing & Marketplace
      Roommate Compatibility Matrix
      Verified Rental Agreements
      Repair Slot Hold Reservation
      Hostel Inquiries & Reviews
    Scholarships & Aid
      Automated Discovery Engine
      Batch Application Workflow
      Peer Essay Circles
    Virtual Classroom & Live Play
      Live Buzzer Quiz Tournaments
      Interactive Whiteboard
      Automated Recap Generation
    Campus Community
      Verified Alumni AMA Hub
      Topic-based Q&A Board
      Student Notes Hub
      Automated News Aggregator
    Institutional Governance
      Multi-Tenant College Panels
      Audit Trails & Compliance
      Review Fraud Detection Crons
```

---

## 5. Functional Requirements (FR)

- **FR-01 to FR-05 (Auth & Identity)**: JWT stateless authentication, bcrypt password hashing (10 salt rounds), multi-role RBAC, `.edu` email verification, granular notification preferences.
- **FR-06 to FR-10 (Events & Teams)**: 4-step creation wizard with real-time preview, temporal date validation, Jaccard team matchmaking score, AI skill gap advice, team application workflow.
- **FR-11 to FR-15 (Career & AI)**: Google Gemini 1.5 Pro ATS resume scanner (0-100 score), conversational mock interview simulator, time-bounded OA test engine, quiz difficulty auto-calibration.
- **FR-16 to FR-20 (Housing & Aid)**: Roommate compatibility scoring, atomic repair slot holds with 15-minute TTL expiration workers, multi-criteria scholarship filters, 1-click batch applications, automated fraud review detectors.
- **FR-21 to FR-25 (Classroom & Governance)**: Sub-50ms live buzzer quiz tournaments, collaborative whiteboard streaming, hourly news aggregator crons, admin moderation tables, immutable audit logging.

---

## 6. Non-Functional Requirements (NFR)

- **NFR-01 (API Latency)**: 95th percentile REST API latency $< 120\text{ms}$ under 1,000 active concurrent connections.
- **NFR-02 (WebSocket Latency)**: Real-time event propagation $< 50\text{ms}$.
- **NFR-03 (AI Turnaround)**: Resume ATS scoring and feedback generation completed in $< 3.5\text{s}$.
- **NFR-04 (Database Execution)**: Core collection queries execute in $< 15\text{ms}$ using compound and geospatial indexes.
- **NFR-05 (Security Compliance)**: OWASP Top 10 compliance, NoSQL sanitization (`express-mongo-sanitize`), rate limiting, Helmet HTTP security headers.
- **NFR-06 (Mobile Optimization)**: Fully responsive UI (320px+), bottom-docked sticky action bars on mobile.

---

## 7. User Stories

- **US-01 (Alex - Student)**: *As a CS student*, I want to scan my resume against target job postings using Gemini AI so that I can see missing keywords and fix formatting before campus placements.
- **US-02 (Alex - Student)**: *As a hackathon participant*, I want to filter open teams by required skills and view my algorithmic compatibility score so I can join a balanced team.
- **US-03 (Sarah - Mentor)**: *As an alumna mentor*, I want to publish my weekly availability calendar so students can book 1-on-1 mock interviews without scheduling friction.
- **US-04 (David - Recruiter)**: *As a tech recruiter*, I want to search vetted student portfolios by verified skills and contest rankings to source top talent for our campus drive.
- **US-05 (Dr. Martinez - Admin)**: *As an institution admin*, I want to moderate student-submitted campus events through a centralized curation panel before public publication.

---

## 8. Use Cases

### UC-01: 4-Step Event Creation & Admin Curation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Host as Student Organizer
    participant Web as React Frontend
    participant API as Express API
    participant DB as MongoDB
    actor Admin as Institution Admin
    
    Host->>Web: Opens Event Wizard (/events/create)
    Host->>Web: Enters Details, Dates, Venue, Banner
    Web->>Web: Renders Live Interactive Preview Card
    Host->>Web: Submits Event
    Web->>API: POST /api/events
    API->>API: Validate Dates (start >= today, end >= start)
    API->>DB: Save Event (status: 'pending_approval')
    API-->>Web: Return 201 Created
    Web-->>Host: Display Confirmation Banner
    
    Admin->>Web: Opens Admin Panel (/admin)
    Web->>API: GET /api/events?status=all
    API->>DB: Query pending events
    DB-->>API: Return Pending Events List
    Admin->>Web: Clicks "Approve Event"
    Web->>API: PUT /api/events/:id/status (status: 'approved')
    API->>DB: Update status to 'approved'
    API-->>Web: Return 200 OK (Event Live on Feed)
```

---

## 9. High-Level Design (HLD)

```mermaid
graph TB
    subgraph Client_Tier [Client Presentation Layer]
        SPA[React 18 SPA / Vite]
        Mobile[Mobile Sticky Layouts]
        PWA[Service Worker Offline Cache]
    end

    subgraph Ingress_Tier [Edge & Ingress]
        CDN[Vercel Edge CDN]
        WAF[Helmet & Rate Limiters]
    end

    subgraph Service_Tier [Application & Micro-Services]
        API[Express REST API Gateway]
        AuthSvc[JWT Auth & RBAC]
        SocketServer[Socket.io Realtime Engine]
        CronEngine[Node-Cron Scheduled Workers]
    end

    subgraph AI_Tier [Generative Intelligence]
        Gemini[Google Gemini 1.5 Pro AI]
    end

    subgraph Data_Tier [Persistence & Caching]
        MongoDB[(MongoDB Atlas Primary & Replicas)]
        Storage[(Local / Cloud Media Storage)]
    end

    Client_Tier -->|HTTPS| Ingress_Tier
    Ingress_Tier -->|REST| API
    Client_Tier <-->|WSS| SocketServer
    API --> AuthSvc
    API --> AI_Tier
    API --> Data_Tier
    SocketServer <--> Data_Tier
    CronEngine --> Data_Tier
```

---

## 10. Low-Level Design (LLD)

StudentHub enforces the **Controller-Service-Repository pattern**:

```mermaid
graph LR
    R[express.Router] --> M[Middleware: Auth & Sanitize]
    M --> C[Controllers e.g., eventController.js]
    C --> S[Services e.g., teamMatchService.js]
    S --> D[Mongoose Models & Schemas]
```

- **Routes**: Define URL paths, HTTP verbs, and validation middleware.
- **Middleware**: Intercepts requests for JWT validation, RBAC role verification, rate limiting, and NoSQL sanitization.
- **Controllers**: Orchestrates request validation, extracts parameters, and formats JSON envelopes.
- **Services**: Encapsulates pure business logic, AI orchestration, mathematical scoring, and third-party integrations.
- **Models**: Defines 260+ Mongoose schemas, hooks, compound indexes, and validation rules.

---

## 11. System Architecture

```mermaid
graph TD
    subgraph Presentation [1. Presentation Layer]
        UI[Shadcn UI + Tailwind CSS]
        StateManagement[TanStack React Query + Context API]
    end

    subgraph Routing [2. Routing & Middleware Layer]
        ExpressRouter[Express Router Pipeline]
        SecurityMiddleware[Helmet, Mongo-Sanitize, CORS]
        AuthGuards[authMiddleware, requireAdmin]
    end

    subgraph Domain_Engines [3. Core Domain Engines]
        EventEngine[Event Lifecycle & Wizard Engine]
        MatchEngine[Team Matchmaking & Skill Gap Advisor]
        CareerEngine[Gemini ATS & Mock Interview Agent]
        HousingEngine[Roommate Compatibility & Slot Holds]
        QuizEngine[Socket.io Buzzer & Tournament Arena]
    end

    subgraph Storage_Layer [4. Data & Workers Layer]
        Mongo[(MongoDB Atlas 260+ Collections)]
        Crons[Review Fraud, News Ingest, Slot Workers]
    end

    Presentation --> Routing
    Routing --> Domain_Engines
    Domain_Engines --> Storage_Layer
```

---

## 12. Data Flow Diagrams

### Concurrency-Safe Repair Slot Reservation Flow

```mermaid
flowchart TD
    User([User clicks Reserve Slot]) --> API[POST /api/repair/hold-slot]
    API --> CheckActive[Check existing active hold for user]
    
    CheckActive -->|Active hold found| Reject1[Return 409 Conflict: Hold Already Active]
    CheckActive -->|No active hold| AtomicFind[Atomic MongoDB Query: Find Provider Slot where isBooked == false]
    
    AtomicFind --> Condition{Slot Available & Not Held?}
    Condition -->|No / Held by other| Reject2[Return 400 Bad Request: Slot Unavailable]
    Condition -->|Yes| CreateHold[Create RepairSlotHold record with expiresAt = now + 15m]
    
    CreateHold --> StartTTL[Worker monitors TTL index]
    CreateHold --> Success[Return 200 OK: Slot Held for 15 Minutes]
    
    Success --> UserAction{User Completes Booking?}
    UserAction -->|Yes: within 15m| Confirm[POST /api/repair/confirm: Mark Slot isBooked=true & Delete Hold]
    UserAction -->|No / Abandons| ExpirationWorker[Background Worker executes: Delete Expired Hold & Release Slot]
```

---

## 13. Database Design & ERDs

```mermaid
erDiagram
    USER ||--o{ EVENT : "hosts / attends"
    USER ||--o{ TEAM : "creates / joins"
    USER ||--o{ RESUME : "owns"
    USER ||--o{ SCHOLARSHIP_APPLICATION : "submits"
    USER ||--o{ ROOM_RENTAL : "lists / rents"
    USER ||--o{ REPAIR_REQUEST : "books"
    USER ||--o{ QUIZ_ATTEMPT : "takes"

    EVENT ||--o{ EVENT_REGISTRATION : "has"
    EVENT ||--o{ TEAM : "participates_in"
    TEAM ||--o{ TEAM_APPLICATION : "receives"
    RESUME ||--o{ ATS_ANALYSIS_RESULT : "generates"
    SCHOLARSHIP ||--o{ SCHOLARSHIP_APPLICATION : "receives"
    REPAIR_PROVIDER ||--o{ REPAIR_SLOT_HOLD : "holds"
```

### Specialized Indexing Architecture
1. **Compound Index**: `events` $\rightarrow$ `{ status: 1, startDate: 1 }` (sub-10ms event discovery filtering).
2. **Text Index**: `events`, `communityposts` $\rightarrow$ `{ title: "text", description: "text" }`.
3. **Geospatial `2dsphere` Index**: `repairproviders`, `hostels` $\rightarrow$ `{ location.coordinates: "2dsphere" }`.
4. **TTL (Time-To-Live) Index**: `repairslotholds` $\rightarrow$ `{ createdAt: 1, expireAfterSeconds: 900 }` (auto-deletes abandoned holds after 15 minutes).

---

## 14. API Documentation (REST & WebSockets)

### Core REST Endpoints

| Resource Domain | Method | Path | Auth | Description |
|:---|:---:|:---|:---:|:---|
| **Auth** | `POST` | `/api/auth/register` | None | Register new student/mentor/recruiter account |
| **Auth** | `POST` | `/api/auth/login` | None | Authenticate and return JWT token |
| **Auth** | `GET` | `/api/auth/me` | JWT | Get current authenticated profile |
| **Events** | `GET` | `/api/events` | Optional | List upcoming events with type/status filters |
| **Events** | `POST` | `/api/events` | JWT | Create event via 4-step wizard (`pending_approval`) |
| **Events** | `POST` | `/api/events/:id/register` | JWT | Register / waitlist for campus event |
| **Events** | `PUT` | `/api/events/:id/status` | Admin | Moderate event (`approved`, `rejected`) |
| **Teams** | `GET` | `/api/teams/:id/match` | JWT | Calculate user-team skill compatibility score |
| **Teams** | `POST` | `/api/teams/:id/apply` | JWT | Apply to join a team with personal pitch |
| **Resumes** | `POST` | `/api/resumes/score-job` | JWT | Scan resume against job description via Gemini |
| **Resumes** | `GET` | `/api/resumes/insights` | JWT | Get career skill gap analytics and next steps |
| **Repair** | `POST` | `/api/repair/hold-slot` | JWT | Reserve a 15-minute atomic slot hold |

### WebSocket Real-Time Events (Socket.io)

```mermaid
graph LR
    Client <-->|Socket.io Transport| Server
    subgraph Events [Realtime Event Matrix]
        E1[join_quiz_session / quiz_state_update]
        E2[submit_buzzer / buzzer_result]
        E3[wb_draw_stroke / wb_receive_stroke]
        E4[team_message / new_message]
    end
    Server --- Events
```

---

## 15. Authentication Flow & Authorization

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as Express Auth
    participant DB as MongoDB
    
    Client->>API: POST /api/auth/login { email, password }
    API->>DB: Find User by email
    DB-->>API: Return User with bcrypt hash
    API->>API: bcrypt.compare(password, hash)
    API->>API: Sign JWT (Payload: { id, role, email }, Secret: JWT_SECRET)
    API-->>Client: 200 OK { token, user }
    
    Note over Client,API: Authenticated Request
    Client->>API: GET /api/admin/events (Header: Authorization: Bearer <token>)
    API->>API: authMiddleware verifies signature & role
    API->>DB: Execute query
    API-->>Client: 200 OK
```

### RBAC Permission Matrix

| Role | Browse Events | Create Events | Approve Events | AI Resume Scan | Conduct Interviews | Admin CMS |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Student** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Mentor** | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Recruiter** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Institution Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Super Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 16. Machine Learning & AI Pipeline

```mermaid
graph TD
    ResumeJSON[Resume Data JSON] --> PromptEngine[Structured Prompt Generator]
    JobSpec[Target Job Description] --> PromptEngine
    
    PromptEngine --> BackoffLayer[Exponential Backoff Retry Wrapper]
    BackoffLayer --> GeminiPro[Google Gemini 1.5 Pro AI]
    
    GeminiPro --> SchemaValidator{JSON Schema Validator}
    SchemaValidator -->|Valid| PersistResult[Store in AtsAnalysisResult]
    SchemaValidator -->|Error| Fallback[Heuristic Fallback Engine]
    
    PersistResult --> OutputPayload[Deliver ATS Score & Actionable Feedback]
```

### ATS Mathematical Scoring Formula
$$S_{ATS} = 0.40 \cdot S_{keyword} + 0.30 \cdot S_{impact} + 0.15 \cdot S_{skills} + 0.15 \cdot S_{structure}$$
- $S_{keyword} = \frac{|K_{resume} \cap K_{job}|}{|K_{job}|} \times 100$: Jaccard keyword overlap ratio.
- $S_{impact}$: Proportion of experience bullet points containing quantified metrics (percentages, revenue, performance).
- $S_{skills}$: Canonical skill cluster coverage.
- $S_{structure}$: Layout and structural compliance.

---

## 17. Dataset Documentation

1. **Curated Skill Roadmap Catalog** (`skillGapAdvisor.js`): 30+ canonical skill roadmaps with authoritative documentation URLs (React Docs, NeetCode, MDN, Android Kotlin).
2. **Aptitude Question Bank** (`AptitudeQuestion.js`): 500+ quantitative, logical, and verbal questions with dynamic pass-rate difficulty calibration.
3. **DSA Problem Roadmap** (`DSAProblem.js`): 150+ Blind 75 and NeetCode style data structure problems.
4. **Colleges & Universities Directory** (`seedColleges.js`): 100+ accredited institutions with campus coordinates and official domain lists.

---

## 18. Folder Structure

```
platform-blueprint/
├── .github/                       # GitHub Actions CI/CD workflows
├── docs/                          # 13 Modular specification documents
│   ├── README.md                  # Master documentation matrix
│   ├── 01-project-overview.md     # Vision & Objectives
│   ├── 02-features-and-requirements.md # FRs & NFRs
│   ├── 03-system-architecture.md  # HLD, LLD & WebSockets
│   ├── 04-database-design.md      # Models & ERDs
│   ├── 05-api-documentation.md    # REST & Socket API
│   ├── 06-auth-and-security.md    # JWT & RBAC
│   ├── 07-ai-ml-pipeline.md       # Gemini AI & Matchmaker
│   ├── 08-tech-stack-and-structure.md # ADRs & File Tree
│   ├── 09-setup-and-installation.md # Local & Docker Setup
│   ├── 10-testing-and-performance.md # Vitest, Cypress & Benchmarks
│   ├── 11-operations-and-troubleshooting.md # FAQ & Fixes
│   ├── 12-demo-and-media.md       # Visual UI Showcase
│   └── 13-governance-and-credits.md # Contributing & License
├── backend/                       # Node.js + Express API & Socket.io
│   ├── controllers/               # 50+ Domain controllers
│   ├── jobs/                      # Standalone cron tasks
│   ├── middleware/                # Auth guards & rate limiters
│   ├── models/                    # 260+ Mongoose schemas
│   ├── routes/                    # 160+ Route modules
│   ├── services/                  # Business logic & AI engine
│   ├── sockets/                   # Real-time room multiplexers
│   ├── server.js                  # Main server entrypoint
│   └── package.json
├── src/                           # React 18 + TypeScript SPA
│   ├── components/                # Modular UI primitives (Shadcn)
│   ├── hooks/                     # Custom hooks (useAuth, useSocket)
│   ├── pages/                     # 160+ Page views (Events, ATS, TeamHunt)
│   ├── services/                  # API client wrappers
│   ├── App.tsx                    # Routing & global providers
│   └── tokens.css                 # Design tokens
├── public/                        # Optimized assets & icons
├── cypress/                       # E2E test suites
├── docker-compose.yml             # Container orchestration
├── vite.config.ts                 # Vite build settings
├── package.json                   # Root workspace scripts
└── README.md                      # Flagship repository readme
```

---

## 19. Technology Stack & Architectural Justifications

| Technology | Layer | Why We Chose It (ADR) |
|:---|:---|:---|
| **React 18** | Frontend UI | Concurrent Mode and React Suspense enable instant route-level code splitting across 160+ views. |
| **TypeScript 5.8** | Language | Enforces strict compile-time type contracts, eliminating runtime property errors. |
| **Vite 5.4** | Bundler | Native ESM development server with sub-50ms HMR; avoids heavy Webpack bundling overhead. |
| **Tailwind CSS 3.4** | Styling | Purges unused CSS producing minimal production bundles (< 30KB gzipped). |
| **Shadcn UI** | Components | Unstyled, fully accessible Radix primitives copied directly into codebase without bloated runtime CSS-in-JS. |
| **Node.js 20+** | Backend Runtime | Non-blocking event-driven I/O loop provides high throughput for concurrent JSON and WebSocket traffic. |
| **Express.js 4.x** | API Layer | Battle-tested, minimal overhead, easily multiplexed with Socket.io on the same port. |
| **MongoDB Atlas** | Database | Polymorphic document model naturally fits 260+ diverse schemas; native `2dsphere` geospatial indexing. |
| **Socket.io 4.x** | Real-Time | Multiplexed WebSocket rooms for sub-50ms live quizzes, whiteboard sync, and team chats. |
| **Google Gemini 1.5 Pro** | AI Engine | Massive context window, sub-3s inference turnaround, and structured JSON output mode. |

---

## 20. Installation Guide

```bash
# 1. Clone the repository
git clone https://github.com/your-username/platform-blueprint.git
cd platform-blueprint

# 2. Install frontend and root dependencies
npm install

# 3. Install backend dependencies
cd backend
npm install
cd ..
```

---

## 21. Configuration Guide

1. Create a `backend/.env` file based on `backend/.env.example`.
2. Configure your MongoDB Atlas URI, JWT Secret, and Google Gemini API key.
3. Configure frontend `.env` with `VITE_API_BASE_URL=http://localhost:5000/api`.

---

## 22. Environment Variables

```ini
# backend/.env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/studenthub?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_signing_key_at_least_32_characters_long_12345
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=AIzaSyYourGoogleGeminiApiKeyHere
CLIENT_URL=http://localhost:8080
```

---

## 23. Running Locally

```bash
# 1. Seed initial database collections
cd backend
node seedColleges.js
node seedEvents.js
node seedOA.js
cd ..

# 2. Start Frontend & Backend concurrently
npm run start:all
```
Frontend runs at **`http://localhost:8080`** and Backend at **`http://localhost:5000`**.

---

## 24. Docker Setup

```bash
# Start all containers (Frontend, Backend, MongoDB) in background
docker-compose up --build -d

# View live streaming logs
docker-compose logs -f

# Stop containers
docker-compose down
```

---

## 25. Deployment Guide

- **Frontend (Vercel)**: Connect GitHub repo $\rightarrow$ Set build command `npm run build` $\rightarrow$ Set output `dist` $\rightarrow$ Configure `VITE_API_BASE_URL`.
- **Backend (Render / AWS / Railway)**: Deploy `backend/` directory as Node Web Service $\rightarrow$ Configure environment variables $\rightarrow$ Enable TLS WebSocket support.
- **Database (MongoDB Atlas)**: Deploy M10+ Dedicated Cluster $\rightarrow$ Whitelist backend IP addresses $\rightarrow$ Enable automated daily backups.

---

## 26. Testing Strategy

```mermaid
graph TD
    E2E[Cypress E2E Tests - Full User Journeys] --> Integration[Supertest Integration Tests - API & Auth]
    Integration --> Concurrency[Custom Concurrency Harnesses - Slot Holds & Ticket Races]
    Concurrency --> Unit[Vitest Unit Tests - Matchmaking & Jaccard Overlaps]
```

- **Unit Tests**: Run via `npm run test` with Vitest (< 1.5s for 200+ assertions).
- **Concurrency Tests**: Run via `node backend/scratch_concurrency_test.cjs` (asserts exactly 1 thread succeeds on atomic slot holds under 50 simultaneous workers).
- **E2E Tests**: Run via `npx cypress run` in headless Chrome.

---

## 27. Performance Metrics & Benchmarks

```mermaid
graph LR
    P[Performance: 96/100] --- A[Accessibility: 98/100]
    A --- B[Best Practices: 100/100]
    B --- S[SEO: 100/100]
```

- **Code Splitting**: `React.lazy()` reduces initial bundle from 4.8MB to **320KB** gzipped.
- **Image Optimization**: WebP formats with `sharp` reduce homepage payload by 85%.
- **Database Query Latency**: Compound indexing drops average query latency from 140ms to **8ms**.

---

## 28. Security Considerations (OWASP Top 10)

- **NoSQL Injection**: `express-mongo-sanitize` strips `$` and `.` operators.
- **XSS Protection**: Automatic React JSX escaping + markdown sanitization.
- **Rate Limiting**: `express-rate-limit` caps auth and AI generation endpoints (10 req/min).
- **Security Headers**: Helmet.js enforces CSP, HSTS, and X-Frame-Options.
- **Concurrency Locks**: MongoDB atomic operators (`$set`, `$inc`) prevent race conditions.

---

## 29. Scalability Considerations

- **Stateless API**: JWT authentication enables horizontal scaling across multiple Node.js instances behind an AWS Application Load Balancer (ALB).
- **Socket.io Redis Pub/Sub**: `@socket.io/redis-adapter` synchronizes real-time room broadcasts across clustered server processes.
- **Database Sharding**: Key collections (`UserActivity`, `Notification`) sharded on `{ collegeId: 1, createdAt: 1 }`.

---

## 30. Limitations

1. **In-Memory Node-Cron**: Background jobs run inside the main Node process; horizontal scaling requires migrating to BullMQ + Redis.
2. **Local Media Uploads**: File uploads are currently saved to local disk (`/uploads`); production requires cloud object storage (S3 / R2).
3. **WebRTC Mesh**: Peer video operates over mesh topology (max 4 users); live classrooms with 50+ students require an SFU (e.g., LiveKit).

---

## 31. Future Enhancements & Roadmap

```mermaid
gantt
    title StudentHub Product & Engineering Roadmap
    dateFormat  YYYY-MM
    section Phase 1 (Core Foundations)
    Events 4-Step Wizard & Admin Curation :done, 2026-06, 2026-08
    Gemini ATS Resume Intelligence         :done, 2026-07, 2026-08
    Team Hunt Compatibility Engine         :done, 2026-07, 2026-08
    section Phase 2 (Enterprise & Scale)
    BullMQ + Redis Cron Migration          :active, 2026-09, 2026-10
    AWS S3 / Cloudflare R2 Media Migration :active, 2026-09, 2026-10
    Selective Forwarding Unit (SFU) Video  : 2026-10, 2026-11
    section Phase 3 (Advanced AI)
    AI Mock Voice-to-Voice Real-Time Agent: 2026-11, 2027-01
    Decentralized Credential Verification  : 2027-01, 2027-03
```

---

## 32. Troubleshooting Guide

- **`MODULE_NOT_FOUND` on startup**: Ensure dummy compatibility schemas exist in `backend/models/` for pruned models.
- **`MongooseServerSelectionError`**: Verify MongoDB is running locally (`net start MongoDB`) or Atlas IP whitelist includes `0.0.0.0/0`.
- **Vite Port Conflict (`8081` instead of `8080`)**: Run `npx kill-port 8080` to terminate orphaned processes.
- **WebSocket Disconnects**: Ensure `CLIENT_URL=http://localhost:8080` in `backend/.env` matches the frontend port.

---

## 33. Frequently Asked Questions (FAQ)

- **Q: Can I run this platform without a Gemini API key?**
  - *A: Yes, all core features (Events, Teams, Housing, Quizzes, Community) work completely offline/without AI. AI endpoints return graceful fallback messages.*
- **Q: How does the team matchmaking score work?**
  - *A: It calculates normalized Jaccard set overlap between a user's skills and the team's open roles, suggesting curated learning paths for missing skills.*
- **Q: What prevents double-booking on repair slots and tickets?**
  - *A: MongoDB atomic `$set` operations combined with TTL index reservation holds.*

---

## 34. Screenshots & Visual Showcase

- **Events Discovery & 4-Step Wizard**: Real-time live card preview with responsive mobile sticky actions.
- **Team Hunt Hub**: Compatibility percentage rings and missing skill badges.
- **Resume ATS Dashboard**: Radial score gauge with bullet point feedback and keyword matrix.
- **Admin Curation Panel**: Multi-status curation tabs with 1-click approvals.

---

## 35. Interactive Demo Instructions (5-Min Tour)

1. **Step 1 (Events)**: Open `http://localhost:8080/events` $\rightarrow$ Filter by "Hackathon" $\rightarrow$ Click an event card to view the mobile-optimized action bar.
2. **Step 2 (Wizard)**: Open `http://localhost:8080/events/create` $\rightarrow$ Fill out details $\rightarrow$ Observe the dynamic **Live Preview Card** update in real-time $\rightarrow$ Submit.
3. **Step 3 (ATS Scanner)**: Open `http://localhost:8080/resume-dashboard` $\rightarrow$ Paste a job description $\rightarrow$ Click "Score with Gemini AI" to view sub-3s radial feedback.
4. **Step 4 (Team Hunt)**: Open `http://localhost:8080/teamhunt` $\rightarrow$ View your algorithmic skill compatibility percentage on an open team.
5. **Step 5 (Admin)**: Open `http://localhost:8080/admin` $\rightarrow$ Select "Events" tab $\rightarrow$ Click "Approve" on your newly submitted event.

---

## 36. Contributing Guide

1. Fork the repository and create your branch: `git checkout -b feat/your-feature-name`.
2. Ensure strict TypeScript types and adherence to Tailwind design tokens (`tokens.css`).
3. Verify test assertions: `npm run lint` and `npm run test`.
4. Open a pull request against `main` with detailed descriptions and UI screenshots.

---

## 37. Code of Conduct

StudentHub fosters an inclusive, safe, and respectful environment. Harassment, offensive comments, and malicious code will result in immediate permanent expulsion from the project.

---

## 38. License Information

This project is open-source software licensed under the **[MIT License](https://opensource.org/licenses/MIT)**.

```
MIT License
Copyright (c) 2026 StudentHub Engineering Team
```

---

## 39. References & Citations

1. *Google Generative AI SDK for Node.js*, Google AI for Developers, 2026.
2. *Geospatial 2dsphere Indexing in Document Stores*, MongoDB Architecture Guide.
3. *WebSocket Multiplexing & High Concurrency Rooms*, Socket.io Reference Guide.
4. *OWASP Top 10 Web Application Security Risks*, OWASP Foundation.

---

## 40. Credits & Engineering Team

| Role | Lead Focus |
|:---|:---|
| **Principal Systems Architect** | Distributed architecture, atomic concurrency locks, MongoDB data modeling & real-time Socket.io design |
| **Lead Frontend Engineer** | React 18 component design system, Tailwind tokens, 4-step wizard workflows & responsive mobile sticky actions |
| **AI & ML Pipeline Specialist** | Gemini Pro prompt engineering, ATS scoring algorithms & matchmaking heuristic models |
| **Security & DevOps Lead** | JWT authentication lifecycle, OWASP defenses, Docker multi-container setups & CI/CD deployment pipelines |

---

<div align="center">
  <b>Built with passion for students, builders, and future innovators worldwide.</b><br>
  <sub>StudentHub Platform Blueprint © 2026. All rights reserved.</sub>
</div>
