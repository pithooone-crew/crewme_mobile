import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api, TimeEntry } from "@/lib/api";
import { mockTimeEntries } from "@/lib/mockData";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/constants/theme";
import { Card } from "@/components/Card";
import { useRBAC } from "@/hooks/useRBAC";

type ViewMode = "daily" | "weekly";

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: "#E8F4FD", text: Colors.secondary },
  submitted: { bg: "#FFF3E0", text: Colors.accent },
  approved: { bg: "#E8F5E9", text: "#2E7D32" },
  rejected: { bg: "#FFEBEE", text: "#C62828" },
};

export default function TimesheetScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [refreshing, setRefreshing] = useState(false);
  const [viewAll, setViewAll] = useState(false);
  const { isAtLeast } = useRBAC();

  const canViewAllTimesheets = isAtLeast.projectManager;
  const canApproveTimesheets = isAtLeast.foreman;

  const { data: entries = mockTimeEntries, refetch } = useQuery({
    queryKey: ["/api/mobile/time-entries"],
    queryFn: async () => {
      try {
        const result = await api.timeTracking.entries();
        if ("error" in result) return mockTimeEntries;
        return result;
      } catch {
        return mockTimeEntries;
      }
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const totalHours = entries.reduce((sum, entry) => sum + (entry.hoursWorked || 0), 0);
  const approvedHours = entries.filter(e => e.status === "approved").reduce((sum, e) => sum + (e.hoursWorked || 0), 0);

  const projectBreakdown = entries.reduce((acc, entry) => {
    const projectName = entry.projectName || "General";
    if (!acc[projectName]) {
      acc[projectName] = { hours: 0, entries: 0 };
    }
    acc[projectName].hours += entry.hoursWorked || 0;
    acc[projectName].entries += 1;
    return acc;
  }, {} as Record<string, { hours: number; entries: number }>);

  const sortedProjects = Object.entries(projectBreakdown).sort((a, b) => b[1].hours - a[1].hours);

  const groupedByDate = entries.reduce((groups, entry) => {
    const date = new Date(entry.clockIn).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, TimeEntry[]>);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + Spacing.md, paddingBottom: insets.bottom + Spacing.xl }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>This Week</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalHours.toFixed(1)}</Text>
              <Text style={styles.summaryLabel}>Total Hours</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{approvedHours.toFixed(1)}</Text>
              <Text style={styles.summaryLabel}>Approved</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{entries.length}</Text>
              <Text style={styles.summaryLabel}>Entries</Text>
            </View>
          </View>
        </Card>

        {sortedProjects.length > 0 ? (
          <Card style={styles.projectBreakdownCard}>
            <View style={styles.projectBreakdownHeader}>
              <Text style={styles.projectBreakdownTitle}>Time by Project</Text>
            </View>
            {sortedProjects.map(([projectName, data]) => (
              <View key={projectName} style={styles.projectRow}>
                <View style={styles.projectInfo}>
                  <Feather name="briefcase" size={16} color={Colors.primary} />
                  <Text style={styles.projectRowName}>{projectName}</Text>
                </View>
                <View style={styles.projectStats}>
                  <Text style={styles.projectHours}>{data.hours.toFixed(1)}h</Text>
                  <Text style={styles.projectEntries}>{data.entries} {data.entries === 1 ? "entry" : "entries"}</Text>
                </View>
              </View>
            ))}
          </Card>
        ) : null}

        {canViewAllTimesheets ? (
          <View style={styles.scopeToggle}>
            <Pressable
              style={[styles.scopeButton, !viewAll && styles.scopeButtonActive]}
              onPress={() => setViewAll(false)}
            >
              <Text style={[styles.scopeText, !viewAll && styles.scopeTextActive]}>My Entries</Text>
            </Pressable>
            <Pressable
              style={[styles.scopeButton, viewAll && styles.scopeButtonActive]}
              onPress={() => setViewAll(true)}
            >
              <Feather name="users" size={14} color={viewAll ? "#fff" : Colors.textSecondary} />
              <Text style={[styles.scopeText, viewAll && styles.scopeTextActive]}>All Crew</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.viewToggle}>
          <Pressable
            style={[styles.toggleButton, viewMode === "daily" && styles.toggleButtonActive]}
            onPress={() => setViewMode("daily")}
          >
            <Text style={[styles.toggleText, viewMode === "daily" && styles.toggleTextActive]}>Daily</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, viewMode === "weekly" && styles.toggleButtonActive]}
            onPress={() => setViewMode("weekly")}
          >
            <Text style={[styles.toggleText, viewMode === "weekly" && styles.toggleTextActive]}>Weekly</Text>
          </Pressable>
        </View>

        {Object.entries(groupedByDate).map(([date, dayEntries]) => (
          <View key={date}>
            <Text style={styles.dateHeader}>{formatDate(dayEntries[0].clockIn)}</Text>
            {dayEntries.map((entry) => (
              <Card key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryInfo}>
                    <Text style={styles.projectName}>{entry.projectName || "General"}</Text>
                    {entry.taskName ? (
                      <Text style={styles.taskName} numberOfLines={1}>{entry.taskName}</Text>
                    ) : null}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors[entry.status]?.bg || "#f0f0f0" }]}>
                    <Text style={[styles.statusText, { color: statusColors[entry.status]?.text || "#666" }]}>
                      {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.timeRow}>
                  <View style={styles.timeItem}>
                    <Feather name="log-in" size={14} color={Colors.primary} />
                    <Text style={styles.timeLabel}>In:</Text>
                    <Text style={styles.timeValue}>{formatTime(entry.clockIn)}</Text>
                  </View>
                  {entry.clockOut ? (
                    <View style={styles.timeItem}>
                      <Feather name="log-out" size={14} color={Colors.accent} />
                      <Text style={styles.timeLabel}>Out:</Text>
                      <Text style={styles.timeValue}>{formatTime(entry.clockOut)}</Text>
                    </View>
                  ) : null}
                  <View style={styles.hoursItem}>
                    <Feather name="clock" size={14} color={Colors.secondary} />
                    <Text style={styles.hoursValue}>{entry.hoursWorked?.toFixed(1) || "--"} hrs</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ))}

        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="clock" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Time Entries</Text>
            <Text style={styles.emptyText}>Your time entries will appear here</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },
  summaryCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.primary,
  },
  summaryTitle: {
    fontWeight: "600",
    fontSize: FontSizes.sm,
    color: "rgba(255,255,255,0.8)",
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontWeight: "700",
    fontSize: FontSizes.xxl,
    color: "#fff",
  },
  summaryLabel: {
    fontSize: FontSizes.xs,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  scopeToggle: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.sm,
  },
  scopeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  scopeButtonActive: {
    backgroundColor: Colors.secondary,
  },
  scopeText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  scopeTextActive: {
    color: "#fff",
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.md,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.sm,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: "#fff",
  },
  dateHeader: {
    fontWeight: "700",
    fontSize: FontSizes.md,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  entryCard: {
    marginBottom: Spacing.sm,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  entryInfo: {
    flex: 1,
  },
  projectName: {
    fontWeight: "700",
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  taskName: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontWeight: "600",
    fontSize: FontSizes.xs,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  timeValue: {
    fontWeight: "600",
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  hoursItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  hoursValue: {
    fontWeight: "700",
    fontSize: FontSizes.sm,
    color: Colors.secondary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
  },
  emptyTitle: {
    fontWeight: "700",
    fontSize: FontSizes.lg,
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  projectBreakdownCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  projectBreakdownHeader: {
    marginBottom: Spacing.md,
  },
  projectBreakdownTitle: {
    fontWeight: "700",
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  projectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  projectInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  projectRowName: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: "500",
  },
  projectStats: {
    alignItems: "flex-end",
  },
  projectHours: {
    fontWeight: "700",
    fontSize: FontSizes.md,
    color: Colors.secondary,
  },
  projectEntries: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});
