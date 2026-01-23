import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { api, StarPerformer } from "@/lib/api";
import { mockStarPerformer } from "@/lib/mockData";

export default function StarPerformerScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { isDemoMode } = useAuth();

  const {
    data: currentStar,
    isLoading: currentLoading,
    refetch: refetchCurrent,
  } = useQuery({
    queryKey: ["/api/star-performer/current"],
    queryFn: async () => {
      if (isDemoMode) {
        return mockStarPerformer;
      }
      const response = await api.starPerformer.current();
      return response.data || mockStarPerformer;
    },
  });

  const {
    data: history,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["/api/star-performer/history"],
    queryFn: async () => {
      if (isDemoMode) {
        return [];
      }
      const response = await api.starPerformer.history();
      return response.data || [];
    },
  });

  const handleRefresh = () => {
    refetchCurrent();
    refetchHistory();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
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
      <ThemedText type="h2" style={styles.pageTitle}>
        Star Performer
      </ThemedText>
      <ThemedText style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
        AI-selected top performers recognized for outstanding work
      </ThemedText>

      {currentLoading ? (
        <View style={styles.currentLoading}>
          <LoadingSkeleton width="100%" height={280} borderRadius={BorderRadius.lg} />
        </View>
      ) : currentStar ? (
        <LinearGradient
          colors={[Colors.xpGold, Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.starCard}
        >
          <View style={styles.starBadge}>
            <Feather name="star" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.starAvatar}>
            <Feather name="user" size={48} color={Colors.primary} />
          </View>
          <ThemedText style={styles.starName}>
            {currentStar.firstName} {currentStar.lastName}
          </ThemedText>
          <ThemedText style={styles.starTitle}>{currentStar.title}</ThemedText>
          <ThemedText style={styles.starPeriod}>{currentStar.period}</ThemedText>
          <View style={styles.starDivider} />
          <ThemedText style={styles.starReason}>{currentStar.reason}</ThemedText>
          {currentStar.nominatedBy ? (
            <ThemedText style={styles.nominatedBy}>
              Nominated by {currentStar.nominatedBy}
            </ThemedText>
          ) : null}
          <View style={styles.xpBonus}>
            <Feather name="zap" size={20} color="#FFFFFF" />
            <ThemedText style={styles.xpBonusText}>
              +{currentStar.xpBonus} XP Bonus
            </ThemedText>
          </View>
        </LinearGradient>
      ) : (
        <Card style={styles.emptyCard}>
          <Feather name="star" size={48} color={theme.textSecondary} />
          <ThemedText type="h4" style={styles.emptyTitle}>
            No Star Performer Yet
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            The AI will select a star performer based on performance data
          </ThemedText>
        </Card>
      )}

      {(history || []).length > 0 ? (
        <View style={styles.historySection}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Recognition History
          </ThemedText>
          {historyLoading ? (
            <>
              <LoadingSkeleton width="100%" height={100} style={{ marginBottom: Spacing.md }} />
              <LoadingSkeleton width="100%" height={100} style={{ marginBottom: Spacing.md }} />
            </>
          ) : (
            (history || []).map((star: StarPerformer, index: number) => (
              <Card key={index} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <View style={styles.historyAvatar}>
                    <Feather name="user" size={20} color={theme.textSecondary} />
                  </View>
                  <View style={styles.historyInfo}>
                    <ThemedText type="h4">
                      {star.firstName} {star.lastName}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {star.period}
                    </ThemedText>
                  </View>
                  <View style={styles.historyBadge}>
                    <Feather name="star" size={16} color={Colors.xpGold} />
                  </View>
                </View>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {star.reason}
                </ThemedText>
              </Card>
            ))
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageTitle: {
    marginBottom: Spacing.sm,
  },
  pageSubtitle: {
    marginBottom: Spacing.xl,
  },
  currentLoading: {
    marginBottom: Spacing.xl,
  },
  starCard: {
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  starBadge: {
    position: "absolute",
    top: Spacing.lg,
    right: Spacing.lg,
  },
  starAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  starName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  starTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  starPeriod: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  starDivider: {
    width: 60,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginBottom: Spacing.lg,
  },
  starReason: {
    color: "#FFFFFF",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  nominatedBy: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    marginBottom: Spacing.lg,
  },
  xpBonus: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  xpBonusText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    textAlign: "center",
    maxWidth: 250,
  },
  historySection: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  historyCard: {
    marginBottom: Spacing.md,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  historyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  historyInfo: {
    flex: 1,
  },
  historyBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.xpGold + "20",
    justifyContent: "center",
    alignItems: "center",
  },
});
