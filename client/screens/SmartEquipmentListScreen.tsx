import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useSmartEquipmentStore, SmartEquipment } from "@/stores/useSmartEquipmentStore";

type SmartEquipmentStackParamList = {
  SmartEquipmentList: undefined;
  EquipmentDetail: { equipmentId: number };
  FleetAlerts: undefined;
  AIDispatch: undefined;
};

const categories = [
  { id: null, label: "All" },
  { id: "excavator", label: "Excavators" },
  { id: "bulldozer", label: "Bulldozers" },
  { id: "crane", label: "Cranes" },
  { id: "wheel_loader", label: "Loaders" },
  { id: "dump_truck", label: "Trucks" },
  { id: "mixer", label: "Mixers" },
];

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

function getCategoryIcon(category: string): keyof typeof Feather.glyphMap {
  switch (category) {
    case "excavator": return "truck";
    case "bulldozer": return "square";
    case "crane": return "arrow-up";
    case "wheel_loader": return "loader";
    case "dump_truck": return "truck";
    case "mixer": return "refresh-cw";
    default: return "tool";
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

export default function SmartEquipmentListScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<SmartEquipmentStackParamList>>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: equipment = [], isLoading, refetch, isRefetching } = useQuery<SmartEquipment[]>({
    queryKey: ["/api/smart-equipment"],
  });

  const { data: fleetHealth } = useQuery({
    queryKey: ["/api/smart-equipment/fleet-health"],
  });

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderEquipmentCard = useCallback(({ item }: { item: SmartEquipment }) => (
    <Pressable
      style={[styles.equipmentCard, { backgroundColor: theme.backgroundDefault }]}
      onPress={() => navigation.navigate("EquipmentDetail", { equipmentId: item.id })}
      testID={`equipment-card-${item.id}`}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: `${Colors.primary}20` }]}>
          <Feather name={getCategoryIcon(item.category)} size={20} color={Colors.primary} />
        </View>
        <View style={styles.cardTitleArea}>
          <Text style={[styles.equipmentName, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.equipmentModel, { color: theme.textSecondary }]}>{item.model}</Text>
        </View>
        {item.activeAlertCount > 0 ? (
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>{item.activeAlertCount}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardStats}>
        <View style={styles.healthScoreContainer}>
          <View style={[styles.healthScoreBadge, { backgroundColor: `${getHealthColor(item.healthScore)}20` }]}>
            <View style={[styles.healthDot, { backgroundColor: getHealthColor(item.healthScore) }]} />
            <Text style={[styles.healthScoreText, { color: getHealthColor(item.healthScore) }]}>
              {item.healthScore}%
            </Text>
          </View>
          <Text style={[styles.healthLabel, { color: theme.textSecondary }]}>
            {getHealthLabel(item.healthScore)}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Feather name="droplet" size={14} color={item.telemetry.fuelLevel < 30 ? Colors.error : Colors.primary} />
          <Text style={[styles.statValue, { color: theme.text }]}>{item.telemetry.fuelLevel}%</Text>
        </View>

        <View style={styles.statItem}>
          <Feather name="clock" size={14} color={theme.textSecondary} />
          <Text style={[styles.statValue, { color: theme.text }]}>{item.telemetry.engineHours.toLocaleString()}h</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
        <Text style={[styles.lastUpdate, { color: theme.textSecondary }]}>
          Updated {formatTimeAgo(item.telemetry.lastUpdated)}
        </Text>
      </View>
    </Pressable>
  ), [theme, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]}>Smart Equipment</Text>
          <View style={styles.headerButtons}>
            <Pressable 
              style={[styles.headerButton, { backgroundColor: theme.backgroundDefault }]}
              onPress={() => navigation.navigate("FleetAlerts")}
              testID="alerts-button"
            >
              <Feather name="bell" size={20} color={Colors.primary} />
              {(fleetHealth as any)?.activeAlerts > 0 ? (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{(fleetHealth as any)?.activeAlerts}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable 
              style={[styles.headerButton, { backgroundColor: theme.backgroundDefault }]}
              onPress={() => navigation.navigate("AIDispatch")}
              testID="dispatch-button"
            >
              <Feather name="cpu" size={20} color={Colors.primary} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search equipment..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="search-input"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.id || "all"}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.categoryChip,
                { backgroundColor: selectedCategory === item.id ? Colors.primary : theme.backgroundDefault },
              ]}
              onPress={() => setSelectedCategory(item.id)}
              testID={`category-${item.id || "all"}`}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  { color: selectedCategory === item.id ? "#fff" : theme.text },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredEquipment}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderEquipmentCard}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="tool" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No equipment found
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
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    ...Typography.h1,
  },
  headerButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  headerBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  categoryList: {
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
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
  equipmentCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitleArea: {
    flex: 1,
  },
  equipmentName: {
    ...Typography.h3,
  },
  equipmentModel: {
    ...Typography.small,
  },
  alertBadge: {
    backgroundColor: Colors.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  alertBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  cardStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  healthScoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  healthScoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthScoreText: {
    fontSize: 14,
    fontWeight: "600",
  },
  healthLabel: {
    fontSize: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  lastUpdate: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
  },
});
