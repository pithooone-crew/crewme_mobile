import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AIHubScreen from "@/screens/AIHubScreen";
import VoiceTaskScreen from "@/screens/VoiceTaskScreen";
import PhotoDocScreen from "@/screens/PhotoDocScreen";
import PPEReminderScreen from "@/screens/PPEReminderScreen";
import AINotificationsScreen from "@/screens/AINotificationsScreen";
import AvailabilityPoolScreen from "@/screens/AvailabilityPoolScreen";
import AIDispatchScreen from "@/screens/AIDispatchScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type AIStackParamList = {
  AIHub: undefined;
  AIVoiceTask: undefined;
  AIPhotoDoc: undefined;
  AIPPEReminder: undefined;
  AISelfHealing: undefined;
  AIAvailability: undefined;
  AIEquipmentDispatch: undefined;
};

const Stack = createNativeStackNavigator<AIStackParamList>();

export default function AIStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="AIHub"
        component={AIHubScreen}
        options={{
          headerTitle: () => <HeaderTitle title="AI Tools" />,
        }}
      />
      <Stack.Screen
        name="AIVoiceTask"
        component={VoiceTaskScreen}
        options={{
          headerTitle: "Voice-to-Task",
        }}
      />
      <Stack.Screen
        name="AIPhotoDoc"
        component={PhotoDocScreen}
        options={{
          headerTitle: "Photo Documentation",
        }}
      />
      <Stack.Screen
        name="AIPPEReminder"
        component={PPEReminderScreen}
        options={{
          headerTitle: "PPE Reminders",
        }}
      />
      <Stack.Screen
        name="AISelfHealing"
        component={AINotificationsScreen}
        options={{
          headerTitle: "Self-Healing Shifts",
        }}
      />
      <Stack.Screen
        name="AIAvailability"
        component={AvailabilityPoolScreen}
        options={{
          headerTitle: "Availability Pool",
        }}
      />
      <Stack.Screen
        name="AIEquipmentDispatch"
        component={AIDispatchScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
