# Skill Swap Module - Scope Closure

This document defines the final scope, features, and exclusions for the Skill Swap module (Phases 1-7) within the StudentHub platform. It serves as the reference point for what this module currently does and does not do.

## DOES: What is included
* **Core Offer Lifecycle**: Free skill-for-skill exchange browsing, searching, and filtering with pagination.
* **Matching**: Matching service computes match scores between offers based on required/offered skills.
* **Exchange Request Flow**: Users can send, accept, decline, and cancel exchange requests.
* **Session Lifecycle**: Accepted requests can be scheduled (setting a date). Completed sessions can be marked as completed or no-show.
* **Reviews & Ratings**: Post-session ratings (1-5 stars) and reviews can be submitted by participants. Users have aggregate ratings calculated.
* **Admin Moderation & Reports**: Users can report other users, offers, or sessions. Admins have a dashboard to resolve reports, deactivate offers, and flag users.
* **Recommendations**: Offers are recommended to users based on matching scores, excluding already-requested offers.
* **Badges**: Lightweight gamification (e.g., First Swap, Five Swaps, Top Rated) awarded automatically on completion of criteria.
* **Calendar Export**: Generate and download .ics calendar files for scheduled sessions.
* **PWA & Offline Resilience**: Offline cached views configured via sw.ts with push notifications triggers prepared.
* **i18n**: Internationalization support structure added for EN, ES, and AR.
* **Data Lifecycle**: Full data export functionality (/api/skill-swap/users/me/export) and account deletion cascade (anonymizing offers/reviews, purging requests).
* **Security & Performance**: API rate limiting (Offer/Request creation and Reviews) and comprehensive compound indexes on all Skill Swap MongoDB collections. Pagination caps enforced on all unbounded lists.

## DOES NOT: Known Gaps & Exclusions
* **Payments/Credits**: The system is strictly free-only. There are no payment gateways, escrow systems, credits, or paid tiers.
* **Real Video Calling**: The system tracks sessions but does not provide integrated video infrastructure (e.g., WebRTC, Zoom SDK).
* **ML-Based Moderation**: There is no automated content filtering, profanity checking, or ML-based moderation for offers and requests. This gap was identified during Phase 6 and deferred.
* **Admin Audit Log Infrastructure**: There is no universal AdminAuditLog model shared across StudentHub. Moderation actions currently use isolated or ad-hoc logs if at all, which is a platform-wide gap.
* **Dispute Appeals**: There is no formal appeals process for users after an admin resolves a report or suspends an offer.
* **Full Translation Coverage**: i18n is implemented as a proof-of-concept for the main dashboard/views, but may lack 100% translation strings across every edge case and error message.
* **Third-Party Calendar Sync**: No direct OAuth calendar sync (e.g., Google Calendar API). It relies purely on downloadable .ics files.
* **Robust Push Infrastructure**: Triggers for push notifications exist, but they rely on StudentHub's underlying push infrastructure, which requires further configuration at the platform level to be fully functional.
