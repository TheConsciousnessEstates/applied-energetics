# Applied Energetics — TODO

## Phase 1: Backend & Database
- [x] Extend drizzle schema: users (subscription tier, stage, streak), protocols, sessions, stage_assessments, athlete_profiles
- [x] Generate and apply DB migrations
- [x] Seed 24 protocols (6 per stage) with full metadata
- [x] tRPC routers: auth, protocols, sessions, assessments, subscriptions, profile

## Phase 2: Design System & Global Layout
- [x] Apply dark brutalist CSS theme (near-black bg, red/white accents, monospace data fonts)
- [x] Add Google Fonts (Barlow Condensed + JetBrains Mono)
- [x] Build AppLayout with top nav and mobile drawer
- [x] Build LandingPage (public, no auth required)

## Phase 3: Auth & Onboarding
- [x] Manus OAuth login/logout flow
- [x] Onboarding quiz (sport, experience, training goals → athlete profile)
- [x] Stage assessment quiz (8 questions → assigned Stage 1-4)
- [x] Redirect new users to onboarding after first login

## Phase 4: Protocol Library
- [x] Protocol library page with grid layout
- [x] Filter by Stage, Chakra, Element, Duration, Goal
- [x] Protocol detail page with steps, metadata, chakra map
- [x] Paywall gate: Free tier sees 3 protocols only
- [x] Stage/chakra badge components

## Phase 5: Session Player
- [x] Interactive breathwork timer (inhale/hold/exhale/hold phases)
- [x] Phase indicator with animated ring
- [x] Rep counter and total duration tracker
- [x] Audio cues via Web Audio API (tone generation per phase)
- [x] Session completion screen

## Phase 6: Session Logger
- [x] Log session: protocol used, duration, perceived exertion (1-10), post-session notes
- [x] Chakra activation self-assessment (1-7 slider)
- [x] Session history list with filters
- [x] Session detail view

## Phase 7: Analytics Dashboard
- [x] Session frequency chart (bar, last 30 days)
- [x] Streak counter (consecutive days)
- [x] Total training volume (minutes)
- [x] Stage progress bar (toward next stage)
- [x] Average breath rate trend (line chart)
- [x] Favorite protocols list
- [x] Paywall gate: advanced analytics for Pro/Elite only

## Phase 8: User Profile
- [x] Athlete info display (name, sport, experience, goals)
- [x] Subscription tier badge
- [x] Training stats summary
- [x] Editable preferences (sport, goals, notification settings)
- [x] Account settings (email, password reset)

## Phase 9: Subscription & Stripe
- [x] Stripe Checkout for Pro ($9/mo) and Elite ($29/mo)
- [x] Webhook handler for subscription events (created, updated, cancelled)
- [x] Subscription tier stored in DB, enforced server-side on all gated procedures
- [x] Upgrade/downgrade UI with tier comparison table
- [x] Cancellation flow

## Phase 10: QA & Polish
- [x] Responsive design (mobile-first)
- [x] Loading skeletons for all data-fetching views
- [x] Error boundaries and empty states
- [x] Vitest unit tests for all routers
- [x] Final visual polish pass
- [x] Fix Tailwind 4 @apply custom class errors → replaced with plain CSS


## Phase 11: Reposition for Mainstream Combat Athletes
- [x] Update hero headline: "CONTROL YOUR BREATH. COMMAND THE FIGHT."
- [x] Update sub-headline: "Breath-rate training for fighters who refuse to gas out."
- [x] Rewrite public-facing copy (Chakra → Neural anchor, Demi-god → Flow state, etc.)
- [x] Keep internal terminology (chakra, 4-Stage, elements, vocal tones) in code/data
- [x] Update pricing tier copy with new language
- [x] Update dashboard copy ("Today's Stack", "Rank Progression", etc.)
- [x] Add animated breath wave visualization to hero section (CSS animation)
- [x] Update CTA button copy ("ENTER THE SYSTEM", "START PROTOCOL", "GO PRO")
- [x] Add footer with "APPLIED ENERGETICS — BREATH IS ARMOR"
- [x] Remove all Manus branding and watermarks

## Phase 12: Email/Password Authentication (No External API)
- [x] Add email/password auth procedures to server (auth.signup, auth.login)
- [x] Build Login page (email/password)
- [x] Build Signup page (email/password)
- [x] Build ResetPassword page (deferred — email integration not required for MVP)
- [x] Implement real password hashing (bcrypt) and verification
- [x] Store password hashes securely in database (passwordHash field)
- [x] Add logout flow (via existing auth.logout)

## Phase 13: Legal Pages & Disclaimers
- [x] Build MedicalDisclaimer page (modal, age verification 18+, checkbox, "ENTER THE SYSTEM" button)
- [x] Build TermsOfService page
- [x] Build PrivacyPolicy page
- [x] Add health data disclaimer text
- [x] Store disclaimer acceptance in localStorage (flag checked on route guards)

## Phase 14: Route Guards & Guest Mode
- [x] Implement route guard: auth check → redirect to /login
- [x] Implement route guard: disclaimer check → redirect to /disclaimer
- [x] Implement route guard: assessment check → redirect to /assessment
- [x] Allow unauthenticated access to / and /pricing only
- [x] Show 3 preview protocols on /protocols for guests (locked timer, no audio)
- [x] Add persistent "UNLOCK FULL SYSTEM" banner on guest pages
- [x] Wire all protected routes with ProtectedRoute wrapper
- [x] Build Login page (email/password form)
- [x] Build Signup page (email/password form, terms acceptance)

## Phase 15: Health Platform Sync Infrastructure
- [x] Add healthSync schema to users table (Apple, Google, Samsung connection status)
- [x] Add healthData schema to sessions table (HR, RR, HRV, SpO2, source device)
- [x] Build Apple HealthKit integration (mock UI ready for native bridge)
- [x] Build Google Health Connect integration (mock UI ready for Android SDK)
- [x] Build Samsung Health integration (mock UI ready for Health Connect bridge)
- [x] Create health sync service layer with modular hooks
- [x] Implement permission request flows for each platform (UI ready)

## Phase 16: Connected Devices UI & Health Data Display
- [x] Add "Connected Devices" section to Profile settings
- [x] Build Apple Health connection card (toggle, last sync, permissions)
- [x] Build Google Health Connect connection card
- [x] Build Samsung Health connection card
- [x] Display synced health data on Analytics dashboard (overlay lines on breath-rate charts)
- [x] Show HR, RR, HRV, SpO2 data from wearables in session detail view

## Phase 17: Design System Polish & Branding Removal
- [x] Remove Manus watermark from footer
- [x] Remove "Made with Manus" from all pages
- [x] Update footer to "APPLIED ENERGETICS — BREATH IS ARMOR"
- [x] Refine error state styling (inline red text, no pills)
- [x] Add CheckoutSuccess page
- [x] Add CheckoutCancel page
- [x] Ensure all new pages match dark brutalist design system
- [x] Mobile-first responsive QA

## Phase 18: QA & Final Checkpoint
- [x] Test full auth flow (signup → disclaimer → assessment → dashboard)
- [x] Test guest mode (3 protocols visible, locked timer)
- [x] Test route guards (redirect logic)
- [x] Test health platform sync (mock data for testing)
- [x] Test Stripe checkout with new copy
- [x] Verify all copy changes across all pages
- [x] Mobile responsiveness QA
- [x] Final checkpoint and deploy
