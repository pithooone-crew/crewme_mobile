import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Modal } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { api, AIDailyReport, Project } from "@/lib/api";
import { mockDailyReport, mockProjects } from "@/lib/mockData";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";

type AIFeature = {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  minRole: string;
};

const aiFeatures: AIFeature[] = [
  {
    id: "daily-report",
    name: "Daily Report",
    description: "Generate AI-powered summary of today's progress and activities",
    icon: "file-text",
    color: Colors.primary,
    minRole: "lead",
  },
  {
    id: "team-builder",
    name: "Team Builder",
    description: "Get optimal team compositions for upcoming projects",
    icon: "users",
    color: Colors.secondary,
    minRole: "project_manager",
  },
  {
    id: "schedule-optimizer",
    name: "Schedule Optimizer",
    description: "Optimize task scheduling for maximum efficiency",
    icon: "calendar",
    color: Colors.warning,
    minRole: "project_manager",
  },
  {
    id: "skills-gap",
    name: "Skills Gap Analysis",
    description: "Identify training needs and skill development opportunities",
    icon: "trending-up",
    color: "#7B1FA2",
    minRole: "lead",
  },
  {
    id: "photo-analysis",
    name: "Photo Analysis",
    description: "Analyze work site photos for safety and progress",
    icon: "camera",
    color: "#0288D1",
    minRole: "crew_member",
  },
];

const roleHierarchy = ["crew_member", "lead", "foreman", "project_manager", "admin"];

