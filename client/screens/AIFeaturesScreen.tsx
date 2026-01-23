import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { api, AIDailyReport } from "@/lib/api";
import { mockDailyReport } from "@/lib/mockData";
import { Colors, Spacing, BorderRadius, FontSizes, Fonts } from "@/constants/theme";
import { Card, CardContent } from "@/components/Card";
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
    color: Colors.accent,
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
  const { user } = useAuth();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [report, setReport] = useState<AIDailyReport | null>(null);

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

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + Spacing.md, paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerText}>AI-Powered Tools</Text>
        <Text style={styles.subHeaderText}>
          Leverage artificial intelligence to optimize your workflow
        </Text>

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
              <Card style={[styles.featureCard, !hasAccess && styles.featureCardDisabled]}>
                <CardContent>
                  <View style={styles.featureRow}>
                    <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                      <Feather name={feature.icon} size={24} color={hasAccess ? feature.color : Colors.textSecondary} />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={[styles.featureName, !hasAccess && styles.textDisabled]}>
                        {feature.name}
                      </Text>
                      <Text style={[styles.featureDescription, !hasAccess && styles.textDisabled]}>
                        {feature.description}
                      </Text>
                      {!hasAccess ? (
                        <View style={styles.lockedBadge}>
                          <Feather name="lock" size={12} color={Colors.textSecondary} />
                          <Text style={styles.lockedText}>
                            {feature.minRole === "project_manager" ? "Manager+" : "Lead+"} only
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    {hasAccess ? (
                      isLoading ? (
                        <ActivityIndicator color={feature.color} />
                      ) : (
                        <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
                      )
                    ) : null}
                  </View>
                </CardContent>
              </Card>
            </Pressable>
          );
        })}

        {report ? (
          <View style={styles.reportSection}>
            <Text style={styles.reportTitle}>Daily Report</Text>
            
            <Card style={styles.reportCard}>
              <CardContent>
                <Text style={styles.reportSummary}>{report.summary}</Text>
                
                <View style={styles.attendanceRow}>
                  <View style={styles.attendanceItem}>
                    <Text style={styles.attendanceValue}>{report.attendance.present}</Text>
                    <Text style={styles.attendanceLabel}>Present</Text>
                  </View>
                  <View style={styles.attendanceDivider} />
                  <View style={styles.attendanceItem}>
                    <Text style={[styles.attendanceValue, { color: Colors.accent }]}>{report.attendance.late}</Text>
                    <Text style={styles.attendanceLabel}>Late</Text>
                  </View>
                  <View style={styles.attendanceDivider} />
                  <View style={styles.attendanceItem}>
                    <Text style={[styles.attendanceValue, { color: "#C62828" }]}>{report.attendance.absent}</Text>
                    <Text style={styles.attendanceLabel}>Absent</Text>
                  </View>
                </View>

                <View style={styles.tasksRow}>
                  <View style={styles.tasksStat}>
                    <Feather name="check-circle" size={18} color={Colors.success} />
                    <Text style={styles.tasksValue}>{report.tasksCompleted}</Text>
                    <Text style={styles.tasksLabel}>Completed</Text>
                  </View>
                  <View style={styles.tasksStat}>
                    <Feather name="clock" size={18} color={Colors.accent} />
                    <Text style={styles.tasksValue}>{report.tasksPending}</Text>
                    <Text style={styles.tasksLabel}>Pending</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Text style={styles.projectsTitle}>Project Updates</Text>
            {report.projectUpdates.map((project, index) => (
              <Card key={index} style={styles.projectCard}>
                <CardContent>
                  <View style={styles.projectHeader}>
                    <Text style={styles.projectName}>{project.projectName}</Text>
                    <Text style={styles.projectProgress}>{project.progress}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${project.progress}%` }]} />
                  </View>
                  {project.highlights.map((highlight, i) => (
                    <View key={i} style={styles.highlightRow}>
                      <Feather name="check" size={14} color={Colors.success} />
                      <Text style={styles.highlightText}>{highlight}</Text>
                    </View>
                  ))}
                </CardContent>
              </Card>
            ))}
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
  headerText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xxl,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subHeaderText: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
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
  featureName: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  featureDescription: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  textDisabled: {
    color: Colors.textSecondary,
  },
  lockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.xs,
  },
  lockedText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  reportSection: {
    marginTop: Spacing.lg,
  },
  reportTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  reportCard: {
    marginBottom: Spacing.md,
  },
  reportSummary: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.md,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  attendanceRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  attendanceItem: {
    alignItems: "center",
  },
  attendanceValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xl,
    color: Colors.success,
  },
  attendanceLabel: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  attendanceDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
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
  tasksValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  tasksLabel: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  projectsTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    color: Colors.text,
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
  projectName: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  projectProgress: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    color: Colors.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
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
  highlightText: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    color: Colors.text,
    flex: 1,
  },
});
