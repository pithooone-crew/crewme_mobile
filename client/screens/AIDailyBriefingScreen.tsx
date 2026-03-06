import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/constants/theme";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { getApiUrl } from "@/lib/query-client";

interface WeatherInfo {
  temperature: string;
  condition: string;
  humidity: string;
  wind: string;
  advisory: string;
}

interface TaskSummary {
  title: string;
  priority: string;
  status: string;
  location?: string;
  project?: string;
  assignedCrew?: number;
  estimatedHours?: number;
}

interface CrewMember {
  name: string;
  role: string;
  status: string;
}

interface SafetyAlert {
  level: string;
  title?: string;
  description?: string;
  message?: string;
}

interface CrewStatus {
  totalExpected?: number;
  checkedIn?: number;
  onLeave?: number;
  lateArrivals?: number;
  highlights?: string[];
}

interface BriefingData {
  greeting: string;
  date: string;
  weather: WeatherInfo;
  tasks: TaskSummary[];
  crew: CrewMember[];
  safetyAlerts: SafetyAlert[];
  motivationalNote: string;
  crewStatus?: CrewStatus;
  todaysTasks?: TaskSummary[];
  aiInsights?: string[];
  equipmentStatus?: { operational: number; maintenance: number; alerts: number };
}

const fallbackBriefing: BriefingData = {
  greeting: "Good morning, team!",
  date: new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }),
  weather: {
    temperature: "72F",
    condition: "Partly Cloudy",
    humidity: "45%",
    wind: "8 mph NW",
    advisory: "No weather advisories. Good conditions for outdoor work.",
  },
  tasks: [
    { title: "Foundation Pour - Section B", priority: "High", status: "In Progress", location: "Building 2" },
    { title: "Electrical Rough-In", priority: "Medium", status: "Pending", location: "Building 1, Floor 3" },
    { title: "Site Inspection Prep", priority: "High", status: "Not Started", location: "Main Office" },
  ],
  crew: [
    { name: "Mike Johnson", role: "Foreman", status: "On Site" },
    { name: "Sarah Chen", role: "Electrician", status: "On Site" },
    { name: "Carlos Rivera", role: "Heavy Equipment", status: "En Route" },
    { name: "Dave Thompson", role: "Carpenter", status: "Off Today" },
  ],
  safetyAlerts: [
    { level: "warning", message: "Crane operation Zone B - maintain 50ft clearance" },
    { level: "info", message: "New PPE policy: Hard hats required in all active zones" },
  ],
  motivationalNote: "Stay safe and productive today. Remember: quality over speed.",
};

function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case "high":
      return Colors.error;
    case "medium":
      return Colors.warning;
    case "low":
      return Colors.success;
    default:
      return Colors.textSecondary;
  }
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "on site":
      return Colors.success;
    case "en route":
      return Colors.warning;
    case "off today":
      return Colors.textSecondary;
    default:
      return Colors.primary;
  }
}

function getAlertColor(level: string): string {
  switch (level.toLowerCase()) {
    case "critical":
      return Colors.error;
    case "warning":
      return Colors.warning;
    case "info":
      return Colors.primary;
    default:
      return Colors.textSecondary;
  }
}

function getAlertIcon(level: string): keyof typeof Feather.glyphMap {
  switch (level.toLowerCase()) {
    case "critical":
      return "alert-octagon";
    case "warning":
      return "alert-triangle";
    case "info":
      return "info";
    default:
      return "bell";
  }
}

