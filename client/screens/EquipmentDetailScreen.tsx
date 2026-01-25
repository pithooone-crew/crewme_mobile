import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { SmartEquipment, EquipmentAlert } from "@/stores/useSmartEquipmentStore";

type RouteParams = {
  EquipmentDetail: { equipmentId: number };
};

interface EquipmentWithAlerts extends SmartEquipment {
  alerts: EquipmentAlert[];
}

function getHealthColor(score: number): string {
  if (score >= 80) return Colors.success;
  if (score >= 50) return Colors.warning;
  return Colors.error;
}

function getHealthLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Poor";
  return "Critical";
}

function getStatusColor(status: string): string {
  switch (status) {
    case "running": return Colors.success;
    case "idle": return Colors.warning;
    case "maintenance": return Colors.primary;
    case "offline": return Colors.error;
    default: return Colors.textSecondary;
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical": return Colors.error;
    case "high": return "#f97316";
    case "medium": return Colors.warning;
    case "low": return Colors.primary;
    default: return Colors.textSecondary;
  }
}

function getAlertIcon(type: string): keyof typeof Feather.glyphMap {
  switch (type) {
    case "fuel_low": return "droplet";
    case "temp_high": return "thermometer";
    case "oil_pressure": return "alert-circle";
    case "battery_low": return "battery";
    case "maintenance_due": return "tool";
    case "engine_fault": return "alert-triangle";
    default: return "alert-circle";
  }
}

