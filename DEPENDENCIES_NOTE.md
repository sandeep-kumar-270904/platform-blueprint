# Important Dependency & Stack Notes

This document contains a high-level overview of the major `npm` modules and technologies installed across the StudentHub platform. Keep this reference for future onboarding and for updating the main `README.md`.

## Backend (`/backend/package.json`)
The backend is a monolithic Node.js/Express server using MongoDB.

### Core Framework & Database
*   **`express`** & **`mongoose`**: Core routing and MongoDB object modeling.
*   **`socket.io`**: Used heavily for real-time Live Quizzes, Collaborative Classrooms, and Group Discussions.
*   **`node-cron`**: Background task scheduler (used for daily challenges, leaderboard resets, notifications).

### Authentication & Security
*   **`jsonwebtoken`** & **`bcryptjs`**: JWT generation and password hashing.
*   **`passport`** (+ `passport-google-oauth20`, `passport-github2`, `passport-linkedin-oauth2`): OAuth strategies for social logins.
*   **`express-rate-limit`**: Brute-force and API quota protection.

### Integrations & Utilities
*   **`@google/generative-ai`**: Powers the AI Quiz Generation and AI Essay reviews.
*   **`stripe`**: Used for premium quiz purchases and subscription processing.
*   **`winston`** & **`morgan`**: Production-ready logging and request tracing.
*   **`nodemailer`**: Email notifications.

---

## Frontend (`/package.json`)
The frontend is a Vite-powered React application with TypeScript.

### Core Framework
*   **`react`** & **`react-router-dom`**: UI rendering and client-side routing.
*   **`vite`** & **`@vitejs/plugin-react`**: Fast build tooling and HMR.

### UI Components & Styling
*   **`tailwindcss`**: Utility-first CSS framework.
*   **`@radix-ui/react-*`**: Headless accessible UI components (powers the Shadcn UI library).
*   **`framer-motion`**: Complex animations for Gamification (badges, progress bars, leaderboards).
*   **`lucide-react`** & **`react-icons`**: SVG icon libraries.

### Data & State Management
*   **`socket.io-client`**: Real-time listeners for live events.
*   **`react-hook-form`** & **`zod`**: Form state management and strict schema validation.
*   **`recharts`**: Data visualization (used in Admin Analytics Hub).
*   **`date-fns`**: Date parsing and manipulation for dashboards.

### Advanced Capabilities
*   **`@jitsi/react-sdk`**: Video conferencing for Virtual Classrooms.
*   **`@dnd-kit/core`**: Drag-and-drop interfaces.
*   **`html2canvas`** & **`@react-pdf/renderer`**: Certificate generation and PDF exports.
