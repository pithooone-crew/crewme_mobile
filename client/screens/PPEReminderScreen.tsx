import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/constants/theme";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

interface PPEItem {
  id: string;
  name: string;
  icon: keyof typeof Feather.glyphMap;
  description: string;
  required: boolean;
}

interface TaskPPE {
  taskType: string;
  taskName: string;
  ppeItems: PPEItem[];
  hazards: string[];
}

interface PPESettings {
  enableReminders: boolean;
  reminderBeforeTask: boolean;
  dailyBriefing: boolean;
  vibrationAlerts: boolean;
}

const PPE_SETTINGS_KEY = "@crewme_ppe_settings";

const ppeDatabase: Record<string, PPEItem[]> = {
  welding: [
    { id: "welding-helmet", name: "Welding Helmet", icon: "shield", description: "Auto-darkening welding helmet", required: true },
    { id: "welding-gloves", name: "Welding Gloves", icon: "layers", description: "Heat-resistant leather gloves", required: true },
    { id: "welding-jacket", name: "Welding Jacket", icon: "disc", description: "Fire-resistant jacket", required: true },
    { id: "safety-boots", name: "Steel-Toe Boots", icon: "anchor", description: "ANSI-rated steel toe boots", required: true },
    { id: "respirator", name: "Respirator", icon: "wind", description: "Fume respirator for enclosed spaces", required: false },
  ],
  electrical: [
    { id: "insulated-gloves", name: "Insulated Gloves", icon: "zap-off", description: "Voltage-rated rubber gloves", required: true },
    { id: "safety-glasses", name: "Safety Glasses", icon: "eye", description: "Arc-flash rated eyewear", required: true },
    { id: "hard-hat", name: "Hard Hat", icon: "shield", description: "Class E electrical rated", required: true },
    { id: "arc-flash-suit", name: "Arc Flash Suit", icon: "disc", description: "For high-voltage work", required: false },
  ],
  heights: [
    { id: "hard-hat", name: "Hard Hat", icon: "shield", description: "Impact-resistant hard hat", required: true },
    { id: "harness", name: "Safety Harness", icon: "link", description: "Full-body fall arrest harness", required: true },
    { id: "lanyard", name: "Shock-Absorbing Lanyard", icon: "link-2", description: "Self-retracting lanyard", required: true },
    { id: "safety-boots", name: "Non-Slip Boots", icon: "anchor", description: "Slip-resistant work boots", required: true },
  ],
  demolition: [
    { id: "hard-hat", name: "Hard Hat", icon: "shield", description: "Impact-resistant hard hat", required: true },
    { id: "safety-glasses", name: "Safety Glasses", icon: "eye", description: "Impact-resistant eyewear", required: true },
    { id: "respirator", name: "Dust Respirator", icon: "wind", description: "N95 or P100 respirator", required: true },
    { id: "hearing-protection", name: "Hearing Protection", icon: "volume-x", description: "Earplugs or earmuffs", required: true },
    { id: "gloves", name: "Cut-Resistant Gloves", icon: "layers", description: "Level A4+ cut resistance", required: true },
  ],
  general: [
    { id: "hard-hat", name: "Hard Hat", icon: "shield", description: "ANSI-rated hard hat", required: true },
    { id: "safety-glasses", name: "Safety Glasses", icon: "eye", description: "ANSI Z87.1 rated", required: true },
    { id: "safety-vest", name: "High-Vis Vest", icon: "disc", description: "Class 2 or higher visibility", required: true },
    { id: "safety-boots", name: "Steel-Toe Boots", icon: "anchor", description: "ASTM F2413 rated", required: true },
  ],
};

const mockUpcomingTasks: TaskPPE[] = [
  {
    taskType: "welding",
    taskName: "Structural beam welding - Floor 5",
    ppeItems: ppeDatabase.welding,
    hazards: ["UV radiation", "Sparks and hot metal", "Fumes", "Burns"],
  },
  {
    taskType: "heights",
    taskName: "Install HVAC ducts - Roof level",
    ppeItems: ppeDatabase.heights,
    hazards: ["Fall risk", "Falling objects", "Weather exposure"],
  },
];

