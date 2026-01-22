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
import { Skill } from "@/lib/api";

interface SkillTreeNodeProps {
  skill: Skill;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SkillTreeNode({ skill, onPress }: SkillTreeNodeProps) {
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

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
      style={[animatedStyle]}
      testID={`skill-node-${skill.id}`}
    >
      <View
        style={[
          styles.node,
          {
            backgroundColor: skill.isUnlocked
              ? Colors.primary
              : theme.backgroundSecondary,
            borderColor: skill.isUnlocked ? Colors.primaryDark : theme.border,
          },
        ]}
      >
        {skill.isUnlocked ? (
          <Feather name="check" size={20} color="#FFFFFF" />
        ) : (
          <Feather name="lock" size={16} color={theme.textSecondary} />
        )}
      </View>
      <ThemedText
        type="small"
        numberOfLines={2}
        style={[
          styles.name,
          { color: skill.isUnlocked ? theme.text : theme.textSecondary },
        ]}
      >
        {skill.name}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  node: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    marginTop: Spacing.xs,
    textAlign: "center",
    maxWidth: 70,
    fontSize: 11,
  },
});
