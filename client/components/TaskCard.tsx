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
import { Task } from "@/lib/api";

interface TaskCardProps {
  task: Task;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const priorityColors: Record<string, string> = {
  low: Colors.success,
  medium: Colors.warning,
  high: Colors.primary,
  urgent: Colors.error,
};

const statusIcons: Record<string, keyof typeof Feather.glyphMap> = {
  pending: "clock",
  in_progress: "play-circle",
  completed: "check-circle",
};

export function TaskCard({ task, onPress }: TaskCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const priorityColor = priorityColors[task.priority] || Colors.primary;
  const statusIcon = statusIcons[task.status] || "clock";

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
      testID={`task-card-${task.id}`}
    >
      <View style={[styles.priorityIndicator, { backgroundColor: priorityColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="h4" numberOfLines={1} style={styles.title}>
            {task.title}
          </ThemedText>
          <View style={styles.xpBadge}>
            <ThemedText style={styles.xpText}>+{task.xpReward} XP</ThemedText>
          </View>
        </View>
        <ThemedText
          type="small"
          numberOfLines={2}
          style={[styles.description, { color: theme.textSecondary }]}
        >
          {task.description}
        </ThemedText>
        <View style={styles.footer}>
          <View style={styles.projectBadge}>
            <Feather name="folder" size={12} color={theme.textSecondary} />
            <ThemedText style={[styles.projectText, { color: theme.textSecondary }]}>
              {task.projectName}
            </ThemedText>
          </View>
          <View style={styles.statusBadge}>
            <Feather
              name={statusIcon}
              size={14}
              color={task.status === "completed" ? Colors.success : Colors.primary}
            />
            <ThemedText
              style={[
                styles.statusText,
                { color: task.status === "completed" ? Colors.success : Colors.primary },
              ]}
            >
              {task.status.replace("_", " ").toUpperCase()}
            </ThemedText>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  priorityIndicator: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  title: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  xpBadge: {
    backgroundColor: Colors.xpGold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  xpText: {
    color: "#1A1D1F",
    fontSize: 11,
    fontWeight: "700",
  },
  description: {
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  projectBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  projectText: {
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
