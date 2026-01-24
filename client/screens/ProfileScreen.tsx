import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Modal,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { XPProgressBar } from "@/components/XPProgressBar";
import { Button } from "@/components/Button";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { api, Certification } from "@/lib/api";
import { mockProfile, mockCertifications } from "@/lib/mockData";
import { apiRequest } from "@/lib/query-client";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user, logout, isDemoMode } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isOpenToWork, setIsOpenToWork] = useState(false);

  const {
    data: profile,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      if (isDemoMode) {
        return mockProfile;
      }
      const response = await api.profile.get();
      return response.data || mockProfile;
    },
  });

  const { data: certifications, refetch: refetchCerts } = useQuery({
    queryKey: ["/api/profile/certifications"],
    queryFn: async () => {
      if (isDemoMode) {
        return mockCertifications;
      }
      const response = await api.profile.certifications();
      return response.data || mockCertifications;
    },
  });

  const handleRefresh = useCallback(() => {
    refetchProfile();
    refetchCerts();
  }, [refetchProfile, refetchCerts]);

  const openToWorkMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, isOpenToWork: enabled };
      }
      const response = await apiRequest("POST", "/api/mobile/open-to-work", {
        availableDate: new Date().toISOString(),
        skills: profile?.skills || [],
        maxHours: 8,
        preferredProjects: [],
        notes: enabled ? "Available for AI task allocation" : "Not available",
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsOpenToWork(data.success);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
  });

  const handleOpenToWorkToggle = (value: boolean) => {
    openToWorkMutation.mutate(value);
  };

  const handleRewardsPress = () => {
    navigation.navigate("RewardsStore");
  };

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await logout();
  };

  const roleLabels: Record<string, string> = {
    crew_member: "Crew Member",
    lead: "Team Lead",
    foreman: "Foreman",
    project_manager: "Project Manager",
    admin: "Administrator",
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
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

        <Card style={styles.openToWorkCard}>
          <View style={styles.openToWorkHeader}>
            <View style={[styles.openToWorkIcon, { backgroundColor: isOpenToWork ? Colors.success + "20" : theme.backgroundRoot }]}>
              <Feather name="briefcase" size={24} color={isOpenToWork ? Colors.success : theme.textSecondary} />
            </View>
            <View style={styles.openToWorkInfo}>
              <ThemedText type="h4">Open to Work</ThemedText>
              <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>
                {isOpenToWork ? "AI can assign you to new tasks" : "Not visible for AI task allocation"}
              </ThemedText>
            </View>
            <Pressable 
              style={styles.openToWorkToggle}
              onPress={() => handleOpenToWorkToggle(!isOpenToWork)}
              testID="button-open-to-work-toggle"
              disabled={openToWorkMutation.isPending}
            >
              {openToWorkMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <View style={[
                  styles.toggleTrack,
                  { backgroundColor: isOpenToWork ? Colors.success + "50" : theme.backgroundRoot }
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    { 
                      backgroundColor: isOpenToWork ? Colors.success : theme.textSecondary,
                      transform: [{ translateX: isOpenToWork ? 20 : 0 }]
                    }
                  ]} />
                </View>
              )}
            </Pressable>
          </View>
          {isOpenToWork ? (
            <View style={[styles.openToWorkStatus, { backgroundColor: Colors.success + "15" }]}>
              <Feather name="check-circle" size={16} color={Colors.success} />
              <ThemedText style={{ color: Colors.success, fontSize: 13, flex: 1, marginLeft: Spacing.sm }}>
                Visible to AI scheduler. You'll receive task assignments based on your skills.
              </ThemedText>
            </View>
          ) : null}
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
            onPress={() => navigation.navigate("Settings")}
            testID="button-settings"
          >
            <Feather name="settings" size={20} color={theme.text} />
            <ThemedText style={styles.menuText}>Settings</ThemedText>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>

          <Pressable
            style={[styles.menuItem, { backgroundColor: Colors.error + "10" }]}
            onPress={handleLogoutPress}
            testID="button-logout"
          >
            <Feather name="log-out" size={20} color={Colors.error} />
            <ThemedText style={[styles.menuText, { color: Colors.error }]}>
              Log Out
            </ThemedText>
            <View style={{ width: 20 }} />
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowLogoutModal(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Feather name="log-out" size={40} color={Colors.error} style={{ marginBottom: Spacing.lg }} />
            <ThemedText type="h3" style={styles.modalTitle}>
              Log Out
            </ThemedText>
            <ThemedText style={[styles.modalMessage, { color: theme.textSecondary }]}>
              Are you sure you want to log out of CrewMe?
            </ThemedText>
            <View style={styles.modalButtons}>
              <Button
                variant="secondary"
                onPress={() => setShowLogoutModal(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleLogoutConfirm}
                style={[styles.modalButton, { backgroundColor: Colors.error }]}
              >
                Log Out
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: BorderRadius.lg,
    padding: Spacing["2xl"],
    alignItems: "center",
  },
  modalTitle: {
    marginBottom: Spacing.sm,
  },
  modalMessage: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  modalButton: {
    flex: 1,
  },
  openToWorkCard: {
    marginBottom: Spacing.lg,
  },
  openToWorkHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  openToWorkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  openToWorkInfo: {
    flex: 1,
  },
  openToWorkToggle: {
    marginLeft: Spacing.sm,
  },
  openToWorkStatus: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  toggleTrack: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});
