import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { LeaderboardRow } from "@/components/LeaderboardRow";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { api, LeaderboardEntry } from "@/lib/api";
import { mockLeaderboard } from "@/lib/mockData";

const periodOptions = [
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "all" },
];

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");

  const { isDemoMode } = useAuth();

  const {
    data: leaderboard,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["/api/gamification/leaderboard", period],
    queryFn: async () => {
      if (isDemoMode) {
        return mockLeaderboard;
      }
      const response = await api.gamification.leaderboard(period);
      return response.data || mockLeaderboard;
    },
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const topThree = (leaderboard || []).slice(0, 3);
  const rest = (leaderboard || []).slice(3);

  const renderPodium = () => {
    if (isLoading || topThree.length === 0) {
      return (
        <View style={styles.podiumContainer}>
          <LoadingSkeleton width={90} height={140} borderRadius={BorderRadius.xs} />
          <LoadingSkeleton width={100} height={160} borderRadius={BorderRadius.xs} />
          <LoadingSkeleton width={90} height={120} borderRadius={BorderRadius.xs} />
        </View>
      );
    }

    const [first, second, third] = topThree;
    const podiumOrder = [second, first, third].filter(Boolean);

    return (
      <View style={styles.podiumContainer}>
        {podiumOrder.map((entry, index) => {
          const isFirst = entry?.rank === 1;
          const height = isFirst ? 160 : entry?.rank === 2 ? 140 : 120;
          const medalColor =
            entry?.rank === 1 ? Colors.xpGold : entry?.rank === 2 ? "#C0C0C0" : "#CD7F32";

          return (
            <View
              key={entry?.userId || index}
              style={[
                styles.podiumItem,
                { height, backgroundColor: theme.backgroundDefault },
              ]}
            >
              <View style={[styles.medalBadge, { backgroundColor: medalColor }]}>
                <ThemedText style={styles.medalText}>{entry?.rank}</ThemedText>
              </View>
              <View style={styles.podiumAvatar}>
                <Feather name="user" size={isFirst ? 28 : 24} color={theme.textSecondary} />
              </View>
              <ThemedText
                type={isFirst ? "h4" : "small"}
                numberOfLines={1}
                style={styles.podiumName}
              >
                {entry?.firstName} {entry?.lastName?.charAt(0)}.
              </ThemedText>
              <View style={styles.podiumXp}>
                <Feather name="zap" size={12} color={Colors.xpGold} />
                <ThemedText style={styles.podiumXpText}>
                  {entry?.xp?.toLocaleString()}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderItem = ({ item }: { item: LeaderboardEntry }) => (
    <LeaderboardRow entry={item} isCurrentUser={item.userId === user?.id} />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.periodSelector}>
        {periodOptions.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setPeriod(option.value as "week" | "month" | "all")}
            style={[
              styles.periodButton,
              {
                backgroundColor:
                  period === option.value ? Colors.primary : theme.backgroundDefault,
              },
            ]}
          >
            <ThemedText
              style={{
                color: period === option.value ? "#FFFFFF" : theme.text,
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
      {renderPodium()}
      {rest.length > 0 ? (
        <ThemedText type="h4" style={styles.restTitle}>
          Rankings
        </ThemedText>
      ) : null}
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingSkeleton width="100%" height={70} style={{ marginBottom: Spacing.sm }} />
          <LoadingSkeleton width="100%" height={70} style={{ marginBottom: Spacing.sm }} />
          <LoadingSkeleton width="100%" height={70} />
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={rest}
        renderItem={renderItem}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  periodSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: "center",
  },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  podiumItem: {
    width: 100,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  medalBadge: {
    position: "absolute",
    top: -12,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  medalText: {
    color: "#1A1D1F",
    fontWeight: "700",
    fontSize: 14,
  },
  podiumAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.secondary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  podiumName: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  podiumXp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  podiumXpText: {
    color: Colors.xpGold,
    fontSize: 12,
    fontWeight: "600",
  },
  restTitle: {
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    paddingTop: Spacing.lg,
  },
});
