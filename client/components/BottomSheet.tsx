import React, { useCallback, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Pressable, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[];
  enableDrag?: boolean;
  showHandle?: boolean;
  showCloseButton?: boolean;
}

export function BottomSheet({
  isVisible,
  onClose,
  children,
  title,
  snapPoints = [0.5],
  enableDrag = true,
  showHandle = true,
  showCloseButton = true,
}: BottomSheetProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  const maxHeight = SCREEN_HEIGHT * Math.max(...snapPoints);
  const minHeight = SCREEN_HEIGHT * Math.min(...snapPoints);

  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(SCREEN_HEIGHT - maxHeight, {
        damping: 25,
        stiffness: 300,
      });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, { damping: 25, stiffness: 300 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible, maxHeight]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .enabled(enableDrag)
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = Math.max(
        context.value.y + event.translationY,
        SCREEN_HEIGHT - maxHeight
      );
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        translateY.value = withSpring(SCREEN_HEIGHT, { damping: 25, stiffness: 300 });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(handleClose)();
      } else {
        translateY.value = withSpring(SCREEN_HEIGHT - maxHeight, {
          damping: 25,
          stiffness: 300,
        });
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value * 0.5,
  }));

  if (!isVisible && translateY.value === SCREEN_HEIGHT) {
    return null;
  }

  const sheetContent = (
    <>
      {showHandle ? (
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: theme.textSecondary }]} />
        </View>
      ) : null}
      {title || showCloseButton ? (
        <View style={styles.header}>
          {title ? <Text style={[styles.title, { color: theme.text }]}>{title}</Text> : <View />}
          {showCloseButton ? (
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View style={[styles.content, { paddingBottom: insets.bottom + Spacing.lg }]}>
        {children}
      </View>
    </>
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isVisible ? "auto" : "none"}>
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.sheet,
            {
              height: maxHeight,
              backgroundColor: isDark ? theme.backgroundDefault : "#FFFFFF",
            },
            animatedSheetStyle,
          ]}
        >
          {Platform.OS !== "web" ? (
            <BlurView
              intensity={90}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          {sheetContent}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontFamily: "Montserrat_600SemiBold",
    fontWeight: "600",
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
});
