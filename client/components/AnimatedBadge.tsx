import React, { useEffect } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Colors, BorderRadius } from "@/constants/theme";

interface AnimatedBadgeProps {
  count: number;
  maxCount?: number;
  color?: string;
  size?: "small" | "medium" | "large";
  pulse?: boolean;
  style?: ViewStyle;
}

const sizeConfig = {
  small: { minWidth: 16, height: 16, fontSize: 10, padding: 2 },
  medium: { minWidth: 20, height: 20, fontSize: 12, padding: 4 },
  large: { minWidth: 24, height: 24, fontSize: 14, padding: 6 },
};

export function AnimatedBadge({
  count,
  maxCount = 99,
  color = Colors.error,
  size = "medium",
  pulse = false,
  style,
}: AnimatedBadgeProps) {
  const scale = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const sizeStyles = sizeConfig[size];
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  useEffect(() => {
    if (count > 0) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 300 }),
        withSpring(1, { damping: 15, stiffness: 400 })
      );
    } else {
      scale.value = withSpring(0, { damping: 15, stiffness: 400 });
    }
  }, [count]);

  useEffect(() => {
    if (pulse && count > 0) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
    }
  }, [pulse, count]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulseScale.value }],
    opacity: scale.value,
  }));

  if (count <= 0) return null;

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          minWidth: sizeStyles.minWidth,
          height: sizeStyles.height,
          paddingHorizontal: sizeStyles.padding,
          backgroundColor: color,
        },
        animatedStyle,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: sizeStyles.fontSize,
          },
        ]}
      >
        {displayCount}
      </Text>
    </Animated.View>
  );
}

interface NotificationDotProps {
  visible: boolean;
  color?: string;
  size?: number;
  pulse?: boolean;
  style?: ViewStyle;
}

export function NotificationDot({
  visible,
  color = Colors.error,
  size = 8,
  pulse = true,
  style,
}: NotificationDotProps) {
  const scale = useSharedValue(0);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 10, stiffness: 300 }),
        withSpring(1, { damping: 15, stiffness: 400 })
      );
      if (pulse) {
        pulseOpacity.value = withRepeat(
          withSequence(
            withTiming(0.4, { duration: 1000 }),
            withTiming(0, { duration: 1000 })
          ),
          -1,
          false
        );
      }
    } else {
      scale.value = withSpring(0, { damping: 15, stiffness: 400 });
      pulseOpacity.value = 0;
    }
  }, [visible, pulse]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: 2 }],
  }));

  if (!visible) return null;

  return (
    <View style={[styles.dotContainer, style]}>
      {pulse ? (
        <Animated.View
          style={[
            styles.pulseRing,
            { width: size * 2, height: size * 2, borderRadius: size, backgroundColor: color },
            pulseStyle,
          ]}
        />
      ) : null}
      <Animated.View
        style={[
          styles.dot,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
          dotStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
  },
  dotContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {},
  pulseRing: {
    position: "absolute",
  },
});
