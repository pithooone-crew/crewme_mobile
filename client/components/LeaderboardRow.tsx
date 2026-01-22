import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { LeaderboardEntry } from "@/lib/api";

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
}

export function LeaderboardRow({ entry, isCurrentUser = false }: LeaderboardRowProps) {
  const { theme } = useTheme();

  const getRankDisplay = () => {
    switch (entry.rank) {
      case 1:
        return { icon: "award", color: Colors.xpGold };
      case 2:
        return { icon: "award", color: "#C0C0C0" };
      case 3:
        return { icon: "award", color: "#CD7F32" };
      default:
        return null;
    }
  };

  const rankDisplay = getRankDisplay();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isCurrentUser ? Colors.primary + "15" : theme.backgroundDefault,
          borderColor: isCurrentUser ? Colors.primary : "transparent",
        },
      ]}
      testID={`leaderboard-row-${entry.userId}`}
    >
      <View style={styles.rankContainer}>
        {rankDisplay ? (
          <Feather name={rankDisplay.icon as any} size={24} color={rankDisplay.color} />
        ) : (
          <ThemedText style={[styles.rankText, { color: theme.textSecondary }]}>
            #{entry.rank}
          </ThemedText>
        )}
      </View>
      <View style={styles.avatar}>
        <Feather name="user" size={20} color={theme.textSecondary} />
      </View>
      <View style={styles.info}>
        <ThemedText type="h4" numberOfLines={1}>
          {entry.firstName} {entry.lastName}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Level {entry.level} • {entry.tasksCompleted} tasks
        </ThemedText>
      </View>
      <View style={styles.xpContainer}>
        <ThemedText style={styles.xpText}>{entry.xp.toLocaleString()}</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          XP
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  rankContainer: {
    width: 40,
    alignItems: "center",
  },
  rankText: {
    fontSize: 16,
    fontWeight: "700",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.secondary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  xpContainer: {
    alignItems: "flex-end",
  },
  xpText: {
    color: Colors.xpGold,
    fontSize: 16,
    fontWeight: "700",
  },
});
