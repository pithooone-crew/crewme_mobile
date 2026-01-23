import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { XPProgressBar } from "@/components/XPProgressBar";
import { TaskCard } from "@/components/TaskCard";
import { BadgeCard } from "@/components/BadgeCard";
import { ClockButton } from "@/components/ClockButton";
import { DashboardSkeleton } from "@/components/LoadingSkeleton";
import { ProjectSelectorModal, ProjectOption } from "@/components/ProjectSelectorModal";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useRBAC } from "@/hooks/useRBAC";
import { api, Task, Badge } from "@/lib/api";
import { mockDashboard } from "@/lib/mockData";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user, isDemoMode } = useAuth();
  const { isAtLeast, userRole, getRoleLabel } = useRBAC();
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState("");
  const [selectedProject, setSelectedProject] = useState<ProjectOption | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const availableProjects: ProjectOption[] = [
    { id: "1", name: "Downtown Tower", location: "123 Main St" },
    { id: "2", name: "Harbor Bridge Repair", location: "Harbor District" },
    { id: "3", name: "City Mall Renovation", location: "456 Commerce Ave" },
    { id: "4", name: "Residential Complex", location: "789 Oak Lane" },
    { id: "5", name: "Office Park Phase 2", location: "Business Center Dr" },
  ];

  // Format elapsed time as "Xh Ym Zs"
  const formatElapsedTime = (startTime: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Update timer every second when clocked in
  useEffect(() => {
    if (isClockedIn && clockInTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(formatElapsedTime(clockInTime));
      }, 1000);
      // Initial update
      setElapsedTime(formatElapsedTime(clockInTime));
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedTime("");
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isClockedIn, clockInTime]);

  const {
    data: dashboardData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["/api/dashboard"],
    queryFn: async () => {
      if (isDemoMode) {
        return mockDashboard;
      }
      const response = await api.dashboard.get();
      if (response.data) {
        setIsClockedIn(response.data.clockedIn);
        return response.data;
      }
      return mockDashboard;
    },
  });

  const handleRequestClockIn = () => {
    setShowProjectModal(true);
  };

  const handleClockIn = async (location: { latitude: number; longitude: number }) => {
    const now = new Date();

    if (isDemoMode) {
      setIsClockedIn(true);
      setClockInTime(now);
      return;
    }
    try {
      const response = await api.clock.in(location);
      if (response.data || !response.error) {
        setIsClockedIn(true);
        setClockInTime(response.data?.clockInTime ? new Date(response.data.clockInTime) : now);
        refetch();
      } else {
        console.log("Clock in API error:", response.error);
        setIsClockedIn(true);
        setClockInTime(now);
      }
    } catch (err) {
      console.error("Clock in failed:", err);
      setIsClockedIn(true);
      setClockInTime(now);
    }
  };

  const handleProjectSelect = async (project: ProjectOption) => {
    setShowProjectModal(false);
    setSelectedProject(project);
    
    if (isDemoMode) {
      const now = new Date();
      setIsClockedIn(true);
      setClockInTime(now);
    }
  };

  const handleClockOut = async (location: { latitude: number; longitude: number }) => {
    if (isDemoMode) {
      setIsClockedIn(false);
      setClockInTime(null);
      setSelectedProject(null);
      return;
    }
    try {
      const response = await api.clock.out(location);
      if (response.data || !response.error) {
        setIsClockedIn(false);
        setClockInTime(null);
        setSelectedProject(null);
        refetch();
      } else {
        console.log("Clock out API error:", response.error);
        setIsClockedIn(false);
        setClockInTime(null);
        setSelectedProject(null);
      }
    } catch (err) {
      console.error("Clock out failed:", err);
      setIsClockedIn(false);
      setClockInTime(null);
      setSelectedProject(null);
    }
  };

  const handleTaskPress = (taskId: string) => {
    navigation.navigate("TaskDetail", { taskId });
  };

  const handleStarPerformerPress = () => {
    navigation.navigate("StarPerformer");
  };

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
        }}
      >
        <DashboardSkeleton />
      </ScrollView>
    );
  }

  const data = dashboardData || mockDashboard;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {isDemoMode ? (
        <View style={[styles.demoBanner, { backgroundColor: Colors.warning + "20" }]}>
          <Feather name="info" size={16} color={Colors.warning} />
          <ThemedText style={[styles.demoText, { color: Colors.warning }]}>
            Demo Mode - Using sample data
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.greetingRow}>
        <View>
          <ThemedText type="h2">
            {greeting()}, {user?.firstName || "Crew"}
          </ThemedText>
          <ThemedText style={{ color: theme.textSecondary }}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </ThemedText>
        </View>
        <Pressable onPress={handleStarPerformerPress} style={styles.starButton}>
          <Feather name="star" size={24} color={Colors.xpGold} />
        </Pressable>
      </View>

      <Card style={styles.clockCard}>
        <ThemedText type="h4" style={styles.clockTitle}>
          {isClockedIn ? "You're on the clock" : "Ready to work?"}
        </ThemedText>
        {isClockedIn && clockInTime ? (
          <View style={styles.clockInfoContainer}>
            {selectedProject ? (
              <View style={styles.projectBadge}>
                <Feather name="briefcase" size={14} color={Colors.primary} />
                <ThemedText style={styles.projectBadgeText}>{selectedProject.name}</ThemedText>
              </View>
            ) : null}
            <ThemedText style={[styles.clockTime, { color: theme.textSecondary }]}>
              Clocked in at{" "}
              {clockInTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </ThemedText>
            {elapsedTime ? (
              <View style={styles.timerContainer}>
                <Feather name="clock" size={18} color={Colors.success} />
                <ThemedText style={styles.timerText}>{elapsedTime}</ThemedText>
              </View>
            ) : null}
          </View>
        ) : null}
        <ClockButton
          isClockedIn={isClockedIn}
          onClockIn={handleClockIn}
          onClockOut={handleClockOut}
          onRequestClockIn={handleRequestClockIn}
        />
      </Card>

      <ProjectSelectorModal
        visible={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSelect={handleProjectSelect}
        projects={availableProjects}
      />

      <View style={styles.quickActions}>
        <Pressable style={styles.quickAction} onPress={() => navigation.navigate("Projects")}>
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + "20" }]}>
            <Feather name="briefcase" size={20} color={Colors.primary} />
          </View>
          <ThemedText style={styles.quickActionText}>Projects</ThemedText>
        </Pressable>
        {isAtLeast.lead ? (
          <Pressable style={styles.quickAction} onPress={() => navigation.navigate("Crew")}>
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.secondary + "20" }]}>
              <Feather name="users" size={20} color={Colors.secondary} />
            </View>
            <ThemedText style={styles.quickActionText}>Crew</ThemedText>
          </Pressable>
        ) : (
          <Pressable style={styles.quickAction} onPress={() => navigation.navigate("Timesheet")}>
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.accent + "20" }]}>
              <Feather name="clock" size={20} color={Colors.accent} />
            </View>
            <ThemedText style={styles.quickActionText}>Timesheet</ThemedText>
          </Pressable>
        )}
        {isAtLeast.lead ? (
          <Pressable style={styles.quickAction} onPress={() => navigation.navigate("Timesheet")}>
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.accent + "20" }]}>
              <Feather name="clock" size={20} color={Colors.accent} />
            </View>
            <ThemedText style={styles.quickActionText}>Timesheet</ThemedText>
          </Pressable>
        ) : (
          <Pressable style={styles.quickAction} onPress={() => navigation.navigate("Notifications")}>
            <View style={[styles.quickActionIcon, { backgroundColor: "#7B1FA2" + "20" }]}>
              <Feather name="bell" size={20} color="#7B1FA2" />
            </View>
            <ThemedText style={styles.quickActionText}>Alerts</ThemedText>
          </Pressable>
        )}
        {isAtLeast.lead ? (
          <Pressable style={styles.quickAction} onPress={() => navigation.navigate("AIFeatures")}>
            <View style={[styles.quickActionIcon, { backgroundColor: "#00BFA5" + "20" }]}>
              <Feather name="cpu" size={20} color="#00BFA5" />
            </View>
            <ThemedText style={styles.quickActionText}>AI Tools</ThemedText>
          </Pressable>
        ) : (
          <Pressable style={styles.quickAction} onPress={() => navigation.navigate("Messages")}>
            <View style={[styles.quickActionIcon, { backgroundColor: "#00BFA5" + "20" }]}>
              <Feather name="mail" size={20} color="#00BFA5" />
            </View>
            <ThemedText style={styles.quickActionText}>Messages</ThemedText>
          </Pressable>
        )}
      </View>

      <View style={styles.quickActions}>
        <Pressable style={styles.quickAction} onPress={() => navigation.navigate("Messages")}>
          <View style={[styles.quickActionIcon, { backgroundColor: "#00BFA5" + "20" }]}>
            <Feather name="mail" size={20} color="#00BFA5" />
          </View>
          <ThemedText style={styles.quickActionText}>Messages</ThemedText>
        </Pressable>
        <Pressable style={styles.quickAction} onPress={() => navigation.navigate("Notifications")}>
          <View style={[styles.quickActionIcon, { backgroundColor: "#7B1FA2" + "20" }]}>
            <Feather name="bell" size={20} color="#7B1FA2" />
          </View>
          <ThemedText style={styles.quickActionText}>Alerts</ThemedText>
        </Pressable>
        {isAtLeast.lead ? (
          <Pressable style={styles.quickAction} onPress={() => navigation.navigate("Crew")}>
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.secondary + "20" }]}>
              <Feather name="users" size={20} color={Colors.secondary} />
            </View>
            <ThemedText style={styles.quickActionText}>Crew</ThemedText>
          </Pressable>
        ) : (
          <Pressable style={styles.quickAction} onPress={() => navigation.navigate("StarPerformer")}>
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.xpGold + "20" }]}>
              <Feather name="star" size={20} color={Colors.xpGold} />
            </View>
            <ThemedText style={styles.quickActionText}>Top Worker</ThemedText>
          </Pressable>
        )}
        {isAtLeast.lead ? (
          <Pressable style={styles.quickAction} onPress={() => navigation.navigate("Templates")}>
            <View style={[styles.quickActionIcon, { backgroundColor: "#FF5722" + "20" }]}>
              <Feather name="file-text" size={20} color="#FF5722" />
            </View>
            <ThemedText style={styles.quickActionText}>Templates</ThemedText>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Feather name="check-circle" size={24} color={Colors.success} />
          <ThemedText type="h2" style={styles.statValue}>
            {data.weeklyStats.tasksCompleted}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Tasks This Week
          </ThemedText>
        </Card>
        <Card style={styles.statCard}>
          <Feather name="clock" size={24} color={Colors.secondary} />
          <ThemedText type="h2" style={styles.statValue}>
            {data.weeklyStats.hoursWorked}h
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Hours This Week
          </ThemedText>
        </Card>
      </View>

      <Card style={styles.xpCard}>
        <View style={styles.xpHeader}>
          <ThemedText type="h4">XP Progress</ThemedText>
          <View style={styles.xpBadge}>
            <Feather name="zap" size={14} color={Colors.xpGold} />
            <ThemedText style={styles.xpBadgeText}>
              {user?.xp?.toLocaleString() || data.xpProgress.current.toLocaleString()} XP
            </ThemedText>
          </View>
        </View>
        <XPProgressBar
          currentXP={data.xpProgress.current}
          nextLevelXP={data.xpProgress.nextLevel}
          level={data.xpProgress.level}
        />
      </Card>

      {data.recentBadge ? (
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Recent Badge
          </ThemedText>
          <BadgeCard badge={data.recentBadge} size="large" />
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h4">Today's Tasks</ThemedText>
          <Pressable onPress={() => navigation.getParent()?.navigate("TasksTab")}>
            <ThemedText style={{ color: Colors.primary }}>See All</ThemedText>
          </Pressable>
        </View>
        {data.todaysTasks.length > 0 ? (
          data.todaysTasks.slice(0, 3).map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onPress={() => handleTaskPress(task.id)}
            />
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Feather name="check-circle" size={32} color={Colors.success} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No tasks scheduled for today
            </ThemedText>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  demoBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  demoText: {
    fontSize: 13,
    fontWeight: "600",
  },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing["2xl"],
  },
  starButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.xpGold + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  clockCard: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
    marginBottom: Spacing.lg,
  },
  clockTitle: {
    marginBottom: Spacing.xs,
  },
  clockInfoContainer: {
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  clockTime: {
    fontSize: 14,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.success + "15",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  timerText: {
    color: Colors.success,
    fontSize: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  projectBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.primary + "15",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  projectBadgeText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  statValue: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  xpCard: {
    marginBottom: Spacing.lg,
  },
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  xpBadgeText: {
    color: Colors.xpGold,
    fontWeight: "600",
    fontSize: 14,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  quickAction: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
