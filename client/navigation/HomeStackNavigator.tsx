import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DashboardScreen from "@/screens/DashboardScreen";
import TaskDetailScreen from "@/screens/TaskDetailScreen";
import StarPerformerScreen from "@/screens/StarPerformerScreen";
import ProjectsScreen from "@/screens/ProjectsScreen";
import CrewScreen from "@/screens/CrewScreen";
import TimesheetScreen from "@/screens/TimesheetScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";
import AIFeaturesScreen from "@/screens/AIFeaturesScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type HomeStackParamList = {
  Home: undefined;
  TaskDetail: { taskId: string };
  StarPerformer: undefined;
  Projects: undefined;
  Crew: undefined;
  Timesheet: undefined;
  Notifications: undefined;
  AIFeatures: undefined;
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
      <Stack.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{
          headerTitle: "Projects",
        }}
      />
      <Stack.Screen
        name="Crew"
        component={CrewScreen}
        options={{
          headerTitle: "Crew Directory",
        }}
      />
      <Stack.Screen
        name="Timesheet"
        component={TimesheetScreen}
        options={{
          headerTitle: "Timesheet",
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          headerTitle: "Notifications",
        }}
      />
      <Stack.Screen
        name="AIFeatures"
        component={AIFeaturesScreen}
        options={{
          headerTitle: "AI Tools",
        }}
      />
    </Stack.Navigator>
  );
}
