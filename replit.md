# CrewMe - Mobile Construction Workforce Management App

## Overview
CrewMe is a React Native/Expo mobile application designed to revolutionize construction workforce management through gamification and AI-powered tools. The app aims to empower construction workers by tracking achievements, skills progression, and providing a comprehensive suite of features for efficient project execution. It integrates time tracking, task management, gamification (XP, badges, skill trees), crew scheduling, and advanced AI capabilities for communication, self-healing notifications, and project templating. CrewMe envisions transforming daily construction work into an engaging and skill-developing experience, ultimately increasing efficiency and worker satisfaction.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework:** React Native with Expo SDK 54
- **Navigation:** React Navigation v7 (native-stack, bottom-tabs)
- **State Management:** TanStack React Query for server state, React Context for local state (auth, notifications)
- **Styling:** StyleSheet with a custom theme system (Colors, Spacing, BorderRadius, Typography)
- **Animations:** React Native Reanimated
- **Font:** Montserrat
- **Key Features:**
    - Consolidated feature menu (`MoreScreen`) with 9 logical groups including AI Crew Tools.
    - Tabbed `SettingsScreen` for appearance, notifications, usage, and data.
    - Dedicated `AIFeaturesScreen` with project selector for context-specific AI analysis.
    - `AttendanceScreen` for clock in/out, timesheet history, and estimated pay.
    - `CrewIDCardScreen` for digital ID with QR code, skills, and emergency contact.
    - `AINotificationsScreen` for AI-powered replacement requests with accept/decline.
    - `AvailabilityPoolScreen` for workers to mark availability and skills.
    - Enhanced `DashboardScreen` with weekly hours and AI Alerts.
    - **AI Crew Tools:**
        - `VoiceTaskScreen`: Voice-to-Task with animated microphone, speech transcription, and AI parsing of task updates.
        - `PhotoDocScreen`: AI Photo Documentation with camera/gallery integration, AI-generated progress notes, and tag detection.
        - `PPEReminderScreen`: Smart PPE Reminders with task-based safety checklists, hazard warnings, and completion tracking for 5 task types (welding, electrical, heights, demolition, general).
        - `AITeamBuilderScreen`: Natural language team building - describe needs and AI suggests optimal crew composition with skills, ratings, and reasoning.
        - `AIDailyBriefingScreen`: Morning briefing with weather, crew status, today's tasks, safety alerts, equipment status, and AI insights.
        - `AIBuildingCodeScreen`: Chat-style Q&A for building code compliance using AI (IBC, OSHA, NEC, ADA, etc.).
        - `AIBlueprintTakeoffScreen`: Camera/gallery photo upload for AI-powered quantity extraction from blueprints with material categories and cost estimates.
    - **Offline Caching:** AsyncStorage-based caching layer (`client/lib/offline-cache.ts`) with TTL support, automatic fallback to cached data when offline.
    - **Theming:** Dark/light/system mode with persistence; specific dark theme colors (background #090c11, primary #0ea5e9, accent #f97316).
    - **Internationalization (i18n):** Multi-language support (12 languages including RTL for Arabic) using i18next, device language auto-detection, persistent preference, and auto-translate toggle for AI.

### Backend
- **Framework:** Express.js with TypeScript
- **Database ORM:** Drizzle ORM with PostgreSQL
- **API Design:** RESTful endpoints (`/api` prefix)
- **Authentication:** Bearer token-based with 5 user roles (crew_member, lead, foreman, project_manager, admin).
- **Real-time:** WebSocket server for live location broadcasting and updates.

### Data Storage
- **Production:** PostgreSQL via Drizzle ORM.
- **Development:** In-memory storage.
- **Client-side:** SecureStore (native) / AsyncStorage (web) for tokens.

### Core System Features
- **Project Templates:** AI-powered generation and application of project templates (40+ hour time savings).
- **Work Assignment Acceptance:** Workers can accept/decline AI-generated assignments, replacement requests, and shift swaps, which syncs with an external Site Scheduler web app backend.
- **Open to Work Feature:** Workers can mark themselves available for AI-driven task allocation, visible to the AI scheduler and synchronized with the external Site Scheduler web app.
- **Map Dashboard:** Uber-like real-time GPS tracking of crew and equipment via WebSockets, with smooth animated markers, direction indicators, geofenced auto-attendance, and site zone visualization.
- **Smart Equipment IoT Dashboard:** Real-time telemetry monitoring for construction equipment fleet with 4 screens:
    - **Equipment List:** All equipment with health scores, status indicators, fuel levels, and category filtering.
    - **Equipment Detail:** Live telemetry gauges (RPM, fuel level, coolant temp, oil pressure, battery, engine hours) and active alerts.
    - **Fleet Alerts:** Active equipment alerts with severity levels (critical/high/medium/low), swipe-to-acknowledge/resolve gestures.
    - **AI Dispatch:** AI-powered equipment recommendations with dispatch scores based on health (40%), fuel (30%), alerts (20%), and engine hours (10%).

### Key Design Patterns
- **Path Aliases:** `@/` for client, `@shared/` for shared code.
- **Error Handling:** `ErrorBoundary` component.
- **Loading States:** Skeleton components with shimmer effects (`ShimmerLoader`).
- **Haptic Feedback:** For tactile interactions (Light/Medium/Heavy impact styles).

### Modern UI Components (`client/components/ui/`)
- **GlassCard:** Glassmorphism cards with blur effects (BlurView on native, CSS backdrop-filter on web).
- **GradientButton:** Gradient buttons with size variants (small/medium/large) and type variants (primary/secondary/success/warning/danger), includes haptic feedback.
- **AnimatedProgressRing:** Circular animated progress indicators using SVG, used for health/skill visualizations.
- **ShimmerLoader:** Skeleton loading with animated shimmer effect, supports custom sizing and border radius.
- **PressableScale:** Animated press feedback with scale-down animation using React Native Reanimated.
- **FloatingActionButton:** Expandable FAB with multiple action items, includes rotation animation.
- **StatusPill:** Modern status badges with optional icons and semantic variants.
- **BottomSheet:** Draggable modal sheet with gesture support, snap points, and backdrop.
- **AnimatedBadge:** Notification badges with pop-in animation.

### Dynamic Accent Color Theming
- **Colors:** blue, orange, green, purple, pink, teal.
- **Storage:** Persisted to AsyncStorage with key `@crewme_accent_color`.
- **Access:** Via `useTheme()` hook: `accentColor`, `setAccentColor`, `accentColors.primary/primaryDark`.

## External Dependencies

### Third-Party Services
- **External API:** `https://site-scheduler--pithooone.replit.app` for backend data.
- **Push Notifications:** Expo Notifications.
- **Location Services:** `expo-location` for GPS verification.
- **AI Integration:** OpenAI via Replit AI Integrations (gpt-4o-mini model) for message generation, AI-powered template generation, and translation.

### Key Libraries
- `expo-location`
- `expo-notifications`
- `expo-image-picker`
- `expo-linear-gradient`
- `expo-blur`
- `expo-haptics`
- `react-native-maps` (pinned to v1.18.0)

### Database
- PostgreSQL (configured via `DATABASE_URL`).
- Drizzle Kit for migrations.