export default function PPEReminderScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme, accentColors } = useTheme();
  const { user } = useAuth();

  const [settings, setSettings] = useState<PPESettings>({
    enableReminders: true,
    reminderBeforeTask: true,
    dailyBriefing: true,
    vibrationAlerts: true,
  });
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [expandedTask, setExpandedTask] = useState<string | null>(mockUpcomingTasks[0]?.taskName);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(PPE_SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load PPE settings:", error);
    }
  };

  const updateSetting = async (key: keyof PPESettings, value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem(PPE_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save PPE settings:", error);
    }
  };

  const togglePPEItem = (itemId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const toggleTaskExpand = (taskName: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedTask(expandedTask === taskName ? null : taskName);
  };

  const getCompletionPercentage = (ppeItems: PPEItem[]) => {
    const requiredItems = ppeItems.filter((item) => item.required);
    const checkedRequired = requiredItems.filter((item) => checkedItems[item.id]);
    return Math.round((checkedRequired.length / requiredItems.length) * 100);
  };

  const handleConfirmReady = (taskName: string, ppeItems: PPEItem[]) => {
    const requiredItems = ppeItems.filter((item) => item.required);
    const allChecked = requiredItems.every((item) => checkedItems[item.id]);

    if (!allChecked) {
      Alert.alert(
        "PPE Check Incomplete",
        "Please confirm all required PPE items before starting this task.",
        [{ text: "OK" }]
      );
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Alert.alert(
      "Ready to Work",
      `All required PPE confirmed for "${taskName}". Stay safe!`,
      [{ text: "Start Task" }]
    );
  };

  const getTaskIcon = (taskType: string): keyof typeof Feather.glyphMap => {
    switch (taskType) {
      case "welding":
        return "zap";
      case "electrical":
        return "power";
      case "heights":
        return "arrow-up";
      case "demolition":
        return "tool";
      default:
        return "hard-drive";
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.md, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={[styles.headerIcon, { backgroundColor: `${Colors.warning}20` }]}>
              <Feather name="shield" size={28} color={Colors.warning} />
            </View>
            <View style={styles.headerText}>
              <ThemedText style={styles.headerTitle}>Smart PPE Reminders</ThemedText>
              <ThemedText style={styles.headerDescription}>
                AI-powered safety reminders based on your assigned tasks
              </ThemedText>
            </View>
          </View>
        </Card>

        <Card style={styles.settingsCard}>
          <ThemedText style={styles.sectionTitle}>Reminder Settings</ThemedText>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather name="bell" size={18} color={accentColors.primary} />
              <View style={styles.settingText}>
                <ThemedText style={styles.settingLabel}>Enable PPE Reminders</ThemedText>
                <ThemedText style={styles.settingDescription}>Get notified about required safety gear</ThemedText>
              </View>
            </View>
            <Switch
              value={settings.enableReminders}
              onValueChange={(v) => updateSetting("enableReminders", v)}
              trackColor={{ false: theme.border, true: accentColors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather name="clock" size={18} color={accentColors.primary} />
              <View style={styles.settingText}>
                <ThemedText style={styles.settingLabel}>Remind Before Task</ThemedText>
                <ThemedText style={styles.settingDescription}>15 minutes before each task starts</ThemedText>
              </View>
            </View>
            <Switch
              value={settings.reminderBeforeTask}
              onValueChange={(v) => updateSetting("reminderBeforeTask", v)}
              trackColor={{ false: theme.border, true: accentColors.primary }}
              thumbColor="#fff"
              disabled={!settings.enableReminders}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather name="sun" size={18} color={accentColors.primary} />
              <View style={styles.settingText}>
                <ThemedText style={styles.settingLabel}>Daily Safety Briefing</ThemedText>
                <ThemedText style={styles.settingDescription}>Morning summary of all required PPE</ThemedText>
              </View>
            </View>
            <Switch
              value={settings.dailyBriefing}
              onValueChange={(v) => updateSetting("dailyBriefing", v)}
              trackColor={{ false: theme.border, true: accentColors.primary }}
              thumbColor="#fff"
              disabled={!settings.enableReminders}
            />
          </View>
        </Card>

        <View style={styles.tasksSection}>
          <ThemedText style={styles.sectionTitle}>Today's Tasks - PPE Required</ThemedText>

          {mockUpcomingTasks.map((task) => {
            const completion = getCompletionPercentage(task.ppeItems);
            const isExpanded = expandedTask === task.taskName;

            return (
              <Card key={task.taskName} style={styles.taskCard}>
                <Pressable style={styles.taskHeader} onPress={() => toggleTaskExpand(task.taskName)}>
                  <View style={[styles.taskIcon, { backgroundColor: `${accentColors.primary}20` }]}>
                    <Feather name={getTaskIcon(task.taskType)} size={20} color={accentColors.primary} />
                  </View>
                  <View style={styles.taskInfo}>
                    <ThemedText style={styles.taskName}>{task.taskName}</ThemedText>
                    <View style={styles.progressRow}>
                      <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${completion}%`,
                              backgroundColor: completion === 100 ? Colors.success : accentColors.primary,
                            },
                          ]}
                        />
                      </View>
                      <ThemedText style={styles.progressText}>{completion}%</ThemedText>
                    </View>
                  </View>
                  <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                </Pressable>

                {isExpanded ? (
                  <View style={styles.taskExpanded}>
                    <View style={styles.hazardsSection}>
                      <ThemedText style={styles.hazardsTitle}>Hazards:</ThemedText>
                      <View style={styles.hazardsList}>
                        {task.hazards.map((hazard, index) => (
                          <View key={index} style={[styles.hazardTag, { backgroundColor: `${Colors.error}15` }]}>
                            <Feather name="alert-triangle" size={10} color={Colors.error} />
                            <Text style={[styles.hazardText, { color: Colors.error }]}>{hazard}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    <ThemedText style={styles.ppeListTitle}>Required PPE:</ThemedText>
                    {task.ppeItems.map((item) => (
                      <Pressable
                        key={item.id}
                        style={[
                          styles.ppeItem,
                          { backgroundColor: checkedItems[item.id] ? `${Colors.success}10` : theme.backgroundSecondary },
                        ]}
                        onPress={() => togglePPEItem(item.id)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            {
                              backgroundColor: checkedItems[item.id] ? Colors.success : "transparent",
                              borderColor: checkedItems[item.id] ? Colors.success : theme.border,
                            },
                          ]}
                        >
                          {checkedItems[item.id] ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
                        </View>
                        <View style={styles.ppeItemInfo}>
                          <View style={styles.ppeItemHeader}>
                            <ThemedText style={styles.ppeItemName}>{item.name}</ThemedText>
                            {item.required ? (
                              <View style={[styles.requiredBadge, { backgroundColor: `${Colors.error}15` }]}>
                                <Text style={[styles.requiredText, { color: Colors.error }]}>Required</Text>
                              </View>
                            ) : (
                              <View style={[styles.optionalBadge, { backgroundColor: `${theme.textSecondary}15` }]}>
                                <Text style={[styles.optionalText, { color: theme.textSecondary }]}>Optional</Text>
                              </View>
                            )}
                          </View>
                          <ThemedText style={styles.ppeItemDescription}>{item.description}</ThemedText>
                        </View>
                      </Pressable>
                    ))}

                    <Pressable
                      style={[
                        styles.confirmButton,
                        {
                          backgroundColor: completion === 100 ? Colors.success : `${Colors.success}50`,
                        },
                      ]}
                      onPress={() => handleConfirmReady(task.taskName, task.ppeItems)}
                    >
                      <Feather name="check-circle" size={18} color="#FFFFFF" />
                      <Text style={styles.confirmButtonText}>
                        {completion === 100 ? "Confirm Ready to Work" : "Complete PPE Checklist"}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
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
    gap: Spacing.md,
  },
  headerCard: {
    padding: Spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
  },
  headerDescription: {
    fontSize: FontSizes.sm,
    opacity: 0.7,
    marginTop: 2,
  },
  settingsCard: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: FontSizes.md,
    fontWeight: "500",
  },
  settingDescription: {
    fontSize: FontSizes.xs,
    opacity: 0.6,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  tasksSection: {
    marginTop: Spacing.sm,
  },
  taskCard: {
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  taskIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
    width: 36,
    textAlign: "right",
  },
  taskExpanded: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  hazardsSection: {
    marginBottom: Spacing.md,
  },
  hazardsTitle: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
    opacity: 0.6,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
  },
  hazardsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  hazardTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  hazardText: {
    fontSize: FontSizes.xs,
    fontWeight: "500",
  },
  ppeListTitle: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
    opacity: 0.6,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
  },
  ppeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  ppeItemInfo: {
    flex: 1,
  },
  ppeItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  ppeItemName: {
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  requiredBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: "600",
  },
  optionalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  optionalText: {
    fontSize: 10,
    fontWeight: "600",
  },
  ppeItemDescription: {
    fontSize: FontSizes.xs,
    opacity: 0.6,
    marginTop: 2,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
});
