import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import TasksStackNavigator from "@/navigation/TasksStackNavigator";
import AIStackNavigator from "@/navigation/AIStackNavigator";
import MapStackNavigator from "@/navigation/MapStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/constants/theme";

export type MainTabParamList = {
  HomeTab: undefined;
  TasksTab: undefined;
  AITab: undefined;
  MapTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TasksTab"
        component={TasksStackNavigator}
        options={{
          title: "Tasks",
          tabBarIcon: ({ color, size }) => (
            <Feather name="clipboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AITab"
        component={AIStackNavigator}
        options={{
          title: "AI Tools",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.aiIconActive : undefined}>
              <Feather name="cpu" size={size} color={focused ? "#00BFA5" : color} />
            </View>
          ),
          tabBarActiveTintColor: "#00BFA5",
        }}
      />
      <Tab.Screen
        name="MapTab"
        component={MapStackNavigator}
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => (
            <Feather name="map" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  aiIconActive: {
    transform: [{ scale: 1.1 }],
  },
});