export default function AIDailyBriefingScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { isDemoMode } = useAuth();

  let tabBarHeight = 0;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch {
    tabBarHeight = insets.bottom;
  }

  const mapServerResponse = (serverData: any): BriefingData => {
    const tasks: TaskSummary[] = (serverData.todaysTasks || serverData.tasks || []).map((t: any) => ({
      title: t.title,
      priority: t.priority || "medium",
      status: t.status || "pending",
      location: t.location || t.project || "",
    }));

    const crewStatus = serverData.crewStatus || {};
    const crew: CrewMember[] = [];
    if (crewStatus.checkedIn) {
      for (let i = 0; i < Math.min(crewStatus.checkedIn, 3); i++) {
        crew.push({ name: `Crew Member ${i + 1}`, role: "Worker", status: "On Site" });
      }
    }
    if (crewStatus.lateArrivals) {
      crew.push({ name: `Late Arrivals`, role: `${crewStatus.lateArrivals} workers`, status: "En Route" });
    }
    if (crewStatus.onLeave) {
      crew.push({ name: `On Leave`, role: `${crewStatus.onLeave} workers`, status: "Off Today" });
    }
    if (crewStatus.highlights) {
      crewStatus.highlights.forEach((h: string, i: number) => {
        crew.push({ name: h, role: "", status: i % 2 === 0 ? "On Site" : "En Route" });
      });
    }
    if (crew.length === 0 && serverData.crew) {
      crew.push(...serverData.crew);
    }

    const safetyAlerts: SafetyAlert[] = (serverData.safetyAlerts || []).map((a: any) => ({
      level: a.level || "warning",
      message: a.message || a.description || a.title || "",
    }));

    const insights = serverData.aiInsights || [];
    const motivationalNote = insights.length > 0
      ? insights[0]
      : serverData.motivationalNote || "Stay safe and productive today.";

    return {
      greeting: serverData.greeting || fallbackBriefing.greeting,
      date: serverData.date || fallbackBriefing.date,
      weather: serverData.weather || fallbackBriefing.weather,
      tasks,
      crew: crew.length > 0 ? crew : fallbackBriefing.crew,
      safetyAlerts: safetyAlerts.length > 0 ? safetyAlerts : fallbackBriefing.safetyAlerts,
      motivationalNote,
      crewStatus,
      aiInsights: insights,
      equipmentStatus: serverData.equipmentStatus,
    };
  };

  const {
    data: briefing,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<BriefingData>({
    queryKey: ["/api/ai/daily-briefing"],
    queryFn: async () => {
      if (isDemoMode) {
        return fallbackBriefing;
      }
      try {
        const baseUrl = getApiUrl();
        const url = new URL("/api/ai/daily-briefing", baseUrl);
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) {
          return fallbackBriefing;
        }
        const serverData = await res.json();
        return mapServerResponse(serverData);
      } catch {
        return fallbackBriefing;
      }
    },
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const data = briefing || fallbackBriefing;

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <ThemedText style={styles.loadingText}>
            Preparing your daily briefing...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.headerSection}>
          <ThemedText type="h2">{data.greeting}</ThemedText>
          <ThemedText style={[styles.dateText, { color: theme.textSecondary }]}>
            {data.date}
          </ThemedText>
        </View>

        <Card style={styles.weatherCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: Colors.primary + "20" }]}>
              <Feather name="cloud" size={20} color={Colors.primary} />
            </View>
            <ThemedText type="h4">Weather</ThemedText>
          </View>
          <View style={styles.weatherGrid}>
            <View style={styles.weatherItem}>
              <Feather name="thermometer" size={18} color={theme.textSecondary} />
              <ThemedText style={styles.weatherValue}>{data.weather.temperature}</ThemedText>
              <ThemedText style={[styles.weatherLabel, { color: theme.textSecondary }]}>
                Temp
              </ThemedText>
            </View>
            <View style={styles.weatherItem}>
              <Feather name="sun" size={18} color={theme.textSecondary} />
              <ThemedText style={styles.weatherValue}>{data.weather.condition}</ThemedText>
              <ThemedText style={[styles.weatherLabel, { color: theme.textSecondary }]}>
                Condition
              </ThemedText>
            </View>
            <View style={styles.weatherItem}>
              <Feather name="droplet" size={18} color={theme.textSecondary} />
              <ThemedText style={styles.weatherValue}>{data.weather.humidity}</ThemedText>
              <ThemedText style={[styles.weatherLabel, { color: theme.textSecondary }]}>
                Humidity
              </ThemedText>
            </View>
            <View style={styles.weatherItem}>
              <Feather name="wind" size={18} color={theme.textSecondary} />
              <ThemedText style={styles.weatherValue}>{data.weather.wind}</ThemedText>
              <ThemedText style={[styles.weatherLabel, { color: theme.textSecondary }]}>
                Wind
              </ThemedText>
            </View>
          </View>
          {data.weather.advisory ? (
            <View style={[styles.advisoryBanner, { backgroundColor: Colors.success + "15" }]}>
              <Feather name="check-circle" size={14} color={Colors.success} />
              <ThemedText style={[styles.advisoryText, { color: Colors.success }]}>
                {data.weather.advisory}
              </ThemedText>
            </View>
          ) : null}
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: Colors.accent + "20" }]}>
              <Feather name="clipboard" size={20} color={Colors.accent} />
            </View>
            <ThemedText type="h4">Assigned Tasks</ThemedText>
            <View style={[styles.countBadge, { backgroundColor: Colors.accent + "20" }]}>
              <ThemedText style={[styles.countText, { color: Colors.accent }]}>
                {data.tasks.length}
              </ThemedText>
            </View>
          </View>
          {data.tasks.map((task, index) => (
            <View
              key={`task-${index}`}
              style={[
                styles.taskRow,
                index < data.tasks.length - 1
                  ? { borderBottomWidth: 1, borderBottomColor: theme.border }
                  : undefined,
              ]}
            >
              <View style={styles.taskInfo}>
                <ThemedText style={styles.taskTitle}>{task.title}</ThemedText>
                <View style={styles.taskMeta}>
                  <Feather name="map-pin" size={12} color={theme.textSecondary} />
                  <ThemedText style={[styles.taskLocation, { color: theme.textSecondary }]}>
                    {task.location}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.taskBadges}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + "20" }]}>
                  <ThemedText style={[styles.badgeText, { color: getPriorityColor(task.priority) }]}>
                    {task.priority}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.taskStatus, { color: theme.textSecondary }]}>
                  {task.status}
                </ThemedText>
              </View>
            </View>
          ))}
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: Colors.success + "20" }]}>
              <Feather name="users" size={20} color={Colors.success} />
            </View>
            <ThemedText type="h4">Crew Status</ThemedText>
            <View style={[styles.countBadge, { backgroundColor: Colors.success + "20" }]}>
              <ThemedText style={[styles.countText, { color: Colors.success }]}>
                {data.crew.length}
              </ThemedText>
            </View>
          </View>
          {data.crew.map((member, index) => (
            <View
              key={`crew-${index}`}
              style={[
                styles.crewRow,
                index < data.crew.length - 1
                  ? { borderBottomWidth: 1, borderBottomColor: theme.border }
                  : undefined,
              ]}
            >
              <View style={[styles.crewAvatar, { backgroundColor: getStatusColor(member.status) + "20" }]}>
                <Feather name="user" size={16} color={getStatusColor(member.status)} />
              </View>
              <View style={styles.crewInfo}>
                <ThemedText style={styles.crewName}>{member.name}</ThemedText>
                <ThemedText style={[styles.crewRole, { color: theme.textSecondary }]}>
                  {member.role}
                </ThemedText>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(member.status) + "15" }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(member.status) }]} />
                <ThemedText style={[styles.statusText, { color: getStatusColor(member.status) }]}>
                  {member.status}
                </ThemedText>
              </View>
            </View>
          ))}
        </Card>

        {data.safetyAlerts.length > 0 ? (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: Colors.warning + "20" }]}>
                <Feather name="alert-triangle" size={20} color={Colors.warning} />
              </View>
              <ThemedText type="h4">Safety Alerts</ThemedText>
            </View>
            {data.safetyAlerts.map((alert, index) => (
              <View
                key={`alert-${index}`}
                style={[
                  styles.alertRow,
                  { backgroundColor: getAlertColor(alert.level) + "10" },
                  index < data.safetyAlerts.length - 1 ? { marginBottom: Spacing.sm } : undefined,
                ]}
              >
                <Feather
                  name={getAlertIcon(alert.level)}
                  size={18}
                  color={getAlertColor(alert.level)}
                />
                <ThemedText style={styles.alertMessage}>{alert.message}</ThemedText>
              </View>
            ))}
          </Card>
        ) : null}

        {data.motivationalNote ? (
          <Card style={styles.motivationalCard}>
            <View style={styles.motivationalContent}>
              <Feather name="star" size={18} color={Colors.primary} />
              <ThemedText style={styles.motivationalText}>{data.motivationalNote}</ThemedText>
            </View>
          </Card>
        ) : null}

        <ThemedText style={[styles.pullHint, { color: theme.textSecondary }]}>
          Pull down to refresh briefing
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
  },
  loadingText: {
    fontSize: FontSizes.md,
    opacity: 0.7,
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  dateText: {
    fontSize: FontSizes.md,
    marginTop: Spacing.xs,
  },
  weatherCard: {
    marginBottom: Spacing.md,
  },
  sectionCard: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  countBadge: {
    marginLeft: "auto",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  countText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
  },
  weatherGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  weatherItem: {
    flex: 1,
    minWidth: "40%",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  weatherValue: {
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  weatherLabel: {
    fontSize: FontSizes.xs,
  },
  advisoryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  advisoryText: {
    fontSize: FontSizes.sm,
    flex: 1,
  },
  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  taskInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  taskTitle: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  taskLocation: {
    fontSize: FontSizes.xs,
  },
  taskBadges: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
  },
  taskStatus: {
    fontSize: FontSizes.xs,
  },
  crewRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  crewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  crewInfo: {
    flex: 1,
  },
  crewName: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    marginBottom: 2,
  },
  crewRole: {
    fontSize: FontSizes.xs,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: "500",
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
  },
  alertMessage: {
    fontSize: FontSizes.sm,
    flex: 1,
    lineHeight: 20,
  },
  motivationalCard: {
    marginBottom: Spacing.md,
    borderLeftColor: Colors.primary,
    borderLeftWidth: 3,
  },
  motivationalContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  motivationalText: {
    fontSize: FontSizes.md,
    flex: 1,
    lineHeight: 22,
    fontStyle: "italic",
  },
  pullHint: {
    textAlign: "center",
    fontSize: FontSizes.xs,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
});
