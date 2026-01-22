import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
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
import { Reward } from "@/lib/api";

interface RewardCardProps {
  reward: Reward;
  userPoints: number;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const categoryIcons: Record<string, keyof typeof Feather.glyphMap> = {
  pto: "calendar",
  gift_card: "gift",
  equipment: "tool",
  bonus: "dollar-sign",
};

export function RewardCard({ reward, userPoints, onPress }: RewardCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const canAfford = userPoints >= reward.pointsCost;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const iconName = categoryIcons[reward.category] || "gift";

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!reward.available}
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundDefault,
          opacity: reward.available ? 1 : 0.5,
        },
        animatedStyle,
      ]}
      testID={`reward-card-${reward.id}`}
    >
      <View style={[styles.iconContainer, { backgroundColor: Colors.primary + "15" }]}>
        <Feather name={iconName} size={28} color={Colors.primary} />
      </View>
      <ThemedText type="h4" numberOfLines={1} style={styles.name}>
        {reward.name}
      </ThemedText>
      <ThemedText
        type="small"
        numberOfLines={2}
        style={[styles.description, { color: theme.textSecondary }]}
      >
        {reward.description}
      </ThemedText>
      <View style={styles.footer}>
        <View
          style={[
            styles.costBadge,
            { backgroundColor: canAfford ? Colors.success + "20" : theme.backgroundSecondary },
          ]}
        >
          <Feather
            name="star"
            size={12}
            color={canAfford ? Colors.success : theme.textSecondary}
          />
          <ThemedText
            style={[
              styles.costText,
              { color: canAfford ? Colors.success : theme.textSecondary },
            ]}
          >
            {reward.pointsCost.toLocaleString()}
          </ThemedText>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "48%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  name: {
    marginBottom: Spacing.xs,
  },
  description: {
    marginBottom: Spacing.md,
    minHeight: 40,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  costBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  costText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
