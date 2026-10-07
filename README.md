<div align="center">

# StudentHub
### Full-Stack Campus & Career Platform

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

[Live Demo](https://platform-blueprint.vercel.app/) | [GitHub](https://github.com/sandeep-kumar-270904/platform-blueprint)

</div>

StudentHub is a full-stack web application designed to bring student events, hackathons, team discovery, career preparation, learning tools, and campus services into one platform.

## Screenshots

<div align="center">
  <img src="./docs/screenshots/landing.png" width="48%" alt="StudentHub Landing Page" style="border-radius: 8px; margin: 1%; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
  <img src="./docs/screenshots/dashboard.png" width="48%" alt="Main Student Dashboard" style="border-radius: 8px; margin: 1%; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
  <img src="./docs/screenshots/community.png" width="48%" alt="Global Community Feed" style="border-radius: 8px; margin: 1%; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
  <img src="./docs/screenshots/team-hunt.png" width="48%" alt="Team Matchmaking" style="border-radius: 8px; margin: 1%; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
</div>

## Problem

Modern university students face extreme fragmentation across their academic, professional, and residential milestones. 
- **Platform Fatigue**: Juggling separate systems for hackathons, housing, academics, and career prep.
- **Missed Opportunities**: Students lack visibility into verified campus events, study groups, and cross-disciplinary project teams.
- **Career Blindspots**: Students often submit poorly formatted resumes and lack realistic technical interview practice before actual placement drives.

## Solution

StudentHub centralizes the fragmented college experience by providing a single, unified ecosystem for academics, career growth, and campus life. Instead of juggling a dozen different apps, students can find hackathon teams, practice for interviews with AI, secure verified off-campus housing, and attend interactive virtual classrooms all in one place. It bridges the gap between campus resources and successful career placements.

## Key Features

- JWT authentication and role-based access control
- RESTful APIs with Node.js and Express
- MongoDB persistence with domain-specific models and indexes
- Real-time workflows using Socket.io
- Gemini-powered AI features for career preparation
- Concurrency-safe reservation workflows
- Responsive React + TypeScript frontend
- Automated testing and deployment workflows

## Architecture

```mermaid
graph TD;
    Client[Frontend: React/Vite] -->|REST API| Server[Backend: Node.js/Express];
    Client -->|WebSockets| Realtime[Socket.io Server];
    Server -->|Mongoose| DB[(MongoDB Atlas)];
```

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Shadcn UI  
**Backend:** Node.js, Express.js  
**Database:** MongoDB Atlas, Mongoose  
**Realtime:** Socket.io  
**AI Engine:** Google Gemini  
**Testing:** Vitest, Cypress, Jest  
**Deployment:** Vercel / Render

## Engineering Decisions

- **Monorepo Architecture**: Kept frontend and backend tightly coupled in a single repository for rapid iteration and unified deployment configuration.
- **Concurrent Reservations**: Employed MongoDB atomic operators (`$set`, `$inc`) to prevent race conditions during heavy event-booking or slot-reservation windows.
- **Real-Time WebSockets**: Selected Socket.io over long-polling to achieve low-latency buzzer systems and live whiteboard syncing in Virtual Classrooms.
- **AI Integration**: Chose Google Gemini Pro for its massive context window and structured JSON output mode, drastically simplifying ATS scoring pipelines.

## Setup

```bash
# Clone the repository
git clone https://github.com/sandeep-kumar-270904/platform-blueprint.git
cd platform-blueprint

# Install dependencies
npm install
cd backend && npm install && cd ..

# Start application (Frontend on :8080, Backend on :5000)
npm run start:all
```

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/platform
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_gemini_key
```

## Testing

We utilize a comprehensive automated testing suite:
- **Backend**: Jest & Supertest for REST API endpoint validation and integration testing.
- **Frontend**: Vitest & React Testing Library for component-level rendering assertions.
- **CI/CD**: GitHub Actions pipeline automatically triggers on push to run linting, unit tests, and production builds.

To run tests locally:
```bash
# Run Frontend Tests
npm run test

# Run Backend Tests
cd backend && npm test
```

## Deployment

- **Frontend**: Automatically deployed via Vercel on `main` branch push.
- **Backend**: Deployed on Render with native Docker support.
- **Database**: Hosted on MongoDB Atlas with IP whitelisting configured for the production backend environment.

## Security

Security measures include Helmet, rate limiting, input validation, authentication controls, and secure configuration practices.
- **NoSQL Injection**: `express-mongo-sanitize` strips `$` and `.` operators from client payloads.
- **XSS Protection**: Automatic React JSX escaping combined with markdown sanitization.
- **Rate Limiting**: `express-rate-limit` caps auth and AI generation endpoints to prevent abuse.

## Limitations

- **In-Memory Node-Cron**: Background jobs run inside the main Node process; horizontal scaling requires migrating to BullMQ + Redis.
- **Stateful Socket.io**: Real-time servers currently rely on single-instance memory. Clustering multiple Node.js instances requires adding a Redis adapter.

## Future Work

- **Mobile Application**: Porting the React frontend to React Native for iOS/Android native clients.
- **Advanced Matchmaking**: Implementing a collaborative filtering recommendation engine for the Team Hunt feature.
- **Payment Gateway**: Integrating Stripe for premium event ticketing and verified housing deposits.

## My Role

**Full-Stack Developer**

Designed and implemented the frontend, backend APIs, authentication, database models, AI integrations, realtime workflows, and deployment configuration.
