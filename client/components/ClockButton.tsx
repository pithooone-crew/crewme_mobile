import React, { useState } from "react";
import { StyleSheet, Pressable, ActivityIndicator, Platform, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

interface ClockButtonProps {
  isClockedIn: boolean;
  onClockIn: (location: { latitude: number; longitude: number }) => Promise<void>;
  onClockOut: (location: { latitude: number; longitude: number }) => Promise<void>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ClockButton({ isClockedIn, onClockIn, onClockOut }: ClockButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);

  React.useEffect(() => {
    if (isClockedIn) {
      pulse.value = withRepeat(
        withSequence(
          withSpring(1.05, { damping: 10 }),
          withSpring(1, { damping: 10 })
        ),
        -1,
        true
      );
    } else {
      pulse.value = 1;
    }
  }, [isClockedIn]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulse.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handlePress = async () => {
    setError(null);
    setIsLoading(true);

    try {
      let coords = { latitude: 0, longitude: 0 };

      // Try to get location, but fall back to default if on web or if it fails
      if (Platform.OS !== "web") {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            coords = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
          }
        } catch (locErr) {
          console.log("Location error, using default coordinates");
        }
      } else {
        // On web, try browser geolocation API
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                enableHighAccuracy: false,
              });
            } else {
              reject(new Error("Geolocation not supported"));
            }
          });
          coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch (webLocErr) {
          console.log("Web location error, using default coordinates");
        }
      }

      if (isClockedIn) {
        await onClockOut(coords);
      } else {
        await onClockIn(coords);
      }
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.error("Clock action error:", err);
      setError("Clock action failed. Please try again.");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isLoading}
        style={[
          styles.button,
          { backgroundColor: isClockedIn ? Colors.error : Colors.success },
          animatedStyle,
        ]}
        testID="clock-button"
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Feather
              name={isClockedIn ? "log-out" : "log-in"}
              size={24}
              color="#FFFFFF"
            />
            <ThemedText style={styles.buttonText}>
              {isClockedIn ? "Clock Out" : "Clock In"}
            </ThemedText>
          </>
        )}
      </AnimatedPressable>
      {error ? (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    ...Shadows.floating,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});
