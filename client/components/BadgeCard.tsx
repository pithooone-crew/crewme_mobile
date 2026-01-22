import React from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Badge } from "@/lib/api";

interface BadgeCardProps {
  badge: Badge;
  onPress?: () => void;
  size?: "small" | "large";
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function BadgeCard({ badge, onPress, size = "small" }: BadgeCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const isLarge = size === "large";
  const containerSize = isLarge ? 100 : 70;
  const iconSize = isLarge ? 36 : 24;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
      style={[animatedStyle, styles.wrapper]}
      testID={`badge-card-${badge.id}`}
    >
      <View
        style={[
          styles.container,
          {
            width: containerSize,
            height: containerSize,
            backgroundColor: badge.isUnlocked
              ? Colors.xpGold
              : theme.backgroundSecondary,
            borderColor: badge.isUnlocked ? Colors.xpGold : theme.border,
          },
        ]}
      >
        {badge.isUnlocked ? (
          <Feather name="award" size={iconSize} color="#1A1D1F" />
        ) : (
          <Feather name="lock" size={iconSize} color={theme.textSecondary} />
        )}
      </View>
      <ThemedText
        type="small"
        numberOfLines={2}
        style={[
          styles.name,
          {
            color: badge.isUnlocked ? theme.text : theme.textSecondary,
            maxWidth: containerSize + 10,
          },
        ]}
      >
        {badge.name}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginRight: Spacing.md,
  },
  container: {
    borderRadius: BorderRadius.full,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    marginTop: Spacing.xs,
    textAlign: "center",
    fontSize: 12,
  },
});
