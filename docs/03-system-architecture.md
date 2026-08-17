# 03. System Architecture & Design

---

## 1. High-Level Design (HLD)

StudentHub is structured as a **modern multi-tier, event-driven web application**. The system separates client-side presentation, API gateway and business services, asynchronous background workers, generative AI engines, and persistent database layers.

```mermaid
graph TB
    subgraph Client_Tier [Client Presentation Layer]
        SPA[React 18 SPA / Vite]
        Mobile[Mobile Responsive Viewports]
        PWA[Service Worker / Offline Cache]
    end

    subgraph Edge_Gateway [Ingress & Edge Layer]
        CDN[Vercel Edge CDN]
        WAF[Cloudflare / Helmet Security Headers]
    end

    subgraph Application_Tier [Application & Micro-Services Layer]
        API[Express REST API Gateway]
        AuthSvc[JWT / Session Auth Service]
        SocketServer[Socket.io Realtime Engine]
        CronEngine[Node-Cron Scheduled Workers]
    end

    subgraph Intelligence_Tier [AI & External Services]
        Gemini[Google Gemini 1.5 Pro AI]
        EmailGateway[SMTP / Nodemailer Gateway]
        CalendarGateway[iCal / Google Calendar Sync]
    end

    subgraph Data_Tier [Persistence & Caching Layer]
        MongoPrimary[(MongoDB Atlas Primary)]
        MongoReplica[(MongoDB Read Replicas)]
        Storage[(Local / Cloud Object Storage)]
    end

    Client_Tier -->|HTTPS / TLS 1.3| Edge_Gateway
    Edge_Gateway -->|REST Endpoints| API
    Client_Tier <-->|WSS / WebSockets| SocketServer
    
    API --> AuthSvc
    API --> Intelligence_Tier
    API --> Data_Tier
    
    CronEngine -->|Batch Ingestion & Cleanup| Data_Tier
    CronEngine -->|Email Notifications| EmailGateway
    
    SocketServer <-->|Room Management| Data_Tier
```

### Architectural Highlights
1. **Separation of Concerns**: Presentation (React SPA), Business Logic (Express Services), and Persistence (MongoDB Mongoose) are strictly decoupled.
2. **Bi-directional WebSocket Rooms**: Socket.io provides isolated rooms for live quizzes, group discussions, classroom collaboration, and real-time team chats.
3. **Resilient Background Processing**: Node-cron schedules automated jobs for news ingestion, 30-day notification cleanup, slot reservation expiration, and review fraud detection.

---

## 2. Low-Level Design (LLD) & Service Layering

The backend codebase adheres to the **Controller-Service-Repository pattern**, ensuring testability, maintainability, and clean dependency management:

```mermaid
graph LR
    subgraph Route_Layer [1. Routing Layer]
        R[express.Router]
    end
    
    subgraph Middleware_Layer [2. Middleware Pipeline]
        M1[authMiddleware]
        M2[rateLimiter]
        M3[mongoSanitize]
        M4[roleGuard]
    end
    
    subgraph Controller_Layer [3. Controller Layer]
        C[Domain Controllers e.g., eventController.js]
    end
    
    subgraph Service_Layer [4. Business Logic Services]
        S1[teamMatchService.js]
        S2[geminiService.js]
        S3[notificationService.js]
    end
    
    subgraph Model_Layer [5. Data Access Layer]
        M[Mongoose Models & Schemas]
    end
    
    R --> Middleware_Layer
    Middleware_Layer --> Controller_Layer
    Controller_Layer --> Service_Layer
    Service_Layer --> Model_Layer
```

### Backend Request Lifecycle

```
HTTP Request 
   │
   ▼
1. Express Global Middlewares (CORS, Helmet, Rate Limiter, JSON Parser)
   │
   ▼
2. Route Dispatcher (/api/events, /api/teams, /api/resumes)
   │
   ▼
3. Route-Level Guards (authMiddleware, requireAdmin, checkOwnership)
   │
   ▼
4. Controller Action (extracts req.body, req.user, validates params)
   │
   ▼
5. Domain Service Invocation (calculates scores, interacts with AI / DB)
   │
   ▼
6. Mongoose Document Persistence (atomic updates, validation hooks)
   │
   ▼
7. Formatted JSON Response (standardized envelope: { success, data, error })
```

---

## 3. Real-Time WebSocket Architecture

The platform uses **Socket.io** to manage state synchronization across multiple simultaneous user sessions:

```mermaid
sequenceDiagram
    autonumber
    actor Alice as User Alice (Host)
    actor Bob as User Bob (Player)
    participant Svr as Socket.io Server
    participant DB as MongoDB

    Alice->>Svr: join_room({ roomId: "quiz_101", userId: "alice" })
    Svr-->>Alice: room_joined({ status: "waiting" })
    
    Bob->>Svr: join_room({ roomId: "quiz_101", userId: "bob" })
    Svr-->>Bob: room_joined({ status: "waiting" })
    Svr-->>Alice: user_connected({ username: "Bob" })
    
    Alice->>Svr: start_quiz({ roomId: "quiz_101" })
    Svr->>DB: Fetch question #1
    Svr-->>Alice: new_question({ qId: 1, text: "What is Big-O?", timeLimit: 15 })
    Svr-->>Bob: new_question({ qId: 1, text: "What is Big-O?", timeLimit: 15 })
    
    Bob->>Svr: submit_buzzer({ roomId: "quiz_101", answer: "A", latencyMs: 2400 })
    Svr->>Svr: Check first-responder & score points
    Svr-->>Alice: live_leaderboard_update({ scores: { bob: 100, alice: 0 } })
    Svr-->>Bob: live_leaderboard_update({ scores: { bob: 100, alice: 0 } })
```

### Socket Namespace & Room Topology
- `quiz-room-${quizId}`: Ephemeral rooms for live tournament battles, countdown timers, and buzzer events.
- `classroom-${classId}`: Whiteboard drawing strokes (`draw_stroke`, `clear_canvas`), hand-raising, and chat.
- `team-${teamId}`: Team Hunt collaboration workspace, real-time message stream, and call coordination.
- `user-${userId}`: Dedicated individual room for personal notifications (e.g., application accepted, slot reserved).

---

## 4. End-to-End Data Flow Diagrams

### Data Flow 1: Team Matchmaking & Compatibility Scoring

```mermaid
flowchart TD
    Start([User views Team Detail Page]) --> FetchUser[Fetch User Skills & Roles from User Collection]
    FetchUser --> FetchTeam[Fetch Team Required Skills & Roles from Team Collection]
    
    FetchTeam --> Engine{teamMatchService Engine}
    
    Engine -->|Normalized Exact Matches| Exact[Compute Matched Skills Array]
    Engine -->|Jaccard Set Overlap| Score[Calculate Score = Matched / Total Required * 100]
    Engine -->|Complementary Set Difference| Missing[Compute Missing Skills Array]
    
    Missing --> Advisor{Is Missing Skills > 0?}
    Advisor -->|Yes| FetchCurated[SkillGapAdvisor: Match Curated Courses in memory]
    Advisor -->|No| Perfect[Set Match = 100% Ready]
    
    FetchCurated --> AIExplain[Generate AI Advice Paragraph via Gemini]
    AIExplain --> Aggregate[Combine: Score + Matched + Missing + Resources + AI Advice]
    Perfect --> Aggregate
    
    Aggregate --> ReturnJSON[Return JSON Payload to Client]
    ReturnJSON --> UI[Render Visual Compatibility Ring & Missing Skill Badges]
```

### Data Flow 2: Concurrency-Safe Repair Slot Reservation Flow

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
