import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SmartEquipmentListScreen from "@/screens/SmartEquipmentListScreen";
import EquipmentDetailScreen from "@/screens/EquipmentDetailScreen";
import FleetAlertsScreen from "@/screens/FleetAlertsScreen";
import AIDispatchScreen from "@/screens/AIDispatchScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type SmartEquipmentStackParamList = {
  SmartEquipmentList: undefined;
  EquipmentDetail: { equipmentId: number };
  FleetAlerts: undefined;
  AIDispatch: undefined;
};

const Stack = createNativeStackNavigator<SmartEquipmentStackParamList>();

export default function SmartEquipmentStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="SmartEquipmentList"
        component={SmartEquipmentListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EquipmentDetail"
        component={EquipmentDetailScreen}
        options={{ headerTitle: "Equipment Details" }}
      />
      <Stack.Screen
        name="FleetAlerts"
        component={FleetAlertsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AIDispatch"
        component={AIDispatchScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
