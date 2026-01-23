import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { RewardCard } from "@/components/RewardCard";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { api, Reward } from "@/lib/api";
import { mockRewards } from "@/lib/mockData";

export default function RewardsStoreScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { isDemoMode } = useAuth();

  const {
    data: rewards,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["/api/rewards"],
    queryFn: async () => {
      if (isDemoMode) {
        return mockRewards;
      }
      const response = await api.rewards.list();
      return response.data || mockRewards;
    },
  });

  const redeemMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      if (isDemoMode) {
        return { success: true, message: "Redeemed in demo mode" };
      }
      const response = await api.rewards.redeem(rewardId);
      return response.data || { success: true };
    },
    onSuccess: () => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setShowConfirmModal(false);
      setSelectedReward(null);
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      refreshUser();
    },
    onError: () => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleRewardPress = (reward: Reward) => {
    setSelectedReward(reward);
    setShowConfirmModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleConfirmRedeem = () => {
    if (selectedReward) {
      redeemMutation.mutate(selectedReward.id);
    }
  };

  const userPoints = user?.points || 0;

  const renderReward = ({ item, index }: { item: Reward; index: number }) => (
    <RewardCard
      reward={item}
      userPoints={userPoints}
      onPress={() => handleRewardPress(item)}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={[styles.pointsCard, { backgroundColor: Colors.primary }]}>
        <Feather name="star" size={24} color="#FFFFFF" />
        <View>
          <ThemedText style={styles.pointsLabel}>Your Points</ThemedText>
          <ThemedText style={styles.pointsValue}>
            {userPoints.toLocaleString()}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <View style={styles.rewardsRow}>
            <LoadingSkeleton width="48%" height={180} />
            <LoadingSkeleton width="48%" height={180} />
          </View>
          <View style={styles.rewardsRow}>
            <LoadingSkeleton width="48%" height={180} />
            <LoadingSkeleton width="48%" height={180} />
          </View>
        </View>
      );
    }
    return (
      <EmptyState
        image={require("../../assets/images/empty-rewards.png")}
        title="No Rewards Available"
        message="Check back later for new rewards to redeem"
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={rewards || []}
        renderItem={renderReward}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.rewardsRow}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
          (rewards || []).length === 0 && !isLoading && styles.emptyList,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
      />

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <Pressable
              style={styles.closeButton}
              onPress={() => setShowConfirmModal(false)}
            >
              <Feather name="x" size={24} color={theme.textSecondary} />
            </Pressable>

            {selectedReward ? (
              <>
                <View style={[styles.modalIcon, { backgroundColor: Colors.primary + "15" }]}>
                  <Feather name="gift" size={32} color={Colors.primary} />
                </View>
                <ThemedText type="h2" style={styles.modalTitle}>
                  {selectedReward.name}
                </ThemedText>
                <ThemedText style={[styles.modalDescription, { color: theme.textSecondary }]}>
                  {selectedReward.description}
                </ThemedText>

                <View style={styles.modalCost}>
                  <Feather name="star" size={20} color={Colors.xpGold} />
                  <ThemedText style={styles.modalCostText}>
                    {selectedReward.pointsCost.toLocaleString()} points
                  </ThemedText>
                </View>

                {userPoints < selectedReward.pointsCost ? (
                  <View style={[styles.insufficientBanner, { backgroundColor: Colors.error + "15" }]}>
                    <Feather name="alert-circle" size={20} color={Colors.error} />
                    <ThemedText style={{ color: Colors.error }}>
                      You need {(selectedReward.pointsCost - userPoints).toLocaleString()} more points
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText style={[styles.approvalNote, { color: theme.textSecondary }]}>
                    This redemption requires manager approval
                  </ThemedText>
                )}

                <Button
                  onPress={handleConfirmRedeem}
                  disabled={userPoints < selectedReward.pointsCost || redeemMutation.isPending}
                  style={styles.redeemButton}
                >
                  {redeemMutation.isPending ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    "Redeem Reward"
                  )}
                </Button>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  emptyList: {
    flexGrow: 1,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  pointsCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.xs,
    gap: Spacing.lg,
  },
  pointsLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  pointsValue: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  rewardsRow: {
    justifyContent: "space-between",
  },
  loadingContainer: {
    gap: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: Spacing.lg,
    right: Spacing.lg,
    zIndex: 1,
  },
  modalIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  modalDescription: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  modalCost: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  modalCostText: {
    color: Colors.xpGold,
    fontSize: 18,
    fontWeight: "700",
  },
  insufficientBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xl,
  },
  approvalNote: {
    fontSize: 13,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  redeemButton: {
    width: "100%",
  },
});
