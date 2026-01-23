import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/constants/theme";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

type FeatureItem = {
  id: string;
  name: string;
  icon: keyof typeof Feather.glyphMap;
  screen: string;
  color: string;
  minRole?: string;
};

type FeatureGroup = {
  id: string;
  name: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  items: FeatureItem[];
};

const featureGroups: FeatureGroup[] = [
  {
    id: "command-center",
    name: "Command Center",
    icon: "command",
    color: Colors.primary,
    items: [
      { id: "dashboard", name: "Dashboard", icon: "home", screen: "Home", color: Colors.primary },
      { id: "ai-command", name: "AI Command", icon: "cpu", screen: "AIFeatures", color: "#00BFA5", minRole: "lead" },
      { id: "ai-insights", name: "AI Insights", icon: "bar-chart-2", screen: "AIFeatures", color: "#7B1FA2", minRole: "lead" },
    ],
  },
  {
    id: "core-work",
    name: "Core Work",
    icon: "briefcase",
    color: Colors.secondary,
    items: [
      { id: "projects", name: "Projects", icon: "folder", screen: "Projects", color: Colors.secondary },
      { id: "crew", name: "Crew", icon: "users", screen: "Crew", color: Colors.accent, minRole: "lead" },
      { id: "time-tracking", name: "Time Tracking", icon: "clock", screen: "Timesheet", color: Colors.warning },
      { id: "attendance", name: "Attendance", icon: "log-in", screen: "Attendance", color: Colors.success },
      { id: "crew-id", name: "Crew ID Card", icon: "credit-card", screen: "CrewIDCard", color: Colors.primary },
    ],
  },
  {
    id: "ai-planning",
    name: "AI Planning",
    icon: "calendar",
    color: "#00BFA5",
    items: [
      { id: "smart-scheduling", name: "Smart Scheduling", icon: "calendar", screen: "AIFeatures", color: "#00BFA5", minRole: "project_manager" },
      { id: "what-if", name: "What-If Analysis", icon: "git-branch", screen: "AIFeatures", color: "#0288D1", minRole: "project_manager" },
      { id: "schedule-optimizer", name: "Schedule Optimizer", icon: "zap", screen: "AIFeatures", color: Colors.warning, minRole: "project_manager" },
      { id: "self-healing", name: "Self-Healing", icon: "refresh-cw", screen: "AINotifications", color: Colors.success },
      { id: "availability-pool", name: "Availability Pool", icon: "user-check", screen: "AvailabilityPool", color: Colors.primary },
    ],
  },
  {
    id: "ai-team",
    name: "AI Team",
    icon: "users",
    color: "#7B1FA2",
    items: [
      { id: "crew-matchmaker", name: "Crew Matchmaker", icon: "user-plus", screen: "AIFeatures", color: "#7B1FA2", minRole: "lead" },
      { id: "team-builder", name: "Team Builder", icon: "users", screen: "AIFeatures", color: Colors.secondary, minRole: "project_manager" },
      { id: "skills-gap", name: "Skills Gap", icon: "trending-up", screen: "AIFeatures", color: Colors.accent, minRole: "lead" },
      { id: "performance", name: "Performance Ratings", icon: "star", screen: "StarPerformer", color: Colors.xpGold },
    ],
  },
  {
    id: "gamification",
    name: "Gamification",
    icon: "award",
    color: Colors.xpGold,
    items: [
      { id: "achievements", name: "Achievements", icon: "award", screen: "Progress", color: Colors.xpGold },
      { id: "skill-trees", name: "Skill Trees", icon: "git-merge", screen: "SkillTree", color: Colors.success },
      { id: "star-performers", name: "Star Performers", icon: "star", screen: "StarPerformer", color: Colors.accent },
      { id: "rewards", name: "Rewards Store", icon: "gift", screen: "RewardsStore", color: Colors.primary },
    ],
  },
  {
    id: "ai-finance",
    name: "AI Finance",
    icon: "dollar-sign",
    color: Colors.success,
    items: [
      { id: "cost-predictor", name: "Cost Predictor", icon: "trending-up", screen: "AIFeatures", color: Colors.success, minRole: "project_manager" },
      { id: "budget-anomalies", name: "Budget Anomalies", icon: "alert-triangle", screen: "AIFeatures", color: Colors.warning, minRole: "project_manager" },
      { id: "estimates", name: "Estimates", icon: "file-text", screen: "Templates", color: Colors.secondary, minRole: "lead" },
    ],
  },
  {
    id: "operations",
    name: "Operations",
    icon: "settings",
    color: Colors.accent,
    items: [
      { id: "gps-clock", name: "GPS Time Clock", icon: "map-pin", screen: "Timesheet", color: Colors.accent },
      { id: "weather", name: "Weather Alerts", icon: "cloud", screen: "Notifications", color: "#0288D1" },
      { id: "messages", name: "Crew Messages", icon: "mail", screen: "Messages", color: "#00BFA5" },
      { id: "equipment", name: "Equipment", icon: "tool", screen: "Projects", color: Colors.secondary, minRole: "lead" },
    ],
  },
  {
    id: "quality-docs",
    name: "Quality & Docs",
    icon: "file-text",
    color: "#0288D1",
    items: [
      { id: "safety", name: "Safety", icon: "shield", screen: "Projects", color: Colors.error },
      { id: "checklists", name: "Checklists", icon: "check-square", screen: "Tasks", color: Colors.success },
      { id: "daily-reports", name: "Daily Reports", icon: "file-text", screen: "AIFeatures", color: "#0288D1", minRole: "lead" },
      { id: "documents", name: "Documents", icon: "folder", screen: "Projects", color: Colors.secondary },
    ],
  },
];

