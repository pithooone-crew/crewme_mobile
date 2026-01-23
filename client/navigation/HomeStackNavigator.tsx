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
import MessagesScreen from "@/screens/MessagesScreen";
import ComposeMessageScreen from "@/screens/ComposeMessageScreen";
import MessageDetailScreen from "@/screens/MessageDetailScreen";
import TemplatesScreen from "@/screens/TemplatesScreen";
import MoreScreen from "@/screens/MoreScreen";
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
  Messages: undefined;
  ComposeMessage: undefined;
  MessageDetail: { messageId: string };
  Templates: undefined;
  More: undefined;
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
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          headerTitle: "Messages",
        }}
      />
      <Stack.Screen
        name="ComposeMessage"
        component={ComposeMessageScreen}
        options={{
          headerTitle: "New Message",
        }}
      />
      <Stack.Screen
        name="MessageDetail"
        component={MessageDetailScreen}
        options={{
          headerTitle: "Message",
        }}
      />
      <Stack.Screen
        name="Templates"
        component={TemplatesScreen}
        options={{
          headerTitle: "Project Templates",
        }}
      />
      <Stack.Screen
        name="More"
        component={MoreScreen}
        options={{
          headerTitle: "All Features",
        }}
      />
    </Stack.Navigator>
  );
}
