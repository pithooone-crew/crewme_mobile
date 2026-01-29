import React from "react";
import { View, StyleSheet, ViewStyle, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  borderRadius?: number;
  padding?: number;
  gradient?: boolean;
  gradientColors?: string[];
}

export function GlassCard({
  children,
  style,
  intensity = 80,
  borderRadius = BorderRadius.lg,
  padding = Spacing.lg,
  gradient = false,
  gradientColors,
}: GlassCardProps) {
  const { theme, isDark } = useTheme();

  const defaultGradientColors: [string, string] = isDark
    ? ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.02)"]
    : ["rgba(255,255,255,0.9)", "rgba(255,255,255,0.7)"];

  const containerStyle: ViewStyle = {
    borderRadius,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.5)",
  };

  const contentStyle: ViewStyle = {
    padding,
  };

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          containerStyle,
          {
            backgroundColor: isDark ? "rgba(15,20,25,0.85)" : "rgba(255,255,255,0.85)",
            backdropFilter: "blur(20px)",
          } as ViewStyle,
          style,
        ]}
      >
        {gradient ? (
          <LinearGradient
            colors={(gradientColors as [string, string]) || defaultGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={contentStyle}
          >
            {children}
          </LinearGradient>
        ) : (
          <View style={contentStyle}>{children}</View>
        )}
      </View>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      <BlurView intensity={intensity} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
      {gradient ? (
        <LinearGradient
          colors={(gradientColors as [string, string]) || defaultGradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={contentStyle}
        >
          {children}
        </LinearGradient>
      ) : (
        <View style={contentStyle}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({});
