import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

interface XPProgressBarProps {
  currentXP: number;
  nextLevelXP: number;
  level: number;
  showLabel?: boolean;
}

export function XPProgressBar({
  currentXP,
  nextLevelXP,
  level,
  showLabel = true,
}: XPProgressBarProps) {
  const { theme } = useTheme();
  const progress = Math.min((currentXP / nextLevelXP) * 100, 100);

  return (
    <View style={styles.container}>
      {showLabel ? (
        <View style={styles.labelRow}>
          <View style={styles.levelBadge}>
            <ThemedText style={styles.levelText}>LVL {level}</ThemedText>
          </View>
          <ThemedText style={[styles.xpText, { color: theme.textSecondary }]}>
            {currentXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
          </ThemedText>
        </View>
      ) : null}
      <View style={[styles.track, { backgroundColor: theme.backgroundSecondary }]}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${progress}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  levelBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  levelText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  xpText: {
    fontSize: 14,
    fontWeight: "500",
  },
  track: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: BorderRadius.full,
  },
});
