import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { Colors, Spacing, BorderRadius, FontSizes, Fonts } from "@/constants/theme";
import { Card, CardContent } from "@/components/Card";

export default function SettingsScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [scheduleAlerts, setScheduleAlerts] = useState(true);
  const [achievementAlerts, setAchievementAlerts] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState(true);

  const SettingRow = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onToggle,
    showArrow = false,
    onPress 
  }: { 
    icon: keyof typeof Feather.glyphMap; 
    title: string; 
    subtitle?: string;
    value?: boolean; 
    onToggle?: (value: boolean) => void;
    showArrow?: boolean;
    onPress?: () => void;
  }) => (
    <Pressable style={styles.settingRow} onPress={onPress} disabled={!onPress && !onToggle}>
      <View style={styles.settingIcon}>
        <Feather name={icon} size={20} color={Colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
      </View>
      {onToggle ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: Colors.border, true: Colors.primary }}
          thumbColor="#fff"
        />
      ) : null}
      {showArrow ? <Feather name="chevron-right" size={20} color={Colors.textSecondary} /> : null}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + Spacing.md, paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.section}>
          <CardContent>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <SettingRow
              icon="moon"
              title="Dark Mode"
              subtitle="Use dark theme"
              value={darkMode}
              onToggle={setDarkMode}
            />
          </CardContent>
        </Card>

        <Card style={styles.section}>
          <CardContent>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <SettingRow
              icon="bell"
              title="Push Notifications"
              subtitle="Enable all notifications"
              value={pushNotifications}
              onToggle={setPushNotifications}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="clipboard"
              title="Task Reminders"
              subtitle="Get reminders for upcoming tasks"
              value={taskReminders}
              onToggle={setTaskReminders}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="calendar"
              title="Schedule Alerts"
              subtitle="Notify about schedule changes"
              value={scheduleAlerts}
              onToggle={setScheduleAlerts}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="award"
              title="Achievement Alerts"
              subtitle="Celebrate your accomplishments"
              value={achievementAlerts}
              onToggle={setAchievementAlerts}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="cloud"
              title="Weather Alerts"
              subtitle="Get weather-related notifications"
              value={weatherAlerts}
              onToggle={setWeatherAlerts}
            />
          </CardContent>
        </Card>

        <Card style={styles.section}>
          <CardContent>
            <Text style={styles.sectionTitle}>Account</Text>
            <SettingRow
              icon="user"
              title="Edit Profile"
              subtitle="Update your personal information"
              showArrow
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="shield"
              title="Privacy & Security"
              subtitle="Manage your privacy settings"
              showArrow
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="file-text"
              title="Certifications"
              subtitle="Manage your certifications"
              showArrow
              onPress={() => {}}
            />
          </CardContent>
        </Card>

        <Card style={styles.section}>
          <CardContent>
            <Text style={styles.sectionTitle}>Support</Text>
            <SettingRow
              icon="help-circle"
              title="Help Center"
              showArrow
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="message-circle"
              title="Contact Support"
              showArrow
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="info"
              title="About CrewMe"
              subtitle="Version 1.0.0"
              showArrow
              onPress={() => {}}
            />
          </CardContent>
        </Card>

        <Pressable style={styles.logoutButton} onPress={logout}>
          <Feather name="log-out" size={20} color="#C62828" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>

        <Text style={styles.footerText}>Signed in as {user?.email || "demo@crewme.app"}</Text>
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
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  settingSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
    marginLeft: 52,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: "#FFEBEE",
    borderRadius: BorderRadius.md,
  },
  logoutText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
    color: "#C62828",
  },
  footerText: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.md,
  },
});
