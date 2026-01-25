import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
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
import { DispatchRecommendation } from "@/stores/useSmartEquipmentStore";

type SmartEquipmentStackParamList = {
  EquipmentDetail: { equipmentId: number };
};

function getHealthColor(score: number): string {
  if (score >= 80) return Colors.success;
  if (score >= 50) return Colors.warning;
  return Colors.error;
}

function getScoreColor(score: number): string {
  if (score >= 80) return Colors.success;
  if (score >= 60) return Colors.primary;
  if (score >= 40) return Colors.warning;
  return Colors.error;
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

export default function AIDispatchScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<SmartEquipmentStackParamList>>();

  const { data: recommendations = [], isLoading, refetch, isRefetching } = useQuery<DispatchRecommendation[]>({
    queryKey: ["/api/smart-equipment/ai-dispatch"],
  });

  const renderRecommendation = useCallback(({ item, index }: { item: DispatchRecommendation; index: number }) => (
    <Pressable
      style={[styles.recommendationCard, { backgroundColor: theme.backgroundDefault }]}
      onPress={() => navigation.navigate("EquipmentDetail", { equipmentId: item.equipment.id })}
      testID={`dispatch-card-${item.equipment.id}`}
    >
      {item.isTopPick ? (
        <View style={styles.topPickBadge}>
          <Feather name="star" size={12} color="#fff" />
          <Text style={styles.topPickText}>Top Pick</Text>
        </View>
      ) : null}

      <View style={styles.cardHeader}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>
        <View style={[styles.categoryIcon, { backgroundColor: `${Colors.primary}20` }]}>
          <Feather name={getCategoryIcon(item.equipment.category)} size={24} color={Colors.primary} />
        </View>
        <View style={styles.equipmentInfo}>
          <Text style={[styles.equipmentName, { color: theme.text }]}>{item.equipment.name}</Text>
          <Text style={[styles.equipmentModel, { color: theme.textSecondary }]}>{item.equipment.model}</Text>
        </View>
      </View>

      <View style={styles.scoreSection}>
        <View style={styles.dispatchScore}>
          <View style={[styles.scoreCircle, { borderColor: getScoreColor(item.dispatchScore) }]}>
            <Text style={[styles.scoreValue, { color: getScoreColor(item.dispatchScore) }]}>
              {item.dispatchScore}
            </Text>
          </View>
          <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>Dispatch Score</Text>
        </View>

        <View style={styles.statsColumn}>
          <View style={styles.statRow}>
            <Feather name="heart" size={14} color={getHealthColor(item.healthPercent)} />
            <Text style={[styles.statValue, { color: theme.text }]}>{item.healthPercent}%</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Health</Text>
          </View>
          <View style={styles.statRow}>
            <Feather name="droplet" size={14} color={item.fuelPercent < 30 ? Colors.error : Colors.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>{item.fuelPercent}%</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Fuel</Text>
          </View>
        </View>
      </View>

      {item.reasons.length > 0 ? (
        <View style={styles.reasonsSection}>
          <Text style={[styles.reasonsTitle, { color: theme.textSecondary }]}>AI Recommendation</Text>
          <View style={styles.reasonsList}>
            {item.reasons.slice(0, 3).map((reason, i) => (
              <View key={i} style={styles.reasonItem}>
                <Feather name="check-circle" size={12} color={Colors.success} />
                <Text style={[styles.reasonText, { color: theme.text }]}>{reason}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <Text style={[styles.viewDetails, { color: Colors.primary }]}>View Details</Text>
        <Feather name="chevron-right" size={16} color={Colors.primary} />
      </View>
    </Pressable>
  ), [theme, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.titleRow}>
          <View style={[styles.aiIcon, { backgroundColor: `${Colors.primary}20` }]}>
            <Feather name="cpu" size={24} color={Colors.primary} />
          </View>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>AI Dispatch</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Smart equipment recommendations
            </Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="info" size={16} color={Colors.primary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            AI analyzes equipment health, fuel levels, alert status, and engine hours to recommend the best equipment for dispatch.
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Analyzing fleet data...
          </Text>
        </View>
      ) : (
        <FlatList
          data={recommendations}
          keyExtractor={(item) => item.equipment.id.toString()}
          renderItem={renderRecommendation}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="alert-circle" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No equipment available for dispatch
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
    alignItems: "center",
    gap: Spacing.md,
  },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...Typography.h1,
  },
  subtitle: {
    ...Typography.body,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    ...Typography.small,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  recommendationCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topPickBadge: {
    position: "absolute",
    top: -8,
    right: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.xpGold,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
    zIndex: 1,
  },
  topPickText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentName: {
    ...Typography.h3,
  },
  equipmentModel: {
    ...Typography.small,
  },
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xl,
  },
  dispatchScore: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  scoreLabel: {
    fontSize: 11,
  },
  statsColumn: {
    flex: 1,
    gap: Spacing.sm,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 40,
  },
  statLabel: {
    ...Typography.small,
  },
  reasonsSection: {
    gap: Spacing.sm,
  },
  reasonsTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reasonsList: {
    gap: 6,
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  reasonText: {
    ...Typography.small,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  viewDetails: {
    fontSize: 14,
    fontWeight: "600",
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
