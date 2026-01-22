import { getToken, clearAuth, User } from "./auth";

const API_BASE_URL = "https://crew-me.app";

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

  if (token) {
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
      request<{ token: string; user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    logout: () => request("/api/auth/logout", { method: "POST" }),
    me: () => request<User>("/api/auth/me"),
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
      }>("/api/dashboard"),
  },

  clock: {
    in: (location: { latitude: number; longitude: number }) =>
      request<{ clockInTime: string }>("/api/clock/in", {
        method: "POST",
        body: JSON.stringify({ location }),
      }),
    out: (location: { latitude: number; longitude: number }) =>
      request<{ clockOutTime: string; hoursWorked: number }>("/api/clock/out", {
        method: "POST",
        body: JSON.stringify({ location }),
      }),
    status: () =>
      request<{ clockedIn: boolean; clockInTime?: string }>("/api/clock/status"),
  },

  tasks: {
    list: (filters?: { status?: string; priority?: string; projectId?: string }) =>
      request<Task[]>(`/api/tasks?${new URLSearchParams(filters as Record<string, string>).toString()}`),
    get: (id: string) => request<Task>(`/api/tasks/${id}`),
    updateStatus: (id: string, status: string) =>
      request<Task>(`/api/tasks/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    addPhoto: (id: string, photoUri: string) =>
      request<Task>(`/api/tasks/${id}/photos`, {
        method: "POST",
        body: JSON.stringify({ photoUri }),
      }),
  },

  gamification: {
    xp: () => request<{ xp: number; level: number; nextLevelXp: number }>("/api/gamification/xp"),
    badges: () => request<Badge[]>("/api/gamification/badges"),
    leaderboard: (period?: "week" | "month" | "all") =>
      request<LeaderboardEntry[]>(`/api/gamification/leaderboard?period=${period || "week"}`),
  },

  skills: {
    trees: () => request<SkillTree[]>("/api/skills/trees"),
    progress: (tradeId: string) => request<SkillProgress>(`/api/skills/${tradeId}/progress`),
  },

  rewards: {
    list: () => request<Reward[]>("/api/rewards"),
    redeem: (rewardId: string) =>
      request<{ success: boolean; message: string }>(`/api/rewards/${rewardId}/redeem`, {
        method: "POST",
      }),
    history: () => request<RedemptionHistory[]>("/api/rewards/history"),
  },

  starPerformer: {
    current: () => request<StarPerformer>("/api/star-performer/current"),
    history: () => request<StarPerformer[]>("/api/star-performer/history"),
  },

  profile: {
    get: () => request<UserProfile>("/api/profile"),
    update: (data: Partial<UserProfile>) =>
      request<UserProfile>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    certifications: () => request<Certification[]>("/api/profile/certifications"),
    performance: () => request<PerformanceHistory>("/api/profile/performance"),
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
