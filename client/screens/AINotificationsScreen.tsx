import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";

interface ReplacementRequest {
  id: string;
  type: "replacement" | "shift_swap" | "overtime";
  title: string;
  description: string;
  project: string;
  date: string;
  time: string;
  duration: number;
  xpBonus: number;
  status: "pending" | "accepted" | "declined";
  urgency: "normal" | "urgent";
  originalWorker?: string;
  aiReason: string;
  createdAt: string;
}

const mockRequests: ReplacementRequest[] = [
  {
    id: "1",
    type: "replacement",
    title: "Electrician Needed",
    description: "Replace Mike Chen who called in sick. Need someone certified for panel work.",
    project: "Downtown Tower - Floor 12",
    date: new Date().toISOString(),
    time: "7:00 AM - 3:30 PM",
    duration: 8.5,
    xpBonus: 150,
    status: "pending",
    urgency: "urgent",
    originalWorker: "Mike Chen",
    aiReason: "You were selected because you have electrical certification and are available today. You're also in the top 10% for task completion rate.",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "2",
    type: "shift_swap",
    title: "Shift Swap Request",
    description: "Sarah Williams is requesting to swap shifts for a doctor's appointment.",
    project: "Harbor Bridge Repair",
    date: new Date(Date.now() + 86400000).toISOString(),
    time: "6:00 AM - 2:30 PM",
    duration: 8.5,
    xpBonus: 50,
    status: "pending",
    urgency: "normal",
    originalWorker: "Sarah Williams",
    aiReason: "This swap aligns with your availability and doesn't conflict with your current schedule.",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "3",
    type: "overtime",
    title: "Overtime Opportunity",
    description: "Extra hands needed for weekend concrete pour. Double XP bonus!",
    project: "City Mall Renovation",
    date: new Date(Date.now() + 172800000).toISOString(),
    time: "7:00 AM - 5:00 PM",
    duration: 10,
    xpBonus: 300,
    status: "pending",
    urgency: "normal",
    aiReason: "Based on your skill set and weekend availability, you're an ideal candidate for this overtime shift.",
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "4",
    type: "replacement",
    title: "HVAC Technician Coverage",
    description: "Cover for David Martinez who has a family emergency.",
    project: "Office Park Phase 2",
    date: new Date(Date.now() - 86400000).toISOString(),
    time: "7:00 AM - 3:30 PM",
    duration: 8.5,
    xpBonus: 100,
    status: "accepted",
    urgency: "urgent",
    originalWorker: "David Martinez",
    aiReason: "You were matched due to your HVAC skills and proximity to the job site.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function AINotificationsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { isDemoMode } = useAuth();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<Record<string, string>>({});

  const { data: requests = mockRequests, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/ai-notifications"],
    queryFn: async () => mockRequests,
    enabled: isDemoMode,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, action, message }: { id: string; action: "accept" | "decline"; message?: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-notifications"] });
    },
  });

  const handleResponse = (id: string, action: "accept" | "decline") => {
    respondMutation.mutate({ id, action, message: responseText[id] });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(Date.now() + 86400000);
    
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getTypeIcon = (type: string): keyof typeof Feather.glyphMap => {
    switch (type) {
      case "replacement": return "user-plus";
      case "shift_swap": return "refresh-cw";
      case "overtime": return "clock";
      default: return "bell";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "replacement": return Colors.error;
      case "shift_swap": return Colors.primary;
      case "overtime": return Colors.success;
      default: return theme.textSecondary;
    }
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
        }
      >
        {pendingCount > 0 ? (
          <Card style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <View style={[styles.summaryIcon, { backgroundColor: Colors.accent + "20" }]}>
                <Feather name="cpu" size={24} color={Colors.accent} />
              </View>
              <View style={styles.summaryText}>
                <ThemedText type="h4">AI Self-Healing Active</ThemedText>
                <ThemedText style={{ color: theme.textSecondary }}>
                  {pendingCount} request{pendingCount !== 1 ? "s" : ""} awaiting your response
                </ThemedText>
              </View>
            </View>
          </Card>
        ) : null}

        {requests.map((request) => {
          const isExpanded = expandedId === request.id;
          const isPending = request.status === "pending";

          return (
            <Card key={request.id} style={styles.requestCard}>
              <Pressable onPress={() => setExpandedId(isExpanded ? null : request.id)}>
                <View style={styles.requestHeader}>
                  <View style={[styles.typeIcon, { backgroundColor: getTypeColor(request.type) + "20" }]}>
                    <Feather name={getTypeIcon(request.type)} size={20} color={getTypeColor(request.type)} />
                  </View>
                  <View style={styles.requestInfo}>
                    <View style={styles.titleRow}>
                      <ThemedText type="h4" style={styles.requestTitle}>{request.title}</ThemedText>
                      {request.urgency === "urgent" ? (
                        <View style={[styles.urgentBadge, { backgroundColor: Colors.error + "20" }]}>
                          <ThemedText style={[styles.urgentText, { color: Colors.error }]}>Urgent</ThemedText>
                        </View>
                      ) : null}
                    </View>
                    <ThemedText style={[styles.requestTime, { color: theme.textSecondary }]}>
                      {formatTimeAgo(request.createdAt)}
                    </ThemedText>
                  </View>
                  {!isPending ? (
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: request.status === "accepted" ? Colors.success + "20" : Colors.error + "20" }
                    ]}>
                      <ThemedText style={[
                        styles.statusText,
                        { color: request.status === "accepted" ? Colors.success : Colors.error }
                      ]}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </ThemedText>
                    </View>
                  ) : null}
                  <Feather 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={theme.textSecondary} 
                  />
                </View>
              </Pressable>

              {isExpanded ? (
                <View style={styles.expandedContent}>
                  <ThemedText style={styles.description}>{request.description}</ThemedText>
                  
                  <View style={[styles.detailsCard, { backgroundColor: theme.backgroundRoot }]}>
                    <View style={styles.detailRow}>
                      <Feather name="map-pin" size={16} color={theme.textSecondary} />
                      <ThemedText style={styles.detailText}>{request.project}</ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <Feather name="calendar" size={16} color={theme.textSecondary} />
                      <ThemedText style={styles.detailText}>{formatDate(request.date)}</ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <Feather name="clock" size={16} color={theme.textSecondary} />
                      <ThemedText style={styles.detailText}>{request.time}</ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <Feather name="zap" size={16} color={Colors.xpGold} />
                      <ThemedText style={[styles.detailText, { color: Colors.xpGold }]}>
                        +{request.xpBonus} XP Bonus
                      </ThemedText>
                    </View>
                  </View>

                  <View style={[styles.aiReason, { backgroundColor: Colors.primary + "10" }]}>
                    <View style={styles.aiHeader}>
                      <Feather name="cpu" size={14} color={Colors.primary} />
                      <ThemedText style={[styles.aiLabel, { color: Colors.primary }]}>AI Recommendation</ThemedText>
                    </View>
                    <ThemedText style={[styles.aiText, { color: theme.textSecondary }]}>
                      {request.aiReason}
                    </ThemedText>
                  </View>

                  {isPending ? (
                    <>
                      <TextInput
                        style={[
                          styles.responseInput,
                          { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.border }
                        ]}
                        placeholder="Add a note (optional)"
                        placeholderTextColor={theme.textSecondary}
                        value={responseText[request.id] || ""}
                        onChangeText={(text) => setResponseText(prev => ({ ...prev, [request.id]: text }))}
                        multiline
                      />
                      <View style={styles.actionButtons}>
                        <Pressable
                          style={[styles.declineButton, { borderColor: Colors.error }]}
                          onPress={() => handleResponse(request.id, "decline")}
                          disabled={respondMutation.isPending}
                        >
                          <Feather name="x" size={18} color={Colors.error} />
                          <ThemedText style={[styles.declineText, { color: Colors.error }]}>Decline</ThemedText>
                        </Pressable>
                        <Pressable
                          style={[styles.acceptButton, { backgroundColor: Colors.success }]}
                          onPress={() => handleResponse(request.id, "accept")}
                          disabled={respondMutation.isPending}
                        >
                          <Feather name="check" size={18} color="#fff" />
                          <ThemedText style={styles.acceptText}>Accept</ThemedText>
                        </Pressable>
                      </View>
                    </>
                  ) : null}
                </View>
              ) : null}
            </Card>
          );
        })}

        {requests.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Feather name="inbox" size={48} color={theme.textSecondary} />
            <ThemedText type="h4" style={styles.emptyTitle}>No Notifications</ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              AI will notify you when replacement opportunities are available
            </ThemedText>
          </Card>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryText: {
    flex: 1,
  },
  requestCard: {
    marginBottom: Spacing.md,
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  requestInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  requestTitle: {
    flex: 1,
  },
  urgentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  urgentText: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
  },
  requestTime: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
  },
  expandedContent: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  description: {
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  detailsCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: FontSizes.sm,
  },
  aiReason: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  aiLabel: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
  },
  aiText: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  responseInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    minHeight: 60,
    marginBottom: Spacing.md,
    textAlignVertical: "top",
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  declineButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  declineText: {
    fontWeight: "600",
  },
  acceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  acceptText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
  },
  emptyTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    textAlign: "center",
  },
});
