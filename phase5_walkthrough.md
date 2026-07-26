# Team Hunt - Phase 5 Walkthrough

The **Team Hunt Phase 5** module expands the existing hackathon team formation tool into a robust collaboration platform. This phase adds in-chat file uploads, video calling integration (via meeting links), and competitive leaderboards across the platform.

## Features Implemented

### 1. In-Chat File Uploads & Sharing
- **Backend File Handling**: Set up a `multer` configuration in `backend/routes/teams.js` to process and store files locally in an `uploads/` directory with size limits enforced.
- **Message Schema Updates**: Extended the `TeamMessage` MongoDB schema to support rich media, adding `type` (text, file, system) and an `attachments` array.
- **Socket Synchronisation**: Updated `send_team_message` events in `backend/sockets/teamChat.js` to transmit the new attachment payload in real-time.
- **UI Enhancements**: Added an attachment button (<kbd>Paperclip</kbd>) in `TeamChat.tsx` utilizing a hidden file input, and rendered image thumbnails or file icons inline within the chat stream.

### 2. Video Calling Integration (External Meeting Links)
- **Call Session Models**: Added `TeamCallSession` schema linking to a `Team` to track scheduled and ongoing meetings.
- **Start/Join Endpoints**: Implemented routes (`POST /api/teams/:id/calls/start`, `join`, `leave`) in `teamController.js` that accept an external video URL.
- **Broadcast System Message**: Added a "Start Meeting" modal in `TeamChat.tsx` which injects a `system` type message into the chat, notifying members that a call has started along with the link.
- **React Query Hooks**: Wired up the new backend capabilities to `src/hooks/useTeams.ts` with `useStartCall`, `useJoinCall`, and `useLeaveCall`.

### 3. Global & Institutional Leaderboards
- **Hall of Fame API**: Introduced `getTeamLeaderboard` and `getUserLeaderboard` endpoints to calculate aggregate scores based on completed projects, active contributions, and member feedback. 
- **Scoped Ranking**: Designed the query pipeline to allow filtering by the user's `institutionId`, creating localized university-level leaderboards.
- **New Interface**: Built `TeamHuntLeaderboard.tsx` as a dedicated sub-route (`/team-hunt/leaderboard`). 
  - Showcases the top teams with distinct ranking visualization.
  - Highlights top individual contributors based on their past project completions.
  - Incorporates dynamic toggle buttons (Global vs. Institution).

## Verification Steps
1. Navigate to **Team Hunt** in the main sidebar.
2. Click the new **Leaderboard** button from the main header and verify it lists any currently completed teams/users.
3. Open a team's **Dashboard** and navigate to the **Team Chat**.
4. Use the paperclip icon to upload an image or text file, verifying that it immediately appears in the chat stream with download capabilities.
5. Click **Meeting** to test the new video calling broadcast functionality.

> [!TIP]
> This completes the entire five-phase rollout of the Team Hunt module, which is now fully production-ready for student networking, team administration, semantic matching, and real-time collaboration.
