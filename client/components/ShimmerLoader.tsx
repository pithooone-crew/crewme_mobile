import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ShimmerLoaderProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function ShimmerLoader({
  width = "100%",
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}: ShimmerLoaderProps) {
  const { isDark } = useTheme();
  const translateX = useSharedValue(-SCREEN_WIDTH);

  const baseColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const shimmerColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.8)";

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(SCREEN_WIDTH, {
        duration: 1500,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmer, animatedStyle]}>
        <LinearGradient
          colors={["transparent", shimmerColor, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

interface SkeletonCardProps {
  style?: ViewStyle;
}

export function SkeletonCard({ style }: SkeletonCardProps) {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        },
        style,
      ]}
    >
      <View style={styles.cardHeader}>
        <ShimmerLoader width={48} height={48} borderRadius={BorderRadius.full} />
        <View style={styles.cardHeaderText}>
          <ShimmerLoader width="70%" height={16} style={{ marginBottom: Spacing.xs }} />
          <ShimmerLoader width="50%" height={12} />
        </View>
      </View>
      <ShimmerLoader width="100%" height={14} style={{ marginTop: Spacing.md }} />
      <ShimmerLoader width="80%" height={14} style={{ marginTop: Spacing.sm }} />
      <View style={styles.cardFooter}>
        <ShimmerLoader width={80} height={28} borderRadius={BorderRadius.full} />
        <ShimmerLoader width={60} height={28} borderRadius={BorderRadius.full} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
  },
  gradient: {
    flex: 1,
    width: "100%",
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.lg,
  },
});
