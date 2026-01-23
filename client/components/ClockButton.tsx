import React, { useState } from "react";
import { StyleSheet, Pressable, ActivityIndicator, Platform, View, Linking } from "react-native";
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
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

interface ClockButtonProps {
  isClockedIn: boolean;
  onClockIn: (location: { latitude: number; longitude: number }) => Promise<void>;
  onClockOut: (location: { latitude: number; longitude: number }) => Promise<void>;
  onRequestClockIn?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ClockButton({ isClockedIn, onClockIn, onClockOut, onRequestClockIn }: ClockButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);

  React.useEffect(() => {
    if (isClockedIn) {
      pulse.value = withRepeat(
        withSequence(
          withSpring(1.02, { damping: 15, stiffness: 100 }),
          withSpring(1, { damping: 15, stiffness: 100 })
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

  const openSettings = async () => {
    if (Platform.OS !== "web") {
      try {
        await Linking.openSettings();
      } catch {
        // Settings not available
      }
    }
  };

  const getLocation = async (): Promise<{ latitude: number; longitude: number }> => {
    let coords = { latitude: 0, longitude: 0 };

    if (Platform.OS !== "web") {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        setPermissionDenied(true);
        setError("Location access required for clock in/out");
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        throw new Error("Location permission denied");
      }

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      } catch {
        try {
          const lastLocation = await Location.getLastKnownPositionAsync();
          if (lastLocation) {
            coords = {
              latitude: lastLocation.coords.latitude,
              longitude: lastLocation.coords.longitude,
            };
          }
        } catch {
          // Use default coords if all else fails
        }
      }
    } else {
      if (navigator.geolocation) {
        try {
          const position = await Promise.race([
            new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 2000,
                enableHighAccuracy: false,
                maximumAge: 300000,
              });
            }),
            new Promise<GeolocationPosition>((_, reject) => 
              setTimeout(() => reject(new Error("Timeout")), 2000)
            )
          ]);
          coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch {
          // Use default coords on web - immediate fallback
        }
      }
    }
    return coords;
  };

  const handlePress = async () => {
    setError(null);
    setPermissionDenied(false);

    if (!isClockedIn && onRequestClockIn) {
      onRequestClockIn();
      return;
    }

    setIsLoading(true);

    try {
      const coords = await getLocation();

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
      if (!permissionDenied) {
        setError("Failed to clock. Please try again.");
      }
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
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          {permissionDenied && Platform.OS !== "web" ? (
            <Pressable onPress={openSettings} style={styles.settingsLink}>
              <ThemedText style={styles.settingsText}>Open Settings</ThemedText>
            </Pressable>
          ) : null}
        </View>
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
  errorContainer: {
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    textAlign: "center",
  },
  settingsLink: {
    marginTop: Spacing.xs,
    padding: Spacing.xs,
  },
  settingsText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
});
