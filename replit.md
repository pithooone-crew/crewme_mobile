# CrewMe - Mobile Construction Workforce Management App

## Overview

CrewMe is a React Native/Expo mobile application designed for construction workforce management with gamification features. The app empowers construction workers through achievement tracking, transforming daily work into visible skill progression with XP, badges, and skill trees.

**Core Features:**
- Time tracking with GPS-verified clock in/out (with project selection)
- Task management with photo attachments
- Gamification system (XP, levels, badges, leaderboards)
- Skill trees for 6 construction trades
- Crew management and scheduling
- Push notifications
- Rewards store for redeeming points
- Messaging system with AI summaries, status tracking, and team communication
- AI-powered message generation for easy message composition
- Read receipts with AI-generated acknowledgments for manager confirmations

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React Native with Expo SDK 54
- **Navigation:** React Navigation v7 with native-stack and bottom-tabs
- **State Management:** TanStack React Query for server state, React Context for auth/notifications
- **Styling:** StyleSheet with a custom theme system (Colors, Spacing, BorderRadius, Typography)
- **Animations:** React Native Reanimated for gesture-driven animations
- **Font:** Montserrat (Google Fonts)

**Directory Structure:**
- `client/` - All frontend code
  - `screens/` - Screen components (Dashboard, Tasks, Progress, Profile, etc.)
  - `components/` - Reusable UI components
  - `navigation/` - Stack and tab navigators
  - `context/` - Auth and Notification providers
  - `hooks/` - Custom hooks (useTheme, useScreenOptions)
  - `lib/` - API client, auth utilities, mock data
  - `constants/` - Theme configuration

**Navigation Structure:**
- Root Stack: Login → Main (Tab Navigator)
- Tab Navigator: Home, Tasks, Progress, Profile
- Each tab has its own stack navigator for detail screens

### Backend Architecture
- **Framework:** Express.js with TypeScript
- **Database ORM:** Drizzle ORM with PostgreSQL
- **API Design:** RESTful endpoints prefixed with `/api`
- **Authentication:** Bearer token-based auth

**Directory Structure:**
- `server/` - Backend code
  - `index.ts` - Express app setup with CORS
  - `routes.ts` - API route registration
  - `storage.ts` - Data access layer (currently in-memory, ready for Postgres)
- `shared/` - Shared types and schema between client/server
  - `schema.ts` - Drizzle schema definitions

### Data Storage
- **Production:** PostgreSQL via Drizzle ORM
- **Development:** In-memory storage (MemStorage class)
- **Client-side:** SecureStore (native) / AsyncStorage (web) for tokens
- **Schema Location:** `shared/schema.ts`

### Authentication
- Email/password login with Bearer token
- Secure token storage using expo-secure-store (native) or AsyncStorage (web)
- 5 user roles: crew_member, lead, foreman, project_manager, admin
- Demo mode available with mock data

### Key Design Patterns
- **Path Aliases:** `@/` maps to `client/`, `@shared/` maps to `shared/`
- **Theming:** Dark/light mode support via useColorScheme hook
- **Error Handling:** ErrorBoundary component with fallback UI
- **Loading States:** Skeleton components for async data
- **Haptic Feedback:** Used throughout for tactile interactions

## External Dependencies

### Third-Party Services
- **External API:** Connects to `https://site-scheduler--pithooone.replit.app` for backend data
- **Push Notifications:** Expo Notifications with Expo Push Token
- **Location Services:** expo-location for GPS clock in/out verification
- **AI Integration:** OpenAI via Replit AI Integrations for message generation (gpt-4o-mini model)
  - Endpoint: POST /api/generate-message
  - Environment variables: AI_INTEGRATIONS_OPENAI_BASE_URL, AI_INTEGRATIONS_OPENAI_API_KEY (managed by Replit)

### Key Libraries
- **expo-location** - GPS tracking for time clock verification
- **expo-notifications** - Push notification handling
- **expo-image-picker** - Photo attachments for tasks
- **expo-linear-gradient** - Visual gradients for UI
- **expo-blur** - Glass effect on tab bar (iOS)
- **expo-haptics** - Tactile feedback

### Database
- PostgreSQL configured via `DATABASE_URL` environment variable
- Drizzle Kit for migrations (`drizzle.config.ts`)
- Migration files stored in `migrations/` directory