function GaugeCard({ 
  label, 
  value, 
  unit, 
  icon, 
  color, 
  min = 0, 
  max = 100,
  theme 
}: { 
  label: string; 
  value: number; 
  unit: string; 
  icon: keyof typeof Feather.glyphMap; 
  color: string;
  min?: number;
  max?: number;
  theme: any;
}) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  
  return (
    <View style={[styles.gaugeCard, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.gaugeHeader}>
        <Feather name={icon} size={16} color={color} />
        <Text style={[styles.gaugeLabel, { color: theme.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.gaugeValue, { color: theme.text }]}>
        {value.toLocaleString()}<Text style={styles.gaugeUnit}>{unit}</Text>
      </Text>
      <View style={[styles.gaugeBar, { backgroundColor: `${color}20` }]}>
        <View style={[styles.gaugeFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function EquipmentDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, "EquipmentDetail">>();
  const { equipmentId } = route.params;
  const queryClient = useQueryClient();

  const { data: equipment, isLoading, refetch, isRefetching } = useQuery<EquipmentWithAlerts>({
    queryKey: ["/api/smart-equipment", equipmentId],
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return apiRequest("PATCH", `/api/smart-equipment/alerts/${alertId}`, { action: "acknowledge" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-equipment", equipmentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/smart-equipment/alerts"] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return apiRequest("PATCH", `/api/smart-equipment/alerts/${alertId}`, { action: "resolve" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-equipment", equipmentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/smart-equipment/alerts"] });
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!equipment) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundRoot }]}>
        <Feather name="alert-circle" size={48} color={theme.textSecondary} />
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>Equipment not found</Text>
      </View>
    );
  }

  const openMap = () => {
    const { latitude, longitude } = equipment.location;
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}`,
      android: `google.navigation:q=${latitude},${longitude}`,
      default: `https://maps.google.com/maps?daddr=${latitude},${longitude}`,
    });
    Linking.openURL(url as string);
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
      }
    >
      <View style={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={[styles.equipmentName, { color: theme.text }]}>{equipment.name}</Text>
              <Text style={[styles.equipmentModel, { color: theme.textSecondary }]}>
                {equipment.model} | {equipment.serialNumber}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(equipment.status)}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(equipment.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(equipment.status) }]}>
                {equipment.status === "running" ? "Engine Running" : equipment.status.charAt(0).toUpperCase() + equipment.status.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.healthSection}>
            <View style={[styles.healthCircle, { borderColor: getHealthColor(equipment.healthScore) }]}>
              <Text style={[styles.healthValue, { color: getHealthColor(equipment.healthScore) }]}>
                {equipment.healthScore}
              </Text>
              <Text style={[styles.healthPercent, { color: getHealthColor(equipment.healthScore) }]}>%</Text>
            </View>
            <View>
              <Text style={[styles.healthTitle, { color: theme.text }]}>Health Score</Text>
              <View style={[styles.healthBadge, { backgroundColor: `${getHealthColor(equipment.healthScore)}20` }]}>
                <Text style={[styles.healthBadgeText, { color: getHealthColor(equipment.healthScore) }]}>
                  {getHealthLabel(equipment.healthScore)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Live Telemetry</Text>
        <View style={styles.gaugeGrid}>
          <GaugeCard
            label="RPM"
            value={equipment.telemetry.rpm}
            unit=""
            icon="activity"
            color={Colors.primary}
            min={0}
            max={3000}
            theme={theme}
          />
          <GaugeCard
            label="Fuel Level"
            value={equipment.telemetry.fuelLevel}
            unit="%"
            icon="droplet"
            color={equipment.telemetry.fuelLevel < 30 ? Colors.error : Colors.success}
            theme={theme}
          />
          <GaugeCard
            label="Coolant Temp"
            value={equipment.telemetry.coolantTemp}
            unit="°F"
            icon="thermometer"
            color={equipment.telemetry.coolantTemp > 200 ? Colors.error : Colors.primary}
            min={50}
            max={250}
            theme={theme}
          />
          <GaugeCard
            label="Oil Pressure"
            value={equipment.telemetry.oilPressure}
            unit=" PSI"
            icon="disc"
            color={equipment.telemetry.oilPressure < 20 ? Colors.error : Colors.success}
            min={0}
            max={80}
            theme={theme}
          />
          <GaugeCard
            label="Battery"
            value={equipment.telemetry.batteryVoltage}
            unit="V"
            icon="battery"
            color={equipment.telemetry.batteryVoltage < 11.5 ? Colors.error : Colors.success}
            min={10}
            max={14}
            theme={theme}
          />
          <GaugeCard
            label="Engine Hours"
            value={equipment.telemetry.engineHours}
            unit="h"
            icon="clock"
            color={Colors.primary}
            min={0}
            max={15000}
            theme={theme}
          />
        </View>

        {equipment.alerts && equipment.alerts.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Active Alerts ({equipment.alerts.length})
            </Text>
            <View style={styles.alertsList}>
              {equipment.alerts.map((alert) => (
                <View 
                  key={alert.id} 
                  style={[styles.alertCard, { backgroundColor: theme.backgroundDefault, borderLeftColor: getSeverityColor(alert.severity) }]}
                >
                  <View style={styles.alertHeader}>
                    <View style={[styles.alertIcon, { backgroundColor: `${getSeverityColor(alert.severity)}20` }]}>
                      <Feather name={getAlertIcon(alert.alertType)} size={16} color={getSeverityColor(alert.severity)} />
                    </View>
                    <View style={styles.alertContent}>
                      <Text style={[styles.alertMessage, { color: theme.text }]}>{alert.message}</Text>
                      <Text style={[styles.alertTime, { color: theme.textSecondary }]}>
                        {new Date(alert.timestamp).toLocaleString()}
                      </Text>
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) }]}>
                      <Text style={styles.severityText}>{alert.severity}</Text>
                    </View>
                  </View>
                  <View style={styles.alertActions}>
                    {!alert.acknowledged ? (
                      <Pressable
                        style={[styles.alertButton, { backgroundColor: `${Colors.primary}20` }]}
                        onPress={() => acknowledgeMutation.mutate(alert.id)}
                      >
                        <Feather name="check" size={14} color={Colors.primary} />
                        <Text style={[styles.alertButtonText, { color: Colors.primary }]}>Acknowledge</Text>
                      </Pressable>
                    ) : (
                      <View style={[styles.acknowledgedBadge, { backgroundColor: `${Colors.success}20` }]}>
                        <Feather name="check-circle" size={14} color={Colors.success} />
                        <Text style={[styles.acknowledgedText, { color: Colors.success }]}>Acknowledged</Text>
                      </View>
                    )}
                    <Pressable
                      style={[styles.alertButton, { backgroundColor: `${Colors.success}20` }]}
                      onPress={() => resolveMutation.mutate(alert.id)}
                    >
                      <Feather name="check-circle" size={14} color={Colors.success} />
                      <Text style={[styles.alertButtonText, { color: Colors.success }]}>Resolve</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {equipment.location ? (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Location</Text>
            <View style={[styles.locationCard, { backgroundColor: theme.backgroundDefault }]}>
              <View style={styles.locationInfo}>
                <Feather name="map-pin" size={20} color={Colors.primary} />
                <View>
                  {equipment.location.projectName ? (
                    <Text style={[styles.locationProject, { color: theme.text }]}>
                      {equipment.location.projectName}
                    </Text>
                  ) : null}
                  <Text style={[styles.locationCoords, { color: theme.textSecondary }]}>
                    {equipment.location.latitude.toFixed(4)}, {equipment.location.longitude.toFixed(4)}
                  </Text>
                </View>
              </View>
              <Pressable style={styles.mapButton} onPress={openMap}>
                <Feather name="navigation" size={16} color="#fff" />
                <Text style={styles.mapButtonText}>View on Map</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  heroCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.lg,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  equipmentName: {
    ...Typography.h2,
  },
  equipmentModel: {
    ...Typography.body,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  healthSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  healthCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  healthValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  healthPercent: {
    fontSize: 16,
    fontWeight: "600",
  },
  healthTitle: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  healthBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  healthBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sectionTitle: {
    ...Typography.h3,
  },
  gaugeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  gaugeCard: {
    width: "47%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  gaugeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  gaugeLabel: {
    fontSize: 12,
  },
  gaugeValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  gaugeUnit: {
    fontSize: 14,
    fontWeight: "400",
  },
  gaugeBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  gaugeFill: {
    height: "100%",
    borderRadius: 3,
  },
  alertsList: {
    gap: Spacing.md,
  },
  alertCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    gap: Spacing.md,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    ...Typography.body,
    fontWeight: "500",
  },
  alertTime: {
    ...Typography.small,
    marginTop: 4,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  severityText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  alertActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  alertButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  alertButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  acknowledgedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  acknowledgedText: {
    fontSize: 12,
    fontWeight: "600",
  },
  locationCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  locationProject: {
    ...Typography.body,
    fontWeight: "600",
  },
  locationCoords: {
    ...Typography.small,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  mapButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  errorText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
});
