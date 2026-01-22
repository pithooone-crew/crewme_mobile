import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DashboardScreen from "@/screens/DashboardScreen";
import TaskDetailScreen from "@/screens/TaskDetailScreen";
import StarPerformerScreen from "@/screens/StarPerformerScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type HomeStackParamList = {
  Home: undefined;
  TaskDetail: { taskId: string };
  StarPerformer: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          headerTitle: () => <HeaderTitle title="CrewMe" />,
        }}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{
          headerTitle: "Task Details",
        }}
      />
      <Stack.Screen
        name="StarPerformer"
        component={StarPerformerScreen}
        options={{
          headerTitle: "Star Performer",
        }}
      />
    </Stack.Navigator>
  );
}
