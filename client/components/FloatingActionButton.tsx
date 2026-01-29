import React, { useState } from "react";
import { View, Text, StyleSheet, ViewStyle, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, BorderRadius, Spacing, Shadows } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

interface FABAction {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  icon?: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  actions?: FABAction[];
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  gradientColors?: [string, string];
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
  testID?: string;
}

export function FloatingActionButton({
  icon = "plus",
  onPress,
  actions,
  position = "bottom-right",
  gradientColors = [Colors.primary, Colors.primaryDark] as [string, string],
  size = "medium",
  style,
  testID,
}: FloatingActionButtonProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const expandProgress = useSharedValue(0);

  const sizeValues = {
    small: { button: 48, icon: 20 },
    medium: { button: 56, icon: 24 },
    large: { button: 64, icon: 28 },
  };

  const currentSize = sizeValues[size];

  const positionStyles: ViewStyle = {
    position: "absolute",
    bottom: insets.bottom + Spacing.xl,
    ...(position === "bottom-right" && { right: Spacing.xl }),
    ...(position === "bottom-left" && { left: Spacing.xl }),
    ...(position === "bottom-center" && { alignSelf: "center", left: 0, right: 0, alignItems: "center" }),
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const handlePress = () => {
    if (actions && actions.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const newExpanded = !isExpanded;
      setIsExpanded(newExpanded);
      rotation.value = withSpring(newExpanded ? 45 : 0, { damping: 15, stiffness: 200 });
      expandProgress.value = withSpring(newExpanded ? 1 : 0, { damping: 15, stiffness: 200 });
    } else if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      scale.value = withSequence(
        withSpring(0.9, { damping: 15, stiffness: 400 }),
        withSpring(1, { damping: 15, stiffness: 400 })
      );
      onPress();
    }
  };

  const tap = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    })
    .onEnd(() => {
      handlePress();
    });

  const renderActionButton = (action: FABAction, index: number) => {
    const animatedActionStyle = useAnimatedStyle(() => {
      const translateY = interpolate(
        expandProgress.value,
        [0, 1],
        [0, -(index + 1) * 60],
        Extrapolation.CLAMP
      );
      const opacity = expandProgress.value;
      const actionScale = interpolate(expandProgress.value, [0, 1], [0.5, 1], Extrapolation.CLAMP);

      return {
        transform: [{ translateY }, { scale: actionScale }],
        opacity,
      };
    });

    return (
      <Animated.View key={index} style={[styles.actionContainer, animatedActionStyle]}>
        <View
          style={[
            styles.actionLabel,
            { backgroundColor: isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.95)" },
          ]}
        >
          <Text style={[styles.actionLabelText, { color: theme.text }]}>{action.label}</Text>
        </View>
        <GestureDetector
          gesture={Gesture.Tap().onEnd(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            action.onPress();
            setIsExpanded(false);
            rotation.value = withSpring(0, { damping: 15, stiffness: 200 });
            expandProgress.value = withSpring(0, { damping: 15, stiffness: 200 });
          })}
        >
          <View
            style={[
              styles.actionButton,
              { backgroundColor: action.color || Colors.secondary },
            ]}
          >
            <Feather name={action.icon} size={20} color="#FFFFFF" />
          </View>
        </GestureDetector>
      </Animated.View>
    );
  };

  return (
    <View style={[positionStyles, style]} testID={testID}>
      {actions?.map((action, index) => renderActionButton(action, index))}
      <GestureDetector gesture={tap}>
        <Animated.View style={animatedButtonStyle}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.button,
              {
                width: currentSize.button,
                height: currentSize.button,
                borderRadius: currentSize.button / 2,
              },
              Shadows.floating,
            ]}
          >
            <Feather name={icon} size={currentSize.icon} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  actionContainer: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    right: 0,
  },
  actionLabel: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  actionLabelText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