export default function AIFeaturesScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [report, setReport] = useState<AIDailyReport | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const { data: projectsData } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const projects = projectsData || mockProjects;

  const userRoleIndex = roleHierarchy.indexOf(user?.role || "crew_member");

  const canAccessFeature = (minRole: string) => {
    const minRoleIndex = roleHierarchy.indexOf(minRole);
    return userRoleIndex >= minRoleIndex;
  };

  const dailyReportMutation = useMutation({
    mutationFn: async () => {
      const result = await api.ai.dailyReport();
      if ("error" in result) return mockDailyReport;
      return result;
    },
    onSuccess: (data) => {
      setReport(data as AIDailyReport);
    },
  });

  const handleFeaturePress = (feature: AIFeature) => {
    if (!canAccessFeature(feature.minRole)) return;
    
    setSelectedFeature(feature.id);
    
    if (feature.id === "daily-report") {
      dailyReportMutation.mutate();
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setShowProjectPicker(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      <ThemedText type="h2" style={styles.headerText}>AI-Powered Tools</ThemedText>
      <ThemedText style={[styles.subHeaderText, { color: theme.textSecondary }]}>
        Leverage artificial intelligence to optimize your workflow
      </ThemedText>

      <Card style={styles.projectSelector}>
        <ThemedText style={[styles.projectSelectorLabel, { color: theme.textSecondary }]}>
          Project Context for AI Analysis
        </ThemedText>
        <Pressable
          style={[styles.projectSelectorButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
          onPress={() => setShowProjectPicker(true)}
        >
          <Feather name="folder" size={18} color={selectedProject ? Colors.primary : theme.textSecondary} />
          <ThemedText style={styles.projectSelectorText} numberOfLines={1}>
            {selectedProject ? selectedProject.name : "All Projects (General Analysis)"}
          </ThemedText>
          <Feather name="chevron-down" size={18} color={theme.textSecondary} />
        </Pressable>
        {selectedProject ? (
          <ThemedText style={[styles.projectHint, { color: theme.textSecondary }]}>
            AI insights will focus on {selectedProject.name}
          </ThemedText>
        ) : null}
      </Card>

      <Modal
        visible={showProjectPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProjectPicker(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <ThemedText type="h3">Select Project</ThemedText>
            <Pressable onPress={() => setShowProjectPicker(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent}>
            <Pressable
              style={[
                styles.projectOption,
                { backgroundColor: !selectedProject ? `${Colors.primary}15` : theme.backgroundDefault },
              ]}
              onPress={() => {
                setSelectedProject(null);
                setShowProjectPicker(false);
              }}
            >
              <Feather name="globe" size={20} color={!selectedProject ? Colors.primary : theme.textSecondary} />
              <View style={styles.projectOptionContent}>
                <ThemedText style={!selectedProject ? { color: Colors.primary, fontWeight: "600" } : undefined}>
                  All Projects
                </ThemedText>
                <ThemedText style={[styles.projectOptionSubtitle, { color: theme.textSecondary }]}>
                  General analysis across all active projects
                </ThemedText>
              </View>
              {!selectedProject ? <Feather name="check" size={20} color={Colors.primary} /> : null}
            </Pressable>
            {projects.map((project) => (
              <Pressable
                key={project.id}
                style={[
                  styles.projectOption,
                  { backgroundColor: selectedProject?.id === project.id ? `${Colors.primary}15` : theme.backgroundDefault },
                ]}
                onPress={() => handleProjectSelect(project)}
              >
                <Feather
                  name="folder"
                  size={20}
                  color={selectedProject?.id === project.id ? Colors.primary : theme.textSecondary}
                />
                <View style={styles.projectOptionContent}>
                  <ThemedText
                    style={selectedProject?.id === project.id ? { color: Colors.primary, fontWeight: "600" } : undefined}
                  >
                    {project.name}
                  </ThemedText>
                  <ThemedText style={[styles.projectOptionSubtitle, { color: theme.textSecondary }]}>
                    {project.location?.address || "No location set"}
                  </ThemedText>
                </View>
                {selectedProject?.id === project.id ? <Feather name="check" size={20} color={Colors.primary} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </ThemedView>
      </Modal>

      {aiFeatures.map((feature) => {
        const hasAccess = canAccessFeature(feature.minRole);
        const isSelected = selectedFeature === feature.id;
        const isLoading = isSelected && dailyReportMutation.isPending;

        return (
          <Pressable
            key={feature.id}
            onPress={() => handleFeaturePress(feature)}
            disabled={!hasAccess}
          >
            <Card style={styles.featureCard}>
              <View style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                  <Feather name={feature.icon} size={24} color={hasAccess ? feature.color : theme.textSecondary} />
                </View>
                <View style={styles.featureContent}>
                  <ThemedText type="h4" style={!hasAccess ? { color: theme.textSecondary } : undefined}>
                    {feature.name}
                  </ThemedText>
                  <ThemedText style={[styles.featureDescription, { color: theme.textSecondary }]}>
                    {feature.description}
                  </ThemedText>
                  {!hasAccess ? (
                    <View style={styles.lockedBadge}>
                      <Feather name="lock" size={12} color={theme.textSecondary} />
                      <ThemedText style={[styles.lockedText, { color: theme.textSecondary }]}>
                        {feature.minRole === "project_manager" ? "Manager+" : "Lead+"} only
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
                {hasAccess ? (
                  isLoading ? (
                    <ActivityIndicator color={feature.color} />
                  ) : (
                    <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                  )
                ) : null}
              </View>
            </Card>
          </Pressable>
        );
      })}

      {report ? (
        <View style={styles.reportSection}>
          <ThemedText type="h3" style={styles.reportTitle}>Daily Report</ThemedText>
          
          <Card style={styles.reportCard}>
            <ThemedText style={styles.reportSummary}>{report.summary}</ThemedText>
            
            <View style={[styles.attendanceRow, { borderColor: theme.border }]}>
              <View style={styles.attendanceItem}>
                <ThemedText type="h2" style={{ color: Colors.success }}>{report.attendance.present}</ThemedText>
                <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>Present</ThemedText>
              </View>
              <View style={[styles.attendanceDivider, { backgroundColor: theme.border }]} />
              <View style={styles.attendanceItem}>
                <ThemedText type="h2" style={{ color: Colors.warning }}>{report.attendance.late}</ThemedText>
                <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>Late</ThemedText>
              </View>
              <View style={[styles.attendanceDivider, { backgroundColor: theme.border }]} />
              <View style={styles.attendanceItem}>
                <ThemedText type="h2" style={{ color: Colors.error }}>{report.attendance.absent}</ThemedText>
                <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>Absent</ThemedText>
              </View>
            </View>

            <View style={styles.tasksRow}>
              <View style={styles.tasksStat}>
                <Feather name="check-circle" size={18} color={Colors.success} />
                <ThemedText type="h4">{report.tasksCompleted}</ThemedText>
                <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>Completed</ThemedText>
              </View>
              <View style={styles.tasksStat}>
                <Feather name="clock" size={18} color={Colors.warning} />
                <ThemedText type="h4">{report.tasksPending}</ThemedText>
                <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>Pending</ThemedText>
              </View>
            </View>
          </Card>

          <ThemedText type="h4" style={styles.projectsTitle}>Project Updates</ThemedText>
          {report.projectUpdates.map((project, index) => (
            <Card key={index} style={styles.projectCard}>
              <View style={styles.projectHeader}>
                <ThemedText type="h4">{project.projectName}</ThemedText>
                <ThemedText style={{ color: Colors.primary, fontWeight: "700" }}>{project.progress}%</ThemedText>
              </View>
              <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                <View style={[styles.progressFill, { width: `${project.progress}%` }]} />
              </View>
              {project.highlights.map((highlight, i) => (
                <View key={i} style={styles.highlightRow}>
                  <Feather name="check" size={14} color={Colors.success} />
                  <ThemedText style={{ color: theme.textSecondary, flex: 1, fontSize: 14 }}>{highlight}</ThemedText>
                </View>
              ))}
            </Card>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerText: {
    marginBottom: Spacing.xs,
  },
  subHeaderText: {
    fontSize: 15,
    marginBottom: Spacing.xl,
  },
  featureCard: {
    marginBottom: Spacing.md,
  },
  featureCardDisabled: {
    opacity: 0.6,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  lockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.xs,
  },
  lockedText: {
    fontSize: 11,
    fontWeight: "500",
  },
  reportSection: {
    marginTop: Spacing.lg,
  },
  reportTitle: {
    marginBottom: Spacing.md,
  },
  reportCard: {
    marginBottom: Spacing.md,
  },
  reportSummary: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  attendanceRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: Spacing.md,
  },
  attendanceItem: {
    alignItems: "center",
  },
  attendanceDivider: {
    width: 1,
    height: 30,
  },
  tasksRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tasksStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  projectsTitle: {
    marginBottom: Spacing.sm,
  },
  projectCard: {
    marginBottom: Spacing.sm,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  projectSelector: {
    marginBottom: Spacing.xl,
  },
  projectSelectorLabel: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  projectSelectorButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  projectSelectorText: {
    flex: 1,
    fontSize: FontSizes.md,
    fontWeight: "500",
  },
  projectHint: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.sm,
    fontStyle: "italic",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  projectOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  projectOptionContent: {
    flex: 1,
  },
  projectOptionSubtitle: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
});
