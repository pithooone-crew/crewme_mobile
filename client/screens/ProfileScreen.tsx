import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { XPProgressBar } from "@/components/XPProgressBar";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { api, UserProfile, Certification } from "@/lib/api";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user, logout } = useAuth();

  const {
    data: profile,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const response = await api.profile.get();
      return response.data;
    },
  });

  const { data: certifications, refetch: refetchCerts } = useQuery({
    queryKey: ["/api/profile/certifications"],
    queryFn: async () => {
      const response = await api.profile.certifications();
      return response.data || [];
    },
  });

  const handleRefresh = useCallback(() => {
    refetchProfile();
    refetchCerts();
  }, [refetchProfile, refetchCerts]);

  const handleRewardsPress = () => {
    navigation.navigate("RewardsStore");
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
        },
      },
    ]);
  };

  const roleLabels: Record<string, string> = {
    crew_member: "Crew Member",
    lead: "Team Lead",
    foreman: "Foreman",
    project_manager: "Project Manager",
    admin: "Administrator",
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
          refreshing={false}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: Colors.primary + "20" }]}>
          <Feather name="user" size={40} color={Colors.primary} />
        </View>
        {profileLoading ? (
          <View style={styles.profileInfo}>
            <LoadingSkeleton width={150} height={24} />
            <LoadingSkeleton width={100} height={16} style={{ marginTop: Spacing.sm }} />
          </View>
        ) : (
          <View style={styles.profileInfo}>
            <ThemedText type="h2">
              {profile?.firstName || user?.firstName}{" "}
              {profile?.lastName || user?.lastName}
            </ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              {roleLabels[profile?.role || user?.role || "crew_member"]}
            </ThemedText>
          </View>
        )}
      </View>

      <Card style={styles.pointsCard} onPress={handleRewardsPress}>
        <View style={styles.pointsContent}>
          <View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Reward Points
            </ThemedText>
            <ThemedText type="h1" style={{ color: Colors.primary }}>
              {user?.points?.toLocaleString() || 0}
            </ThemedText>
          </View>
          <View style={styles.rewardsButton}>
            <Feather name="gift" size={20} color={Colors.primary} />
            <ThemedText style={{ color: Colors.primary, fontWeight: "600" }}>
              Rewards Store
            </ThemedText>
            <Feather name="chevron-right" size={20} color={Colors.primary} />
          </View>
        </View>
      </Card>

      <Card style={styles.xpCard}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Experience
        </ThemedText>
        <XPProgressBar
          currentXP={user?.xp || 0}
          nextLevelXP={1000}
          level={user?.level || 1}
        />
      </Card>

      {(profile?.skills || []).length > 0 ? (
        <Card style={styles.skillsCard}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Skills
          </ThemedText>
          <View style={styles.skillsContainer}>
            {(profile?.skills || []).map((skill, index) => (
              <View
                key={index}
                style={[styles.skillBadge, { backgroundColor: Colors.secondary + "15" }]}
              >
                <ThemedText style={{ color: Colors.secondary, fontSize: 13 }}>
                  {skill}
                </ThemedText>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {(certifications || []).length > 0 ? (
        <Card style={styles.certsCard}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Certifications
          </ThemedText>
          {(certifications || []).map((cert: Certification) => (
            <View key={cert.id} style={styles.certItem}>
              <View style={styles.certIcon}>
                <Feather
                  name="award"
                  size={20}
                  color={cert.status === "active" ? Colors.success : Colors.warning}
                />
              </View>
              <View style={styles.certInfo}>
                <ThemedText type="h4">{cert.name}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {cert.issuedBy}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.certStatus,
                  {
                    backgroundColor:
                      cert.status === "active" ? Colors.success + "20" : Colors.warning + "20",
                  },
                ]}
              >
                <ThemedText
                  style={{
                    fontSize: 11,
                    color: cert.status === "active" ? Colors.success : Colors.warning,
                    fontWeight: "600",
                  }}
                >
                  {cert.status.toUpperCase()}
                </ThemedText>
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      <View style={styles.menuSection}>
        <Pressable
          style={[styles.menuItem, { backgroundColor: theme.backgroundDefault }]}
          onPress={() => {}}
        >
          <Feather name="edit-3" size={20} color={theme.text} />
          <ThemedText style={styles.menuText}>Edit Profile</ThemedText>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          style={[styles.menuItem, { backgroundColor: theme.backgroundDefault }]}
          onPress={() => {}}
        >
          <Feather name="bar-chart-2" size={20} color={theme.text} />
          <ThemedText style={styles.menuText}>Performance History</ThemedText>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          style={[styles.menuItem, { backgroundColor: theme.backgroundDefault }]}
          onPress={() => {}}
        >
          <Feather name="settings" size={20} color={theme.text} />
          <ThemedText style={styles.menuText}>Settings</ThemedText>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          style={[styles.menuItem, { backgroundColor: Colors.error + "10" }]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={20} color={Colors.error} />
          <ThemedText style={[styles.menuText, { color: Colors.error }]}>
            Log Out
          </ThemedText>
          <View style={{ width: 20 }} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },
  pointsCard: {
    marginBottom: Spacing.lg,
  },
  pointsContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rewardsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  xpCard: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  skillsCard: {
    marginBottom: Spacing.lg,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  skillBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  certsCard: {
    marginBottom: Spacing.lg,
  },
  certItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  certIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  certInfo: {
    flex: 1,
  },
  certStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  menuSection: {
    gap: Spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    gap: Spacing.md,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
  },
});
