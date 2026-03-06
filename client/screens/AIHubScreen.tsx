import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/constants/theme";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { AIStackParamList } from "@/navigation/AIStackNavigator";

type AIHubNavigationProp = NativeStackNavigationProp<AIStackParamList>;

interface AIFeature {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  screen: keyof AIStackParamList;
  gradient: [string, string];
  isNew?: boolean;
  isPrimary?: boolean;
}

const aiFeatures: AIFeature[] = [
  {
    id: "daily-briefing",
    name: "Daily Briefing",
    description: "AI-powered morning summary with weather, tasks & safety",
    icon: "sunrise",
    screen: "AIDailyBriefing",
    gradient: ["#FF6B35", "#F7931E"],
    isNew: true,
    isPrimary: true,
  },
  {
    id: "team-builder",
    name: "AI Team Builder",
    description: "Build optimal crews with natural language requests",
    icon: "users",
    screen: "AITeamBuilder",
    gradient: ["#6C63FF", "#4834D4"],
    isNew: true,
    isPrimary: true,
  },
  {
    id: "voice-task",
    name: "Voice-to-Task",
    description: "Update tasks hands-free with voice commands",
    icon: "mic",
    screen: "AIVoiceTask",
    gradient: ["#00BFA5", "#00897B"],
    isPrimary: true,
  },
  {
    id: "building-code",
    name: "Building Code Q&A",
    description: "Ask building code questions and get instant answers",
    icon: "book-open",
    screen: "AIBuildingCode",
    gradient: ["#E91E63", "#C2185B"],
    isNew: true,
    isPrimary: true,
  },
  {
    id: "blueprint-takeoff",
    name: "Blueprint Takeoff",
    description: "Extract quantities and costs from blueprint photos",
    icon: "layers",
    screen: "AIBlueprintTakeoff",
    gradient: ["#00ACC1", "#00838F"],
    isNew: true,
    isPrimary: true,
  },
  {
    id: "photo-doc",
    name: "Photo Documentation",
    description: "AI generates progress notes from photos",
    icon: "camera",
    screen: "AIPhotoDoc",
    gradient: ["#0288D1", "#01579B"],
  },
  {
    id: "ppe-reminder",
    name: "PPE Reminders",
    description: "Smart safety equipment alerts for each task",
    icon: "shield",
    screen: "AIPPEReminder",
    gradient: ["#FF9800", "#F57C00"],
  },
  {
    id: "self-healing",
    name: "Self-Healing Shifts",
    description: "AI finds replacements when shifts are at risk",
    icon: "refresh-cw",
    screen: "AISelfHealing",
    gradient: ["#4CAF50", "#388E3C"],
  },
  {
    id: "availability",
    name: "Availability Pool",
    description: "Mark yourself available for AI task matching",
    icon: "user-check",
    screen: "AIAvailability",
    gradient: ["#9C27B0", "#7B1FA2"],
  },
  {
    id: "ai-dispatch",
    name: "AI Equipment Dispatch",
    description: "Smart equipment recommendations based on health",
    icon: "truck",
    screen: "AIEquipmentDispatch",
    gradient: ["#607D8B", "#455A64"],
  },
];

export default function AIHubScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AIHubNavigationProp>();
  const { theme, accentColors } = useTheme();
  const { user } = useAuth();

  const handleFeaturePress = (feature: AIFeature) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate(feature.screen);
  };

  const primaryFeatures = aiFeatures.filter((f) => f.isPrimary);
  const otherFeatures = aiFeatures.filter((f) => !f.isPrimary);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.md, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeSection}>
          <ThemedText style={styles.welcomeText}>
            Hi, {user?.firstName || user?.email?.split("@")[0] || "there"}
          </ThemedText>
          <ThemedText style={styles.welcomeSubtext}>
            What would you like AI to help with today?
          </ThemedText>
        </View>

        <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
        <View style={styles.primaryGrid}>
          {primaryFeatures.map((feature) => (
            <Pressable
              key={feature.id}
              style={styles.primaryCard}
              onPress={() => handleFeaturePress(feature)}
              testID={`ai-feature-${feature.id}`}
            >
              <LinearGradient
                colors={feature.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryGradient}
              >
                {feature.isNew ? (
                  <View style={styles.newBadge}>
                    <ThemedText style={styles.newBadgeText}>NEW</ThemedText>
                  </View>
                ) : null}
                <View style={styles.primaryIconContainer}>
                  <Feather name={feature.icon} size={24} color="#FFFFFF" />
                </View>
                <ThemedText style={styles.primaryName}>{feature.name}</ThemedText>
                <ThemedText style={styles.primaryDescription}>
                  {feature.description}
                </ThemedText>
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        <ThemedText style={styles.sectionTitle}>More AI Tools</ThemedText>
        <View style={styles.otherList}>
          {otherFeatures.map((feature) => (
            <Card key={feature.id} style={styles.otherCard}>
              <Pressable
                style={styles.otherCardInner}
                onPress={() => handleFeaturePress(feature)}
                testID={`ai-feature-${feature.id}`}
              >
                <LinearGradient
                  colors={feature.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.otherIconContainer}
                >
                  <Feather name={feature.icon} size={22} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.otherInfo}>
                  <ThemedText style={styles.otherName}>{feature.name}</ThemedText>
                  <ThemedText style={styles.otherDescription}>
                    {feature.description}
                  </ThemedText>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </Pressable>
            </Card>
          ))}
        </View>

        <Card style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Feather name="zap" size={20} color={Colors.warning} />
            <ThemedText style={styles.tipTitle}>Pro Tip</ThemedText>
          </View>
          <ThemedText style={styles.tipText}>
            Voice-to-Task works best when you mention the task name or location. 
            Just say something like "I finished installing drywall in room 204" and 
            AI will identify the task automatically.
          </ThemedText>
        </Card>
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
  welcomeSection: {
    marginBottom: Spacing.lg,
  },
  welcomeText: {
    fontSize: FontSizes.xxl,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  welcomeSubtext: {
    fontSize: FontSizes.md,
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  primaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  primaryCard: {
    width: "48%",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryGradient: {
    padding: Spacing.md,
    minHeight: 150,
    justifyContent: "space-between",
  },
  newBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primary,
  },
  primaryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  primaryName: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  primaryDescription: {
    fontSize: FontSizes.xs,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 16,
  },
  otherList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  otherCard: {
    padding: 0,
    overflow: "hidden",
  },
  otherCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  otherIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  otherInfo: {
    flex: 1,
  },
  otherName: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    marginBottom: 2,
  },
  otherDescription: {
    fontSize: FontSizes.sm,
    opacity: 0.6,
    lineHeight: 18,
  },
  tipCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tipTitle: {
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  tipText: {
    fontSize: FontSizes.sm,
    opacity: 0.7,
    lineHeight: 20,
  },
});