const roleHierarchy = ["crew_member", "lead", "foreman", "project_manager", "admin"];

export default function MoreScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<any>>();

  const userRoleIndex = roleHierarchy.indexOf(user?.role || "crew_member");

  const canAccessFeature = (minRole?: string) => {
    if (!minRole) return true;
    const minRoleIndex = roleHierarchy.indexOf(minRole);
    return userRoleIndex >= minRoleIndex;
  };

  const handleItemPress = (item: FeatureItem) => {
    if (!canAccessFeature(item.minRole)) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate(item.screen as never);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="h2" style={styles.pageTitle}>All Features</ThemedText>
        <ThemedText style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
          Access all CrewMe features organized by category
        </ThemedText>

        {featureGroups.map((group) => (
          <Card key={group.id} style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupIcon, { backgroundColor: `${group.color}20` }]}>
                <Feather name={group.icon} size={20} color={group.color} />
              </View>
              <ThemedText type="h4">{group.name}</ThemedText>
            </View>

            <View style={styles.itemsGrid}>
              {group.items.map((item) => {
                const hasAccess = canAccessFeature(item.minRole);
                return (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.featureItem,
                      { backgroundColor: theme.backgroundSecondary },
                      !hasAccess ? styles.featureItemDisabled : null,
                    ]}
                    onPress={() => handleItemPress(item)}
                    disabled={!hasAccess}
                  >
                    <View style={[styles.itemIcon, { backgroundColor: `${item.color}20` }]}>
                      <Feather
                        name={item.icon}
                        size={18}
                        color={hasAccess ? item.color : theme.textSecondary}
                      />
                    </View>
                    <ThemedText
                      style={[
                        styles.itemName,
                        !hasAccess ? { color: theme.textSecondary } : null,
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </ThemedText>
                    {!hasAccess ? (
                      <Feather name="lock" size={12} color={theme.textSecondary} style={styles.lockIcon} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </Card>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },
  pageTitle: {
    marginBottom: Spacing.xs,
  },
  pageSubtitle: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.lg,
  },
  groupCard: {
    marginBottom: Spacing.md,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  groupIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  featureItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  featureItemDisabled: {
    opacity: 0.5,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  itemName: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: "500",
  },
  lockIcon: {
    marginLeft: Spacing.xs,
  },
});
