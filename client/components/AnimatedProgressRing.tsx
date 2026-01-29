import React, { useEffect } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AnimatedProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  gradientColors?: string[];
  backgroundColor?: string;
  showPercentage?: boolean;
  label?: string;
  duration?: number;
  style?: ViewStyle;
}

export function AnimatedProgressRing({
  progress,
  size = 100,
  strokeWidth = 8,
  color,
  gradientColors,
  backgroundColor,
  showPercentage = true,
  label,
  duration = 1000,
  style,
}: AnimatedProgressRingProps) {
  const { theme, isDark } = useTheme();
  const animatedProgress = useSharedValue(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const defaultColor = progress >= 70 ? Colors.success : progress >= 40 ? Colors.warning : Colors.error;
  const ringColor = color || defaultColor;
  const bgColor = backgroundColor || (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)");

  useEffect(() => {
    animatedProgress.value = withTiming(Math.min(progress, 100) / 100, {
      duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [progress, duration]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const useGradient = gradientColors && gradientColors.length >= 2;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} style={styles.svg}>
        {useGradient ? (
          <Defs>
            <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={gradientColors[0]} />
              <Stop offset="100%" stopColor={gradientColors[1]} />
            </LinearGradient>
          </Defs>
        ) : null}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={useGradient ? "url(#progressGradient)" : ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.labelContainer}>
        {showPercentage ? (
          <Text style={[styles.percentage, { color: theme.text }]}>{Math.round(progress)}%</Text>
        ) : null}
        {label ? <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    position: "absolute",
  },
  labelContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  percentage: {
    fontSize: 20,
    fontFamily: "Montserrat_700Bold",
    fontWeight: "700",
  },
  label: {
    fontSize: 12,
    marginTop: 2,
  },
});
