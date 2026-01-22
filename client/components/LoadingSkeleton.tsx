import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function LoadingSkeleton({
  width = "100%",
  height = 20,
  borderRadius = BorderRadius.xs,
  style,
}: LoadingSkeletonProps) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.backgroundSecondary,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function TaskCardSkeleton() {
  const { theme } = useTheme();

  return (
    <View style={[styles.taskCard, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.taskCardContent}>
        <View style={styles.taskCardHeader}>
          <LoadingSkeleton width="60%" height={20} />
          <LoadingSkeleton width={60} height={20} />
        </View>
        <LoadingSkeleton width="100%" height={16} style={{ marginBottom: Spacing.xs }} />
        <LoadingSkeleton width="80%" height={16} />
        <View style={styles.taskCardFooter}>
          <LoadingSkeleton width={100} height={16} />
          <LoadingSkeleton width={80} height={16} />
        </View>
      </View>
    </View>
  );
}

export function DashboardSkeleton() {
  const { theme } = useTheme();

  return (
    <View style={styles.dashboardContainer}>
      <View style={[styles.clockCard, { backgroundColor: theme.backgroundDefault }]}>
        <LoadingSkeleton width={120} height={24} style={{ marginBottom: Spacing.md }} />
        <LoadingSkeleton width={200} height={48} borderRadius={BorderRadius.full} />
      </View>
      <LoadingSkeleton width="100%" height={80} style={{ marginBottom: Spacing.lg }} />
      <LoadingSkeleton width={120} height={20} style={{ marginBottom: Spacing.md }} />
      <TaskCardSkeleton />
      <TaskCardSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#E1E4E8",
  },
  taskCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  taskCardContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  taskCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  taskCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.lg,
  },
  dashboardContainer: {
    paddingHorizontal: Spacing.lg,
  },
  clockCard: {
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
});
