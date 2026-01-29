import React from "react";
import { ViewStyle, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

interface PressableScaleProps {
  children: React.ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  scaleDown?: number;
  hapticFeedback?: "light" | "medium" | "heavy" | "none";
  style?: ViewStyle;
  testID?: string;
}

export function PressableScale({
  children,
  onPress,
  onLongPress,
  disabled = false,
  scaleDown = 0.97,
  hapticFeedback = "light",
  style,
  testID,
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const triggerHaptic = () => {
    if (hapticFeedback === "none") return;
    const feedbackStyle = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };
    Haptics.impactAsync(feedbackStyle[hapticFeedback]);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const tap = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      scale.value = withSpring(scaleDown, { damping: 15, stiffness: 400 });
      opacity.value = withSpring(0.9, { damping: 15, stiffness: 400 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      opacity.value = withSpring(1, { damping: 15, stiffness: 400 });
    })
    .onEnd(() => {
      triggerHaptic();
      onPress();
    });

  const longPress = Gesture.LongPress()
    .enabled(!disabled && !!onLongPress)
    .minDuration(500)
    .onStart(() => {
      if (onLongPress) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onLongPress();
      }
    });

  const composedGesture = Gesture.Race(tap, longPress);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[animatedStyle, { opacity: disabled ? 0.5 : 1 }, style]}
        testID={testID}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({});
