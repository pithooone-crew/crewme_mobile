import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MapScreen from "@/screens/MapScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type MapStackParamList = {
  Map: undefined;
};

const Stack = createNativeStackNavigator<MapStackParamList>();

export default function MapStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Map"
        component={MapScreen}
        options={{ headerTitle: "Map Dashboard" }}
      />
    </Stack.Navigator>
  );
}
