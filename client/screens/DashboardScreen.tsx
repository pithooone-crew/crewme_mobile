import React, { useState, useCallback } from "react";
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
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { api, Task, Badge } from "@/lib/api";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isClockedIn, setIsClockedIn] = useState(false);

  const {
    data: dashboardData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["/api/dashboard"],
    queryFn: async () => {
      const response = await api.dashboard.get();
      if (response.data) {
        setIsClockedIn(response.data.clockedIn);
        return response.data;
      }
      return {
        clockedIn: false,
        todaysTasks: [] as Task[],
        xpProgress: { current: 0, nextLevel: 1000, level: 1 },
        recentBadge: undefined as Badge | undefined,
        weeklyStats: { tasksCompleted: 0, hoursWorked: 0 },
      };
    },
  });

  const handleClockIn = async (location: { latitude: number; longitude: number }) => {
    const response = await api.clock.in(location);
    if (response.data) {
      setIsClockedIn(true);
      refetch();
    }
  };

  const handleClockOut = async (location: { latitude: number; longitude: number }) => {
    const response = await api.clock.out(location);
    if (response.data) {
      setIsClockedIn(false);
      refetch();
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

  const data = dashboardData || {
    todaysTasks: [],
    xpProgress: { current: 0, nextLevel: 1000, level: 1 },
    weeklyStats: { tasksCompleted: 0, hoursWorked: 0 },
  };

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
        {isClockedIn && dashboardData?.clockInTime ? (
          <ThemedText style={[styles.clockTime, { color: theme.textSecondary }]}>
            Clocked in at{" "}
            {new Date(dashboardData.clockInTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </ThemedText>
        ) : null}
        <ClockButton
          isClockedIn={isClockedIn}
          onClockIn={handleClockIn}
          onClockOut={handleClockOut}
        />
      </Card>

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
  clockTime: {
    marginBottom: Spacing.lg,
    fontSize: 14,
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
});
