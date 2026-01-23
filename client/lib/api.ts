import { getToken, clearAuth, User } from "./auth";

const API_BASE_URL = "https://site-scheduler--pithooone.replit.app";

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token && token !== "demo-token") {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      await clearAuth();
      return { error: "Session expired. Please log in again." };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.message || `Error: ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: "Network error. Please check your connection." };
  }
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>("/api/mobile/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    logout: () => request("/api/mobile/logout", { method: "POST" }),
    me: () => request<User>("/api/mobile/me"),
    testAccounts: () => request<TestAccount[]>("/api/mobile/test-accounts"),
  },

  projects: {
    list: (filters?: { status?: string }) =>
      request<Project[]>(`/api/mobile/projects?${new URLSearchParams(filters as Record<string, string>).toString()}`),
    get: (id: string) => request<Project>(`/api/mobile/projects/${id}`),
    create: (data: Partial<Project>) =>
      request<Project>("/api/mobile/projects", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Project>) =>
      request<Project>(`/api/mobile/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  crew: {
    list: (filters?: { skill?: string; role?: string }) =>
      request<CrewMember[]>(`/api/mobile/crew?${new URLSearchParams(filters as Record<string, string>).toString()}`),
    get: (id: string) => request<CrewMember>(`/api/mobile/crew/${id}`),
    availability: (id: string) => request<CrewAvailability>(`/api/mobile/crew/${id}/availability`),
  },

  timeTracking: {
    entries: (filters?: { startDate?: string; endDate?: string }) =>
      request<TimeEntry[]>(`/api/mobile/time-entries?${new URLSearchParams(filters as Record<string, string>).toString()}`),
    current: () => request<TimeEntry | null>("/api/mobile/time-entries/current"),
    submit: (entryId: string) =>
      request<TimeEntry>(`/api/mobile/time-entries/${entryId}/submit`, { method: "POST" }),
  },

  inAppNotifications: {
    list: () => request<InAppNotification[]>("/api/notifications"),
    markRead: (id: string) =>
      request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: "POST" }),
    markAllRead: () =>
      request<{ success: boolean }>("/api/notifications/read-all", { method: "POST" }),
  },

  ai: {
    teamBuilder: (projectId: string, requirements: any) =>
      request<AITeamSuggestion>("/api/ai/team-builder", {
        method: "POST",
        body: JSON.stringify({ projectId, requirements }),
      }),
    scheduleOptimizer: (projectId: string) =>
      request<AIScheduleSuggestion>("/api/ai/schedule-optimizer/run", {
        method: "POST",
        body: JSON.stringify({ projectId }),
      }),
    dailyReport: () =>
      request<AIDailyReport>("/api/ai/daily-report/generate", { method: "POST" }),
    photoAnalysis: (photoUri: string) =>
      request<AIPhotoAnalysis>("/api/ai/photo-analysis/analyze", {
        method: "POST",
        body: JSON.stringify({ photoUri }),
      }),
    skillsGap: (userId?: string) =>
      request<AISkillsGap>("/api/ai/skills-gap/analyze", {
        method: "POST",
        body: JSON.stringify({ userId }),
      }),
  },

  weather: {
    alerts: (projectId?: string) =>
      request<WeatherAlert[]>(`/api/ai/self-healing/weather${projectId ? `?projectId=${projectId}` : ""}`),
  },

  dashboard: {
    get: () =>
      request<{
        clockedIn: boolean;
        clockInTime?: string;
        todaysTasks: Task[];
        xpProgress: { current: number; nextLevel: number; level: number };
        recentBadge?: Badge;
        weeklyStats: { tasksCompleted: number; hoursWorked: number };
      }>("/api/mobile/dashboard"),
  },

  clock: {
    in: (location: { latitude: number; longitude: number }) =>
      request<{ clockInTime: string }>("/api/mobile/clock/in", {
        method: "POST",
        body: JSON.stringify({ location }),
      }),
    out: (location: { latitude: number; longitude: number }) =>
      request<{ clockOutTime: string; hoursWorked: number }>("/api/mobile/clock/out", {
        method: "POST",
        body: JSON.stringify({ location }),
      }),
    status: () =>
      request<{ clockedIn: boolean; clockInTime?: string }>("/api/mobile/clock/status"),
  },

  tasks: {
    list: (filters?: { status?: string; priority?: string; projectId?: string }) =>
      request<Task[]>(`/api/mobile/tasks?${new URLSearchParams(filters as Record<string, string>).toString()}`),
    get: (id: string) => request<Task>(`/api/mobile/tasks/${id}`),
    updateStatus: (id: string, status: string) =>
      request<Task>(`/api/mobile/tasks/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    addPhoto: (id: string, photoUri: string) =>
      request<Task>(`/api/mobile/tasks/${id}/photos`, {
        method: "POST",
        body: JSON.stringify({ photoUri }),
      }),
  },

  gamification: {
    xp: () => request<{ xp: number; level: number; nextLevelXp: number }>("/api/mobile/gamification/xp"),
    badges: () => request<Badge[]>("/api/mobile/gamification/badges"),
    leaderboard: (period?: "week" | "month" | "all") =>
      request<LeaderboardEntry[]>(`/api/mobile/gamification/leaderboard?period=${period || "week"}`),
  },

  skills: {
    trees: () => request<SkillTree[]>("/api/mobile/skills/trees"),
    progress: (tradeId: string) => request<SkillProgress>(`/api/mobile/skills/${tradeId}/progress`),
  },

  rewards: {
    list: () => request<Reward[]>("/api/mobile/rewards"),
    redeem: (rewardId: string) =>
      request<{ success: boolean; message: string }>(`/api/mobile/rewards/${rewardId}/redeem`, {
        method: "POST",
      }),
    history: () => request<RedemptionHistory[]>("/api/mobile/rewards/history"),
  },

  starPerformer: {
    current: () => request<StarPerformer>("/api/mobile/star-performer/current"),
    history: () => request<StarPerformer[]>("/api/mobile/star-performer/history"),
  },

  profile: {
    get: () => request<UserProfile>("/api/mobile/profile"),
    update: (data: Partial<UserProfile>) =>
      request<UserProfile>("/api/mobile/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    certifications: () => request<Certification[]>("/api/mobile/profile/certifications"),
    performance: () => request<PerformanceHistory>("/api/mobile/profile/performance"),
  },

  notifications: {
    register: (pushToken: string, platform: string) =>
      request<{ success: boolean }>("/api/mobile/notifications/register", {
        method: "POST",
        body: JSON.stringify({ pushToken, platform }),
      }),
    unregister: () =>
      request<{ success: boolean }>("/api/mobile/notifications/unregister", {
        method: "POST",
      }),
  },

  messages: {
    list: (filters?: { status?: string; priority?: string }) =>
      request<CrewMessage[]>(`/api/crew-messages${filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : ""}`),
    get: (id: string) => request<CrewMessage>(`/api/crew-messages/${id}`),
    create: (data: CreateMessageData) =>
      request<CrewMessage>("/api/crew-messages", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    reply: (id: string, content: string) =>
      request<CrewMessage>(`/api/crew-messages/${id}/reply`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    markRead: (id: string) =>
      request<CrewMessage>(`/api/crew-messages/${id}/read`, {
        method: "POST",
      }),
    sendReadReceipt: (id: string, messageDetails?: { subject?: string; content?: string; priority?: string }) =>
      request<{ success: boolean; readAt: string; aiAcknowledgment?: string }>(`/api/crew-messages/${id}/read-receipt`, {
        method: "POST",
        body: JSON.stringify({
          messageSubject: messageDetails?.subject,
          messageContent: messageDetails?.content,
          priority: messageDetails?.priority,
        }),
      }),
    getReadStatus: (id: string) =>
      request<ReadStatus>(`/api/crew-messages/${id}/read-status`),
    markResolved: (id: string, resolutionNotes?: string) =>
      request<CrewMessage>(`/api/crew-messages/${id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ resolutionNotes }),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/crew-messages/${id}`, {
        method: "DELETE",
      }),
  },
};

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  projectId: string;
  projectName: string;
  scheduledDate: string;
  location?: { latitude: number; longitude: number; address: string };
  skillRequirements: string[];
  xpReward: number;
  photos: string[];
  assignedTo: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  unlockedAt?: string;
  isUnlocked: boolean;
  category: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  tasksCompleted: number;
}

export interface SkillTree {
  id: string;
  name: string;
  iconName: string;
  description: string;
  levels: SkillLevel[];
  currentLevel: number;
  progress: number;
}

export interface SkillLevel {
  level: number;
  name: string;
  xpRequired: number;
  skills: Skill[];
  isUnlocked: boolean;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  isUnlocked: boolean;
}

export interface SkillProgress {
  tradeId: string;
  currentLevel: number;
  currentXp: number;
  nextLevelXp: number;
  unlockedSkills: string[];
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  category: "pto" | "gift_card" | "equipment" | "bonus";
  pointsCost: number;
  imageUrl?: string;
  available: boolean;
}

export interface RedemptionHistory {
  id: string;
  rewardId: string;
  rewardName: string;
  pointsCost: number;
  status: "pending" | "approved" | "rejected" | "fulfilled";
  requestedAt: string;
  processedAt?: string;
}

export interface StarPerformer {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  title: string;
  reason: string;
  period: string;
  nominatedBy?: string;
  xpBonus: number;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  hireDate: string;
  skills: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate?: string;
  status: "active" | "expired" | "pending_renewal";
}

export interface PerformanceHistory {
  totalTasksCompleted: number;
  totalHoursWorked: number;
  averageRating: number;
  monthlyStats: {
    month: string;
    tasksCompleted: number;
    hoursWorked: number;
    xpEarned: number;
  }[];
}

export interface TestAccount {
  email: string;
  password: string;
  role: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "planning" | "active" | "completed" | "on_hold";
  location: { address: string; latitude: number; longitude: number };
  startDate: string;
  endDate: string;
  budget?: number;
  client?: string;
  progress: number;
  tasksCount: number;
  crewCount: number;
}

export interface CrewMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  skills: string[];
  hourlyRate?: number;
  avatarUrl?: string;
  rating: number;
  tasksCompleted: number;
  xp: number;
  level: number;
}

export interface CrewAvailability {
  userId: string;
  available: boolean;
  schedule: { day: string; start: string; end: string }[];
}

export interface TimeEntry {
  id: string;
  userId: string;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  taskName?: string;
  clockIn: string;
  clockOut?: string;
  hoursWorked?: number;
  status: "active" | "submitted" | "approved" | "rejected";
  notes?: string;
}

export interface InAppNotification {
  id: string;
  type: "task" | "achievement" | "schedule" | "announcement" | "weather";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export interface AITeamSuggestion {
  team: { userId: string; name: string; role: string; skills: string[] }[];
  reasoning: string;
}

export interface AIScheduleSuggestion {
  optimizedTasks: { taskId: string; suggestedDate: string; reasoning: string }[];
  conflicts: string[];
}

export interface AIDailyReport {
  summary: string;
  projectUpdates: { projectName: string; progress: number; highlights: string[] }[];
  attendance: { present: number; absent: number; late: number };
  tasksCompleted: number;
  tasksPending: number;
}

export interface AIPhotoAnalysis {
  description: string;
  safetyIssues: string[];
  progressEstimate: number;
  suggestions: string[];
}

export interface AISkillsGap {
  gaps: { skill: string; currentLevel: number; requiredLevel: number; trainingRecommendation: string }[];
  recommendations: string[];
}

export interface WeatherAlert {
  id: string;
  projectId?: string;
  severity: "low" | "medium" | "high";
  title: string;
  message: string;
  effectiveDate: string;
}

export interface CrewMessage {
  id: string;
  subject: string;
  content: string;
  senderName: string;
  senderRole: string;
  senderId?: string;
  receivedAt: string;
  status: "unread" | "read" | "replied" | "resolved";
  priority: "high" | "medium" | "low";
  sentiment: "positive" | "neutral" | "negative";
  category: "safety" | "schedule" | "equipment" | "general" | "urgent";
  projectId?: string;
  projectName?: string;
  taskId?: string;
  aiSummary?: string;
  timeline?: { date: string; action: string; by: string }[];
  resolutionNotes?: string;
  readAt?: string;
  readBy?: string;
  readByName?: string;
  readReceiptSent?: boolean;
  aiAcknowledgment?: string;
}

export interface ReadStatus {
  isRead: boolean;
  readAt?: string;
  readBy?: string;
  readByName?: string;
  readReceiptSent?: boolean;
  aiAcknowledgment?: string;
}

export interface CreateMessageData {
  subject: string;
  content: string;
  category: "safety" | "schedule" | "equipment" | "general" | "urgent";
  priority?: "high" | "medium" | "low";
  projectId?: string;
  taskId?: string;
  recipientId?: string;
}
