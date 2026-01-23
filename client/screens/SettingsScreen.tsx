import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, Switch, Alert, Platform } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/constants/theme";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const SETTINGS_STORAGE_KEY = "@crewme_settings";

type SettingsTab = "appearance" | "notifications" | "usage" | "data";

interface Settings {
  pushNotifications: boolean;
  taskReminders: boolean;
  scheduleAlerts: boolean;
  achievementAlerts: boolean;
  weatherAlerts: boolean;
  messageAlerts: boolean;
  readReceipts: boolean;
  hapticFeedback: boolean;
  soundEffects: boolean;
  locationServices: boolean;
  autoClockReminder: boolean;
}

const defaultSettings: Settings = {
  pushNotifications: true,
  taskReminders: true,
  scheduleAlerts: true,
  achievementAlerts: true,
  weatherAlerts: true,
  messageAlerts: true,
  readReceipts: true,
  hapticFeedback: true,
  soundEffects: true,
  locationServices: true,
  autoClockReminder: true,
};

export default function SettingsScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { user, logout } = useAuth();
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = useCallback(async (key: keyof Settings, value: boolean) => {
    if (settings.hapticFeedback && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }, [settings]);

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: async () => {
            if (settings.hapticFeedback && Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            await logout();
          }
        }
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      "Reset Settings",
      "This will reset all settings to their defaults. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
          style: "destructive",
          onPress: async () => {
            setSettings(defaultSettings);
            await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaultSettings));
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        }
      ]
    );
  };

  const openPrivacyPolicy = async () => {
    try {
      await Linking.openURL("https://crewme.app/privacy");
    } catch {
      Alert.alert("Error", "Could not open privacy policy");
    }
  };

  const openTermsOfService = async () => {
    try {
      await Linking.openURL("https://crewme.app/terms");
    } catch {
      Alert.alert("Error", "Could not open terms of service");
    }
  };

  const handleThemeSelect = (mode: "light" | "dark" | "system") => {
    if (settings.hapticFeedback && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setThemeMode(mode);
  };

  const tabs: { id: SettingsTab; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { id: "appearance", label: "Appearance", icon: "eye" },
    { id: "notifications", label: "Alerts", icon: "bell" },
    { id: "usage", label: "Usage", icon: "bar-chart-2" },
    { id: "data", label: "Data", icon: "database" },
  ];

  const SettingRow = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onToggle,
    showArrow = false,
    onPress,
    disabled = false,
  }: { 
    icon: keyof typeof Feather.glyphMap; 
    title: string; 
    subtitle?: string;
    value?: boolean; 
    onToggle?: (value: boolean) => void;
    showArrow?: boolean;
    onPress?: () => void;
    disabled?: boolean;
  }) => (
    <Pressable 
      style={[styles.settingRow, disabled ? styles.settingRowDisabled : null]} 
      onPress={onPress} 
      disabled={disabled || (!onPress && !onToggle)}
      testID={`setting-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <View style={[styles.settingIcon, { backgroundColor: `${Colors.primary}15` }]}>
        <Feather name={icon} size={20} color={disabled ? theme.textSecondary : Colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <ThemedText style={[styles.settingTitle, disabled ? styles.settingTitleDisabled : null]}>{title}</ThemedText>
        {subtitle ? <ThemedText style={styles.settingSubtitle}>{subtitle}</ThemedText> : null}
      </View>
      {onToggle ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: theme.border, true: Colors.primary }}
          thumbColor="#fff"
          disabled={disabled}
        />
      ) : null}
      {showArrow ? <Feather name="chevron-right" size={20} color={theme.textSecondary} /> : null}
    </Pressable>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</ThemedText>
  );

  const ThemeOption = ({ mode, label, icon }: { mode: "light" | "dark" | "system"; label: string; icon: keyof typeof Feather.glyphMap }) => (
    <Pressable
      style={[
        styles.themeOption,
        { backgroundColor: theme.backgroundSecondary, borderColor: themeMode === mode ? Colors.primary : theme.border },
        themeMode === mode ? styles.themeOptionSelected : null,
      ]}
      onPress={() => handleThemeSelect(mode)}
    >
      <Feather name={icon} size={24} color={themeMode === mode ? Colors.primary : theme.textSecondary} />
      <ThemedText style={[styles.themeLabel, themeMode === mode ? { color: Colors.primary } : null]}>{label}</ThemedText>
      {themeMode === mode ? (
        <Feather name="check-circle" size={18} color={Colors.primary} style={styles.themeCheck} />
      ) : null}
    </Pressable>
  );

  const renderAppearanceTab = () => (
    <>
      <Card style={styles.section}>
        <SectionHeader title="Theme" />
        <View style={styles.themeOptions}>
          <ThemeOption mode="light" label="Light" icon="sun" />
          <ThemeOption mode="dark" label="Dark" icon="moon" />
          <ThemeOption mode="system" label="System" icon="smartphone" />
        </View>
      </Card>

      <Card style={styles.section}>
        <SectionHeader title="App Experience" />
        <SettingRow
          icon="smartphone"
          title="Haptic Feedback"
          subtitle="Vibration feedback on actions"
          value={settings.hapticFeedback}
          onToggle={(v) => updateSetting("hapticFeedback", v)}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingRow
          icon="volume-2"
          title="Sound Effects"
          subtitle="Play sounds for notifications"
          value={settings.soundEffects}
          onToggle={(v) => updateSetting("soundEffects", v)}
        />
      </Card>
    </>
  );

  const renderNotificationsTab = () => (
    <>
      <Card style={styles.section}>
        <SectionHeader title="Notifications" />
        <SettingRow
          icon="bell"
          title="Push Notifications"
          subtitle="Enable all notifications"
          value={settings.pushNotifications}
          onToggle={(v) => updateSetting("pushNotifications", v)}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingRow
          icon="mail"
          title="Message Alerts"
          subtitle="New messages from your crew"
          value={settings.messageAlerts}
          onToggle={(v) => updateSetting("messageAlerts", v)}
          disabled={!settings.pushNotifications}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingRow
          icon="clipboard"
          title="Task Reminders"
          subtitle="Get reminders for upcoming tasks"
          value={settings.taskReminders}
          onToggle={(v) => updateSetting("taskReminders", v)}
          disabled={!settings.pushNotifications}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingRow
          icon="calendar"
          title="Schedule Alerts"
          subtitle="Notify about schedule changes"
          value={settings.scheduleAlerts}
          onToggle={(v) => updateSetting("scheduleAlerts", v)}
          disabled={!settings.pushNotifications}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingRow
          icon="award"
          title="Achievement Alerts"
          subtitle="Celebrate your accomplishments"
          value={settings.achievementAlerts}
          onToggle={(v) => updateSetting("achievementAlerts", v)}
          disabled={!settings.pushNotifications}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingRow
          icon="cloud"
          title="Weather Alerts"
          subtitle="Get weather-related notifications"
          value={settings.weatherAlerts}
          onToggle={(v) => updateSetting("weatherAlerts", v)}
          disabled={!settings.pushNotifications}
        />
      </Card>

      <Card style={styles.section}>
        <SectionHeader title="Messages" />
        <SettingRow
          icon="check-circle"
          title="Send Read Receipts"
          subtitle="Let senders know when you read messages"
          value={settings.readReceipts}
          onToggle={(v) => updateSetting("readReceipts", v)}
        />
      </Card>
    </>
  );

  const renderUsageTab = () => (
    <>
      <Card style={styles.section}>
        <SectionHeader title="Time Clock" />
        <SettingRow
          icon="map-pin"
          title="Location Services"
          subtitle="Enable GPS for clock in/out verification"
          value={settings.locationServices}
          onToggle={(v) => updateSetting("locationServices", v)}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingRow
          icon="clock"
          title="Auto Clock Reminder"
          subtitle="Remind me to clock in when arriving at site"
          value={settings.autoClockReminder}
          onToggle={(v) => updateSetting("autoClockReminder", v)}
          disabled={!settings.locationServices}
        />
      </Card>

      <Card style={styles.section}>
        <SectionHeader title="Subscription" />
        <View style={styles.subscriptionInfo}>
          <View style={[styles.planBadge, { backgroundColor: `${Colors.primary}20` }]}>
            <ThemedText style={[styles.planText, { color: Colors.primary }]}>Pro Plan</ThemedText>
          </View>
          <ThemedText style={[styles.subscriptionDetail, { color: theme.textSecondary }]}>
            Full access to all features
          </ThemedText>
        </View>
      </Card>
    </>
  );

  const renderDataTab = () => (
    <>
      <Card style={styles.section}>
        <SectionHeader title="Data & Storage" />
        <SettingRow
          icon="refresh-cw"
          title="Reset Settings"
          subtitle="Restore all settings to defaults"
          showArrow
          onPress={handleResetSettings}
        />
      </Card>

      <Card style={styles.section}>
        <SectionHeader title="Legal" />
        <SettingRow
          icon="file-text"
          title="Privacy Policy"
          showArrow
          onPress={openPrivacyPolicy}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingRow
          icon="book"
          title="Terms of Service"
          showArrow
          onPress={openTermsOfService}
        />
      </Card>
    </>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.tabBar, { paddingTop: headerHeight + Spacing.sm, backgroundColor: theme.backgroundRoot, borderBottomColor: theme.border }]}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.tab, activeTab === tab.id ? styles.tabActive : null]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Feather
              name={tab.icon}
              size={18}
              color={activeTab === tab.id ? Colors.primary : theme.textSecondary}
            />
            <ThemedText
              style={[
                styles.tabLabel,
                { color: activeTab === tab.id ? Colors.primary : theme.textSecondary },
              ]}
            >
              {tab.label}
            </ThemedText>
            {activeTab === tab.id ? (
              <View style={[styles.tabIndicator, { backgroundColor: Colors.primary }]} />
            ) : null}
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent, 
          { 
            paddingBottom: tabBarHeight + Spacing.xl 
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "appearance" ? renderAppearanceTab() : null}
        {activeTab === "notifications" ? renderNotificationsTab() : null}
        {activeTab === "usage" ? renderUsageTab() : null}
        {activeTab === "data" ? renderDataTab() : null}

        <Pressable 
          style={[styles.logoutButton, { backgroundColor: isDark ? "#3D1A1A" : "#FFEBEE" }]} 
          onPress={handleLogout}
          testID="button-logout"
        >
          <Feather name="log-out" size={20} color="#C62828" />
          <ThemedText style={styles.logoutText}>Sign Out</ThemedText>
        </Pressable>

        <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
          Signed in as {user?.email || "demo@crewme.app"}
        </ThemedText>
        <ThemedText style={[styles.versionText, { color: theme.textSecondary }]}>CrewMe v1.0.0</ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    position: "relative",
  },
  tabActive: {},
  tabLabel: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
    marginTop: 4,
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: Spacing.md,
    right: Spacing.md,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: FontSizes.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  themeOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  themeOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
  },
  themeOptionSelected: {
    borderWidth: 2,
  },
  themeLabel: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    marginTop: Spacing.sm,
  },
  themeCheck: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontWeight: "600",
    fontSize: FontSizes.md,
  },
  settingTitleDisabled: {
    color: Colors.textSecondary,
  },
  settingSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xs,
    marginLeft: 52,
  },
  subscriptionInfo: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  planBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  planText: {
    fontWeight: "700",
    fontSize: FontSizes.md,
  },
  subscriptionDetail: {
    fontSize: FontSizes.sm,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  logoutText: {
    fontWeight: "600",
    fontSize: FontSizes.md,
    color: "#C62828",
  },
  footerText: {
    fontSize: FontSizes.sm,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  versionText: {
    fontSize: FontSizes.xs,
    textAlign: "center",
    marginTop: Spacing.xs,
    opacity: 0.6,
  },
});
