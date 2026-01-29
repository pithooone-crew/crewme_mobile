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
import AttendanceScreen from "@/screens/AttendanceScreen";
import CrewIDCardScreen from "@/screens/CrewIDCardScreen";
import AINotificationsScreen from "@/screens/AINotificationsScreen";
import AvailabilityPoolScreen from "@/screens/AvailabilityPoolScreen";
import SmartEquipmentListScreen from "@/screens/SmartEquipmentListScreen";
import EquipmentDetailScreen from "@/screens/EquipmentDetailScreen";
import FleetAlertsScreen from "@/screens/FleetAlertsScreen";
import AIDispatchScreen from "@/screens/AIDispatchScreen";
import VoiceTaskScreen from "@/screens/VoiceTaskScreen";
import PhotoDocScreen from "@/screens/PhotoDocScreen";
import PPEReminderScreen from "@/screens/PPEReminderScreen";
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
  Attendance: undefined;
  CrewIDCard: undefined;
  AINotifications: undefined;
  AvailabilityPool: undefined;
  SmartEquipment: undefined;
  EquipmentDetail: { equipmentId: number };
  FleetAlerts: undefined;
  AIDispatch: undefined;
  VoiceTask: undefined;
  PhotoDoc: undefined;
  PPEReminder: undefined;
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
      <Stack.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          headerTitle: "Attendance & Timesheet",
        }}
      />
      <Stack.Screen
        name="CrewIDCard"
        component={CrewIDCardScreen}
        options={{
          headerTitle: "Crew ID Card",
        }}
      />
      <Stack.Screen
        name="AINotifications"
        component={AINotificationsScreen}
        options={{
          headerTitle: "AI Notifications",
        }}
      />
      <Stack.Screen
        name="AvailabilityPool"
        component={AvailabilityPoolScreen}
        options={{
          headerTitle: "Availability Pool",
        }}
      />
      <Stack.Screen
        name="SmartEquipment"
        component={SmartEquipmentListScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EquipmentDetail"
        component={EquipmentDetailScreen}
        options={{
          headerTitle: "Equipment Details",
        }}
      />
      <Stack.Screen
        name="FleetAlerts"
        component={FleetAlertsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AIDispatch"
        component={AIDispatchScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="VoiceTask"
        component={VoiceTaskScreen}
        options={{
          headerTitle: "Voice-to-Task",
        }}
      />
      <Stack.Screen
        name="PhotoDoc"
        component={PhotoDocScreen}
        options={{
          headerTitle: "Photo Documentation",
        }}
      />
      <Stack.Screen
        name="PPEReminder"
        component={PPEReminderScreen}
        options={{
          headerTitle: "PPE Reminders",
        }}
      />
    </Stack.Navigator>
  );
}
