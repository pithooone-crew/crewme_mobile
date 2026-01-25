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
- Project Templates with AI generation for quick project setup (40+ hour time savings)
- Attendance tracking with timesheet history and estimated pay calculation
- Digital Crew ID cards with QR code verification
- AI Self-Healing notifications for automatic shift replacement requests with accept/decline functionality
- Availability Pool for workers to mark available dates and skills with shift confirmation
- Work assignment acceptance syncs with external Site Scheduler web app backend

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
- **Theming:** Dark/light/system mode with ThemeContext and AsyncStorage persistence
  - Dark theme colors: background #090c11, primary #0ea5e9 (electric blue), accent #f97316 (construction orange)
- **Error Handling:** ErrorBoundary component with fallback UI
- **Loading States:** Skeleton components for async data
- **Haptic Feedback:** Used throughout for tactile interactions

### Key Screens
- **MoreScreen:** Consolidated feature menu with 8 logical groups (Command Center, Core Work, AI Planning, AI Team, Gamification, AI Finance, Operations, Quality & Docs)
- **SettingsScreen:** Tabbed interface with Appearance, Notifications, Usage, and Data tabs
- **AIFeaturesScreen:** AI tools with project selector for context-specific analysis
- **AttendanceScreen:** Clock in/out with timesheet history, weekly hours summary, and estimated pay
- **CrewIDCardScreen:** Digital ID card with QR code, skills display, and emergency contact
- **AINotificationsScreen:** AI-powered replacement requests with accept/decline functionality
- **AvailabilityPoolScreen:** Mark availability with date picker, skills selection, and max hours preference
- **DashboardScreen:** Enhanced with Weekly Hours Summary card and AI Alerts quick action with badge

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

### Project Templates Feature
The Templates feature allows users to browse pre-built project templates and generate custom ones using AI.

**Components:**
- `client/screens/TemplatesScreen.tsx` - Main templates screen with list, filtering, detail modal, and AI generation

**Features:**
- Browse 5 pre-built templates across categories (datacenter, commercial, residential, industrial, infrastructure)
- Category filtering with horizontal chip selector
- Template detail modal showing phases, tasks, duration, budget, and skill requirements
- AI-powered template generation for managers/admins (POST /api/templates/generate)
- Apply template to create new project with pre-configured tasks (POST /api/templates/:id/apply)

**API Endpoints:**
- GET /api/templates - List all templates
- GET /api/templates/:id - Get template details with phases
- POST /api/templates/generate - AI generates a new template from description
- POST /api/templates/:id/apply - Apply template to create a new project

**Role Permissions:**
- All users: View templates and details
- lead/foreman/project_manager/admin: Apply templates to create projects
- project_manager/admin: Generate new templates with AI

### Work Assignment Accept/Decline
Workers can accept or decline AI-generated work assignments, replacement requests, and shift swaps.

**Components:**
- `client/screens/AINotificationsScreen.tsx` - AI Notifications with accept/decline buttons

**API Endpoints (matching MOBILE_SYNC_PROMPT.md):**
- GET /api/mobile/assignments/pending - Get pending assignments with project details
- POST /api/mobile/assignments/:messageId/respond - Accept or decline assignment
  - Body: { accepted: boolean, responseContent?: string }
  - Accepting auto-reassigns tasks and removes from availability pool
  - Manager gets notified of response

### Open to Work Feature
Workers can mark themselves as "Open to Work" to be visible to the AI scheduler for automatic task allocation.

**Components:**
- `client/screens/ProfileScreen.tsx` - Open to Work toggle card below Experience section

**Features:**
- Toggle switch to enable/disable visibility to AI scheduler
- Syncs status with external Site Scheduler web app for AI allocation
- Shows confirmation banner when enabled
- Sends skills and preferences along with status

**API Endpoints (matching MOBILE_SYNC_PROMPT.md):**
- POST /api/mobile/open-to-work - Mark available for specific date
  - Body: { availableDate, skills[], maxHours, preferredProjects[], notes }
- POST /api/mobile/open-to-work/quick - Quick toggle for today/tomorrow/week
  - Body: { days: ["today", "tomorrow"], maxHours }
- GET /api/mobile/open-to-work - Get my availability
- DELETE /api/mobile/open-to-work/:id - Remove availability

### End-to-End Crew Pool Sync Flow

The mobile app and web dashboard are fully synchronized for crew pool management:

1. **Mobile crew marks "Open to Work"** → appears in web dashboard "Open to Work" tab
2. **Manager triggers AI Self-Heal** for absent crew → AI searches the availability pool
3. **AI sends replacement requests** to matched crew via mobile (appears in AI Notifications)
4. **Crew accepts/declines via mobile** → status updates immediately in web AI Messages tab
5. **Tasks auto-reassign** and managers see the confirmation with task count

**Components Involved:**
- `ProfileScreen.tsx` - Open to Work toggle (syncs to web)
- `AvailabilityPoolScreen.tsx` - Date-specific availability (syncs to web)
- `AINotificationsScreen.tsx` - Receives and responds to replacement requests

### Internationalization (i18n)

Multi-language support for web and mobile apps using i18next.

**Supported Languages:**
- English (en) - default
- Spanish (es)
- French (fr)
- Chinese Simplified (zh)
- Portuguese (pt)

**Components:**
- `client/lib/i18n/index.ts` - i18n configuration and initialization
- `client/lib/i18n/locales/*.json` - Translation files for each language
- `client/screens/SettingsScreen.tsx` - Language selector in Appearance tab

**Features:**
- Language selection modal in Settings with native language names
- Persistent language preference stored in AsyncStorage
- Auto-translate toggle for AI-powered message translation
- UI updates immediately when language changes

**API Endpoints:**
- POST /api/translate - Auto-translate text using OpenAI
  - Body: { text, targetLanguage, sourceLanguage? }
  - Returns: { original, translated, sourceLanguage, targetLanguage }
- POST /api/user/language - Update user language preference
  - Body: { language, autoTranslate }

**Schema:**
- User table includes `language` (default: "en") and `autoTranslate` (default: false) columns