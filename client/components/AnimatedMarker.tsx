import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

interface AnimatedMarkerProps {
  latitude: number;
  longitude: number;
  previousLatitude?: number;
  previousLongitude?: number;
  heading?: number;
  status: "active" | "idle" | "offline";
  userName?: string;
  size?: number;
  showDirection?: boolean;
}

const ANIMATION_DURATION = 1000;

export function AnimatedMarkerContent({
  heading,
  status,
  size = 32,
  showDirection = true,
}: Omit<AnimatedMarkerProps, "latitude" | "longitude" | "previousLatitude" | "previousLongitude" | "userName">) {
  const rotation = useSharedValue(heading || 0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (heading !== undefined) {
      rotation.value = withTiming(heading, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [heading]);

  useEffect(() => {
    if (status === "active") {
      const interval = setInterval(() => {
        pulse.value = 0;
        pulse.value = withTiming(1, { duration: 1500 });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const getStatusColor = () => {
    switch (status) {
      case "active": return Colors.success;
      case "idle": return Colors.warning;
      case "offline": return Colors.textSecondary;
      default: return Colors.primary;
    }
  };

  const directionStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.5]) }],
      opacity: interpolate(pulse.value, [0, 1], [0.6, 0]),
    };
  });

  const statusColor = getStatusColor();

  return (
    <View style={[styles.markerContainer, { width: size, height: size }]}>
      {status === "active" ? (
        <Animated.View
          style={[
            styles.pulseRing,
            { 
              width: size, 
              height: size, 
              borderRadius: size / 2,
              borderColor: statusColor,
            },
            pulseStyle,
          ]}
        />
      ) : null}
      
      <View
        style={[
          styles.markerOuter,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: statusColor,
          },
        ]}
      >
        <View
          style={[
            styles.markerInner,
            {
              width: size - 6,
              height: size - 6,
              borderRadius: (size - 6) / 2,
              backgroundColor: "#fff",
            },
          ]}
        >
          <Feather name="user" size={size / 2} color={statusColor} />
        </View>
      </View>

      {showDirection && heading !== undefined && status === "active" ? (
        <Animated.View style={[styles.directionIndicator, directionStyle]}>
          <View
            style={[
              styles.directionArrow,
              { borderBottomColor: statusColor },
            ]}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    borderWidth: 2,
  },
  markerOuter: {
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  directionIndicator: {
    position: "absolute",
    top: -12,
    alignItems: "center",
  },
  directionArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});
