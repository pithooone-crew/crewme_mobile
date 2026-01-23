import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api, Project } from "@/lib/api";
import { mockProjects } from "@/lib/mockData";
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, Fonts } from "@/constants/theme";
import { Card, CardContent } from "@/components/Card";

type StatusFilter = "all" | "planning" | "active" | "completed" | "on_hold";

const statusColors: Record<string, { bg: string; text: string }> = {
  planning: { bg: "#E8F4FD", text: Colors.secondary },
  active: { bg: "#E8F5E9", text: "#2E7D32" },
  completed: { bg: "#F3E5F5", text: "#7B1FA2" },
  on_hold: { bg: "#FFF3E0", text: Colors.accent },
};

export default function ProjectsScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const { data: projects = mockProjects, refetch } = useQuery({
    queryKey: ["/api/mobile/projects", filter],
    queryFn: async () => {
      try {
        const result = await api.projects.list(filter !== "all" ? { status: filter } : undefined);
        if ("error" in result) return mockProjects;
        return result;
      } catch {
        return mockProjects;
      }
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredProjects = filter === "all" 
    ? projects 
    : projects.filter(p => p.status === filter);

  const formatBudget = (budget?: number) => {
    if (!budget) return "N/A";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(budget);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + Spacing.md, paddingBottom: insets.bottom + Spacing.xl }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer} contentContainerStyle={styles.filterContent}>
          {(["all", "active", "planning", "completed", "on_hold"] as StatusFilter[]).map((status) => (
            <Pressable
              key={status}
              style={[styles.filterChip, filter === status && styles.filterChipActive]}
              onPress={() => setFilter(status)}
            >
              <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
                {status === "all" ? "All" : status === "on_hold" ? "On Hold" : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.countText}>{filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""}</Text>

        {filteredProjects.map((project) => (
          <Card key={project.id} style={styles.projectCard}>
            <CardContent>
              <View style={styles.projectHeader}>
                <View style={styles.projectTitleRow}>
                  <Text style={styles.projectName}>{project.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors[project.status]?.bg || "#f0f0f0" }]}>
                    <Text style={[styles.statusText, { color: statusColors[project.status]?.text || "#666" }]}>
                      {project.status === "on_hold" ? "On Hold" : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.projectDescription} numberOfLines={2}>{project.description}</Text>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <Text style={styles.progressValue}>{project.progress}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${project.progress}%` }]} />
                </View>
              </View>

              <View style={styles.projectDetails}>
                <View style={styles.detailRow}>
                  <Feather name="map-pin" size={14} color={Colors.textSecondary} />
                  <Text style={styles.detailText} numberOfLines={1}>{project.location.address}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Feather name="calendar" size={14} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>{formatDate(project.startDate)} - {formatDate(project.endDate)}</Text>
                </View>
                {project.client ? (
                  <View style={styles.detailRow}>
                    <Feather name="briefcase" size={14} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{project.client}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Feather name="check-square" size={16} color={Colors.primary} />
                  <Text style={styles.statValue}>{project.tasksCount}</Text>
                  <Text style={styles.statLabel}>Tasks</Text>
                </View>
                <View style={styles.statItem}>
                  <Feather name="users" size={16} color={Colors.secondary} />
                  <Text style={styles.statValue}>{project.crewCount}</Text>
                  <Text style={styles.statLabel}>Crew</Text>
                </View>
                <View style={styles.statItem}>
                  <Feather name="dollar-sign" size={16} color={Colors.accent} />
                  <Text style={styles.statValue}>{formatBudget(project.budget)}</Text>
                  <Text style={styles.statLabel}>Budget</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        ))}
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
  filterContainer: {
    marginBottom: Spacing.md,
  },
  filterContent: {
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: "#fff",
  },
  countText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  projectCard: {
    marginBottom: Spacing.md,
  },
  projectHeader: {
    marginBottom: Spacing.md,
  },
  projectTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
  },
  projectName: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
    textTransform: "uppercase",
  },
  projectDescription: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: Spacing.md,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  progressValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xs,
    color: Colors.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  projectDetails: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  detailText: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  statLabel: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});
