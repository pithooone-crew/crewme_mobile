import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Animated,
  PanResponder,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { EquipmentAlert } from "@/stores/useSmartEquipmentStore";

type SmartEquipmentStackParamList = {
  EquipmentDetail: { equipmentId: number };
};

const severityFilters = [
  { id: null, label: "All" },
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
];

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

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function SwipeableAlertCard({ 
  alert, 
  theme, 
  onAcknowledge, 
  onResolve,
  onPress 
}: { 
  alert: EquipmentAlert; 
  theme: any; 
  onAcknowledge: () => void;
  onResolve: () => void;
  onPress: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [swiping, setSwiping] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        setSwiping(true);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(-150, gestureState.dx));
        } else if (gestureState.dx > 0) {
          translateX.setValue(Math.min(100, gestureState.dx));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        setSwiping(false);
        if (gestureState.dx < -100) {
          onResolve();
        } else if (gestureState.dx > 60 && !alert.acknowledged) {
          onAcknowledge();
        }
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.swipeActions}>
        <View style={[styles.swipeActionLeft, { backgroundColor: Colors.primary }]}>
          <Feather name="check" size={20} color="#fff" />
          <Text style={styles.swipeActionText}>Ack</Text>
        </View>
        <View style={[styles.swipeActionRight, { backgroundColor: Colors.success }]}>
          <Feather name="check-circle" size={20} color="#fff" />
          <Text style={styles.swipeActionText}>Resolve</Text>
        </View>
      </View>
      
      <Animated.View
        style={[{ transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Pressable 
          style={[styles.alertCard, { backgroundColor: theme.backgroundDefault }]}
          onPress={onPress}
          disabled={swiping}
        >
          <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor(alert.severity) }]} />
          
          <View style={styles.alertContent}>
            <View style={styles.alertHeader}>
              <View style={[styles.alertIcon, { backgroundColor: `${getSeverityColor(alert.severity)}20` }]}>
                <Feather name={getAlertIcon(alert.alertType)} size={20} color={getSeverityColor(alert.severity)} />
              </View>
              <View style={styles.alertInfo}>
                <Text style={[styles.equipmentName, { color: theme.text }]}>{alert.equipmentName}</Text>
                <Text style={[styles.alertMessage, { color: theme.textSecondary }]}>{alert.message}</Text>
              </View>
            </View>
            
            <View style={styles.alertFooter}>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) }]}>
                <Text style={styles.severityText}>{alert.severity}</Text>
              </View>
              {alert.acknowledged ? (
                <View style={[styles.acknowledgedBadge, { backgroundColor: `${Colors.success}20` }]}>
                  <Feather name="check" size={12} color={Colors.success} />
                  <Text style={[styles.acknowledgedText, { color: Colors.success }]}>Acknowledged</Text>
                </View>
              ) : null}
              <Text style={[styles.alertTime, { color: theme.textSecondary }]}>
                {formatTimeAgo(alert.timestamp)}
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function FleetAlertsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<SmartEquipmentStackParamList>>();
  const queryClient = useQueryClient();
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);

  const { data: alerts = [], isLoading, refetch, isRefetching } = useQuery<EquipmentAlert[]>({
    queryKey: ["/api/smart-equipment/alerts?active=true"],
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return apiRequest("PATCH", `/api/smart-equipment/alerts/${alertId}`, { action: "acknowledge" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-equipment/alerts"] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return apiRequest("PATCH", `/api/smart-equipment/alerts/${alertId}`, { action: "resolve" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-equipment/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/smart-equipment"] });
    },
  });

  const filteredAlerts = alerts.filter((alert) => {
    if (severityFilter && alert.severity !== severityFilter) return false;
    return true;
  });

  const criticalCount = alerts.filter(a => a.severity === "critical").length;
  const highCount = alerts.filter(a => a.severity === "high").length;

  const renderAlert = useCallback(({ item }: { item: EquipmentAlert }) => (
    <SwipeableAlertCard
      alert={item}
      theme={theme}
      onAcknowledge={() => acknowledgeMutation.mutate(item.id)}
      onResolve={() => resolveMutation.mutate(item.id)}
      onPress={() => navigation.navigate("EquipmentDetail", { equipmentId: item.equipmentId })}
    />
  ), [theme, acknowledgeMutation, resolveMutation, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Text style={[styles.title, { color: theme.text }]}>Fleet Alerts</Text>
        
        <View style={styles.statsRow}>
          {criticalCount > 0 ? (
            <View style={[styles.statBadge, { backgroundColor: `${Colors.error}20` }]}>
              <View style={[styles.statDot, { backgroundColor: Colors.error }]} />
              <Text style={[styles.statText, { color: Colors.error }]}>{criticalCount} Critical</Text>
            </View>
          ) : null}
          {highCount > 0 ? (
            <View style={[styles.statBadge, { backgroundColor: `${Colors.warning}20` }]}>
              <View style={[styles.statDot, { backgroundColor: Colors.warning }]} />
              <Text style={[styles.statText, { color: Colors.warning }]}>{highCount} High</Text>
            </View>
          ) : null}
        </View>

        <FlatList
          horizontal
          data={severityFilters}
          keyExtractor={(item) => item.id || "all"}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.filterChip,
                { backgroundColor: severityFilter === item.id ? (item.id ? getSeverityColor(item.id) : Colors.primary) : theme.backgroundDefault },
              ]}
              onPress={() => setSeverityFilter(item.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: severityFilter === item.id ? "#fff" : theme.text },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />

        <Text style={[styles.swipeHint, { color: theme.textSecondary }]}>
          Swipe left to resolve, right to acknowledge
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredAlerts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAlert}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="check-circle" size={48} color={Colors.success} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>All Clear!</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No active alerts at this time
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  title: {
    ...Typography.h1,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: "600",
  },
  filterList: {
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  swipeHint: {
    fontSize: 12,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  swipeContainer: {
    marginBottom: Spacing.md,
  },
  swipeActions: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  swipeActionLeft: {
    width: 100,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  swipeActionRight: {
    width: 100,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  swipeActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  alertCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  severityIndicator: {
    width: 4,
  },
  alertContent: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  alertHeader: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  alertInfo: {
    flex: 1,
  },
  equipmentName: {
    ...Typography.body,
    fontWeight: "600",
  },
  alertMessage: {
    ...Typography.small,
    marginTop: 2,
  },
  alertFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
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
  acknowledgedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  acknowledgedText: {
    fontSize: 10,
    fontWeight: "600",
  },
  alertTime: {
    ...Typography.small,
    marginLeft: "auto",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h2,
  },
  emptyText: {
    ...Typography.body,
  },
});
