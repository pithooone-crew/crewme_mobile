import React from "react";
import { Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Feather } from "@expo/vector-icons";
import { Colors, BorderRadius, Spacing, Typography } from "@/constants/theme";

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  colors?: string[];
  icon?: keyof typeof Feather.glyphMap;
  iconPosition?: "left" | "right";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger";
}

const variantColors: Record<string, string[]> = {
  primary: [Colors.primary, Colors.primaryDark],
  secondary: [Colors.secondary, "#003366"],
  success: [Colors.success, "#059669"],
  warning: [Colors.warning, "#D97706"],
  danger: [Colors.error, "#DC2626"],
};

export function GradientButton({
  title,
  onPress,
  colors,
  icon,
  iconPosition = "left",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  textStyle,
  variant = "primary",
}: GradientButtonProps) {
  const scale = useSharedValue(1);

  const sizeStyles = {
    small: { height: 40, paddingHorizontal: Spacing.md, fontSize: 14, iconSize: 16 },
    medium: { height: 48, paddingHorizontal: Spacing.xl, fontSize: 16, iconSize: 18 },
    large: { height: 56, paddingHorizontal: Spacing["2xl"], fontSize: 18, iconSize: 20 },
  };

  const currentSize = sizeStyles[size];
  const gradientColors = colors || variantColors[variant];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const tap = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    })
    .onEnd(() => {
      if (!disabled && !loading) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }
    });

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={[animatedStyle, style]}>
        <LinearGradient
          colors={disabled ? ["#9CA3AF", "#6B7280"] as [string, string] : gradientColors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            {
              height: currentSize.height,
              paddingHorizontal: currentSize.paddingHorizontal,
              opacity: disabled ? 0.6 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              {icon && iconPosition === "left" ? (
                <Feather name={icon} size={currentSize.iconSize} color="#FFFFFF" style={styles.iconLeft} />
              ) : null}
              <Text style={[styles.text, { fontSize: currentSize.fontSize }, textStyle]}>{title}</Text>
              {icon && iconPosition === "right" ? (
                <Feather name={icon} size={currentSize.iconSize} color="#FFFFFF" style={styles.iconRight} />
              ) : null}
            </>
          )}
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#FFFFFF",
    fontFamily: "Montserrat_600SemiBold",
    fontWeight: "600",
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});
