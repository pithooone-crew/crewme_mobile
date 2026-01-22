import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProgressScreen from "@/screens/ProgressScreen";
import LeaderboardScreen from "@/screens/LeaderboardScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ProgressStackParamList = {
  Progress: undefined;
  Leaderboard: undefined;
};

const Stack = createNativeStackNavigator<ProgressStackParamList>();

export default function ProgressStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          headerTitle: "Progress",
        }}
      />
      <Stack.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          headerTitle: "Leaderboard",
        }}
      />
    </Stack.Navigator>
  );
}
