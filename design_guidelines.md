# CrewMe Design Guidelines

## Brand Identity

**Purpose**: CrewMe empowers construction workers through gamified achievement tracking, transforming daily work into visible skill progression.

**Aesthetic Direction**: Bold/Achievement-Oriented
- High-contrast interface that feels energetic and purposeful
- Game-inspired progression visuals (XP bars, level-ups) balanced with professional construction context
- Confident, motivating tone - this is a tool for winners, not a toy

**Memorable Element**: Skill trees visualized as actual construction blueprints with unlockable nodes, making career progression feel tangible and earned.

## Navigation Architecture

**Root Navigation**: Tab Bar (4 tabs + floating action)

**Tabs**:
1. **Home** - Dashboard and clock in/out
2. **Tasks** - Task list and management
3. **Progress** - Skill trees, XP, badges (center tab with emphasis)
4. **Profile** - User info, settings, rewards

**Floating Action Button**: Quick clock in/out (always accessible)

**Stack Screens**:
- Login (stack-only, entry point)
- Task Detail (pushed from Tasks tab)
- Badge Detail (pushed from Progress tab)
- Leaderboard (pushed from Progress tab)
- Rewards Store (pushed from Profile tab)
- Star Performer (pushed from Home tab)

## Screen-by-Screen Specifications

### Login
- **Purpose**: Secure authentication
- **Layout**: 
  - Full-screen gradient background
  - Centered logo and form
  - No header
- **Components**: Email/password inputs, login button, forgot password link
- **Safe Area**: Top/bottom insets + Spacing.xl

### Home (Dashboard)
- **Purpose**: Quick overview and clock in/out
- **Layout**:
  - Transparent header with greeting and notifications icon (right)
  - ScrollView root
  - Sections: Clock status card, Today's tasks preview (3 max), XP progress card, Recent badge (1)
  - Floating clock in/out button (bottom-right)
- **Safe Area**: Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + Spacing.xl + floatingButtonHeight

### Tasks (List)
- **Purpose**: View and filter assigned tasks
- **Layout**:
  - Header with search bar and filter icon (right)
  - FlatList of task cards
- **Components**: Filter chips (All, Pending, In Progress, Completed), task cards with priority indicator
- **Empty State**: empty-tasks.png illustration
- **Safe Area**: Top: Spacing.xl, Bottom: tabBarHeight + Spacing.xl

### Task Detail
- **Purpose**: View details and update status
- **Layout**:
  - Default header with back button, "Mark Complete" (right)
  - ScrollView with sections: Task info, Skill requirements, Location map, Photo attachments
  - Status update buttons at bottom
- **Safe Area**: Top: Spacing.xl, Bottom: insets.bottom + Spacing.xl

### Progress (Skill Trees)
- **Purpose**: View XP, badges, and skill progression
- **Layout**:
  - Header with "Leaderboard" button (right)
  - ScrollView root
  - Sections: Level and XP bar, Badge showcase (horizontal scroll), Skill tree tabs (6 trades)
- **Components**: Interactive skill tree nodes (locked/unlocked states)
- **Safe Area**: Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + Spacing.xl

### Leaderboard
- **Purpose**: View top performers
- **Layout**:
  - Header with "This Week" dropdown (right)
  - Podium top 3, then list of ranked users
- **Safe Area**: Top: Spacing.xl, Bottom: insets.bottom + Spacing.xl

### Profile
- **Purpose**: User info, rewards, settings
- **Layout**:
  - Transparent header with settings icon (right)
  - ScrollView root
  - Sections: Avatar + stats, Rewards points card, Skills summary, Settings buttons, Logout
- **Safe Area**: Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + Spacing.xl

### Rewards Store
- **Purpose**: Browse and redeem rewards
- **Layout**:
  - Header with points balance (subtitle), back button
  - Grid of reward cards
- **Empty State**: empty-rewards.png
- **Safe Area**: Top: Spacing.xl, Bottom: insets.bottom + Spacing.xl

## Color Palette

**Primary**: #FF6B35 (Construction Orange - bold, energetic)
**Primary Dark**: #D14D1F
**Secondary**: #004E89 (Blueprint Blue - professional depth)
**Background**: #F8F9FA (Soft White)
**Surface**: #FFFFFF
**Border**: #E1E4E8
**Text Primary**: #1A1D1F
**Text Secondary**: #6B7280
**Success**: #10B981 (Task completion)
**Warning**: #F59E0B (Pending tasks)
**Error**: #EF4444
**XP Gold**: #FBBF24 (Progress bars, badges)

## Typography

**Font**: Montserrat (Google Font) for headings, System (SF Pro) for body
- **Hero**: Montserrat Bold, 32px
- **H1**: Montserrat Bold, 24px
- **H2**: Montserrat SemiBold, 20px
- **H3**: Montserrat SemiBold, 18px
- **Body**: System Regular, 16px
- **Body Small**: System Regular, 14px
- **Caption**: System Regular, 12px

## Visual Design

- **Icons**: Feather icons for UI, construction-themed custom icons for skills
- **Buttons**: Rounded 12px, solid fills for primary, outlined for secondary
- **Cards**: White background, 1px border, 8px radius, no shadow
- **XP Bars**: Gradient fill (Primary to Primary Dark), 8px height, fully rounded
- **Badges**: Circular, gold border when unlocked, grayscale when locked
- **Touchable Feedback**: Opacity 0.7 on press
- **Floating Button**: Circular, Primary color, shadow (offset: 0/2, opacity: 0.10, radius: 2)

## Assets to Generate

**Required**:
- **icon.png** - App icon with hard hat and upward arrow motif
- **splash-icon.png** - Simplified icon for launch screen
- **empty-tasks.png** - Clipboard with checkmark (Tasks screen empty state)
- **empty-rewards.png** - Gift box illustration (Rewards Store empty state)
- **skill-tree-bg.png** - Blueprint-style background texture for skill trees
- **badge-template.png** - Gold circular badge frame (6 variations for different achievements)
- **welcome-hero.png** - Construction worker celebrating (Login/onboarding)

**User Avatars**: Generate 3 default avatar options (construction worker silhouettes in different poses)

All illustrations should use Primary Orange and Secondary Blue color scheme, clean line-art style, professional but approachable.