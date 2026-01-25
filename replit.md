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
    - Consolidated feature menu (`MoreScreen`) with 8 logical groups.
    - Tabbed `SettingsScreen` for appearance, notifications, usage, and data.
    - Dedicated `AIFeaturesScreen` with project selector for context-specific AI analysis.
    - `AttendanceScreen` for clock in/out, timesheet history, and estimated pay.
    - `CrewIDCardScreen` for digital ID with QR code, skills, and emergency contact.
    - `AINotificationsScreen` for AI-powered replacement requests with accept/decline.
    - `AvailabilityPoolScreen` for workers to mark availability and skills.
    - Enhanced `DashboardScreen` with weekly hours and AI Alerts.
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
- **Loading States:** Skeleton components.
- **Haptic Feedback:** For tactile interactions.

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