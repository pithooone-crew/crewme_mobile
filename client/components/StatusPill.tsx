import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";

type StatusType = "success" | "warning" | "error" | "info" | "neutral";

interface StatusPillProps {
  status: StatusType;
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  size?: "small" | "medium" | "large";
  outlined?: boolean;
  animated?: boolean;
  style?: ViewStyle;
}

const statusConfig: Record<StatusType, { color: string; bgColor: string; icon: keyof typeof Feather.glyphMap }> = {
  success: { color: Colors.success, bgColor: `${Colors.success}20`, icon: "check-circle" },
  warning: { color: Colors.warning, bgColor: `${Colors.warning}20`, icon: "alert-circle" },
  error: { color: Colors.error, bgColor: `${Colors.error}20`, icon: "x-circle" },
  info: { color: Colors.primary, bgColor: `${Colors.primary}20`, icon: "info" },
  neutral: { color: Colors.textSecondary, bgColor: `${Colors.textSecondary}20`, icon: "circle" },
};

const sizeConfig = {
  small: { height: 24, paddingHorizontal: 8, fontSize: 11, iconSize: 12 },
  medium: { height: 28, paddingHorizontal: 12, fontSize: 13, iconSize: 14 },
  large: { height: 34, paddingHorizontal: 16, fontSize: 15, iconSize: 16 },
};

export function StatusPill({
  status,
  label,
  icon,
  size = "medium",
  outlined = false,
  animated = false,
  style,
}: StatusPillProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const displayIcon = icon || config.icon;

  return (
    <View
      style={[
        styles.container,
        {
          height: sizeStyles.height,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          backgroundColor: outlined ? "transparent" : config.bgColor,
          borderWidth: outlined ? 1 : 0,
          borderColor: config.color,
        },
        style,
      ]}
    >
      <Feather name={displayIcon} size={sizeStyles.iconSize} color={config.color} />
      <Text
        style={[
          styles.label,
          {
            fontSize: sizeStyles.fontSize,
            color: config.color,
            marginLeft: Spacing.xs,
          },
        ]}
      >
        {label}
      </Text>
      {animated ? <View style={[styles.pulse, { backgroundColor: config.color }]} /> : null}
    </View>
  );
}

interface StatusDotProps {
  status: StatusType;
  size?: number;
  pulse?: boolean;
  style?: ViewStyle;
}

export function StatusDot({ status, size = 8, pulse = false, style }: StatusDotProps) {
  const config = statusConfig[status];

  return (
    <View style={[styles.dotContainer, style]}>
      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: config.color,
          },
        ]}
      />
      {pulse ? (
        <View
          style={[
            styles.pulseRing,
            {
              width: size * 2,
              height: size * 2,
              borderRadius: size,
              backgroundColor: `${config.color}40`,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.full,
  },
  label: {
    fontWeight: "600",
  },
  pulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: Spacing.xs,
    opacity: 0.6,
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
