import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/Card";
import { FilterChips } from "@/components/FilterChips";
import { EmptyState } from "@/components/EmptyState";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

export type Message = {
  id: string;
  subject: string;
  content: string;
  senderName: string;
  senderRole: string;
  receivedAt: string;
  status: "unread" | "read" | "replied" | "resolved";
  priority: "high" | "medium" | "low";
  sentiment: "positive" | "neutral" | "negative";
  category: "safety" | "schedule" | "equipment" | "general" | "urgent";
  projectName?: string;
  taskId?: string;
  aiSummary?: string;
  timeline?: { date: string; action: string; by: string }[];
  resolutionNotes?: string;
};

const mockMessages: Message[] = [
  {
    id: "msg-1",
    subject: "Safety Equipment Delivery Delayed",
    content: "The safety harnesses ordered for the Downtown Tower project have been delayed by 2 days. Please use existing equipment and check certifications. New delivery ETA is Thursday.",
    senderName: "Mike Rodriguez",
    senderRole: "Safety Manager",
    receivedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: "unread",
    priority: "high",
    sentiment: "negative",
    category: "safety",
    projectName: "Downtown Tower",
    aiSummary: "Safety harness delivery delayed 2 days. Use certified existing equipment. New ETA: Thursday.",
    timeline: [
      { date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), action: "Message received", by: "System" },
    ],
  },
  {
    id: "msg-2",
    subject: "Great work on Phase 2 completion!",
    content: "Congratulations team! We finished Phase 2 of the Harbor Bridge project ahead of schedule. The client is very impressed with the quality of work. Keep up the excellent effort!",
    senderName: "Sarah Chen",
    senderRole: "Project Manager",
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: "read",
    priority: "low",
    sentiment: "positive",
    category: "general",
    projectName: "Harbor Bridge Repair",
    aiSummary: "Team congratulated for completing Phase 2 ahead of schedule. Client impressed with quality.",
    timeline: [
      { date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), action: "Message received", by: "System" },
      { date: new Date(Date.now() - 1000 * 60 * 60).toISOString(), action: "Message read", by: "Alex Johnson" },
    ],
  },
  {
    id: "msg-3",
    subject: "Schedule Change: Tomorrow's Start Time",
    content: "Due to concrete delivery timing, tomorrow's shift will start at 6:00 AM instead of 7:00 AM. This applies to all crew members on the City Mall Renovation project. Please confirm receipt.",
    senderName: "Carlos Martinez",
    senderRole: "Foreman",
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    status: "replied",
    priority: "medium",
    sentiment: "neutral",
    category: "schedule",
    projectName: "City Mall Renovation",
    aiSummary: "Tomorrow's shift starts 6 AM (1 hour early) for City Mall project due to concrete delivery.",
    timeline: [
      { date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), action: "Message received", by: "System" },
      { date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), action: "Message read", by: "Alex Johnson" },
      { date: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString(), action: "Replied: Confirmed, will be there", by: "Alex Johnson" },
    ],
  },
  {
    id: "msg-4",
    subject: "Equipment Request Approved",
    content: "Your request for additional power tools has been approved. The equipment will be available at the main site storage tomorrow morning. Please sign out the tools when you pick them up.",
    senderName: "Equipment Depot",
    senderRole: "System",
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: "resolved",
    priority: "low",
    sentiment: "positive",
    category: "equipment",
    projectName: "Residential Complex",
    aiSummary: "Power tools request approved. Available tomorrow at main site storage. Sign-out required.",
    timeline: [
      { date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), action: "Request submitted", by: "Alex Johnson" },
      { date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), action: "Request approved", by: "System" },
      { date: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), action: "Equipment picked up", by: "Alex Johnson" },
    ],
    resolutionNotes: "Equipment collected and verified. All tools in working condition.",
  },
  {
    id: "msg-5",
    subject: "URGENT: Site Evacuation Drill Tomorrow",
    content: "Mandatory safety evacuation drill scheduled for tomorrow at 10:00 AM. All personnel must participate. Assembly point is the main parking lot. Duration: approximately 30 minutes.",
    senderName: "Safety Department",
    senderRole: "System",
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: "unread",
    priority: "high",
    sentiment: "neutral",
    category: "urgent",
    aiSummary: "Mandatory evacuation drill tomorrow 10 AM. Assembly: main parking lot. Duration: 30 min.",
    timeline: [
      { date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), action: "Message received", by: "System" },
    ],
  },
];

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Read", value: "read" },
  { label: "Replied", value: "replied" },
  { label: "Resolved", value: "resolved" },
];

const priorityFilters = [
  { label: "All", value: "all" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

const getSentimentIcon = (sentiment: Message["sentiment"]) => {
  switch (sentiment) {
    case "positive":
      return { name: "smile" as const, color: Colors.success };
    case "negative":
      return { name: "frown" as const, color: Colors.error };
    default:
      return { name: "meh" as const, color: Colors.textSecondary };
  }
};

const getStatusColor = (status: Message["status"]) => {
  switch (status) {
    case "unread":
      return Colors.primary;
    case "read":
      return Colors.secondary;
    case "replied":
      return Colors.warning;
    case "resolved":
      return Colors.success;
    default:
      return Colors.textSecondary;
  }
};

const getPriorityColor = (priority: Message["priority"]) => {
  switch (priority) {
    case "high":
      return Colors.error;
    case "medium":
      return Colors.warning;
    case "low":
      return Colors.success;
    default:
      return Colors.textSecondary;
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { isDemoMode } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const {
    data: messages,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["/api/messages"],
    queryFn: async () => {
      if (isDemoMode) {
        return mockMessages;
      }
      return mockMessages;
    },
  });

  const handleMessagePress = (messageId: string) => {
    navigation.navigate("MessageDetail" as any, { messageId });
  };

  const handleComposePress = () => {
    navigation.navigate("ComposeMessage" as any);
  };

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const filteredMessages = (messages || []).filter((message: Message) => {
    const matchesStatus = statusFilter === "all" || message.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || message.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  const renderMessage = ({ item }: { item: Message }) => {
    const sentimentIcon = getSentimentIcon(item.sentiment);
    const statusColor = getStatusColor(item.status);
    const priorityColor = getPriorityColor(item.priority);

    return (
      <Card
        style={[
          styles.messageCard,
          item.status === "unread" && styles.unreadCard,
        ]}
        onPress={() => handleMessagePress(item.id)}
      >
        <View style={styles.messageHeader}>
          <View style={styles.senderInfo}>
            <ThemedText type="h4" numberOfLines={1} style={styles.senderName}>
              {item.senderName}
            </ThemedText>
            <ThemedText type="caption" style={styles.timeAgo}>
              {formatTimeAgo(item.receivedAt)}
            </ThemedText>
          </View>
          <Feather
            name={sentimentIcon.name}
            size={20}
            color={sentimentIcon.color}
          />
        </View>

        <ThemedText type="body" numberOfLines={1} style={styles.subject}>
          {item.subject}
        </ThemedText>

        <ThemedText type="small" numberOfLines={2} style={styles.preview}>
          {item.content}
        </ThemedText>

        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: statusColor + "20" }]}>
            <ThemedText
              type="caption"
              style={[styles.badgeText, { color: statusColor }]}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </ThemedText>
          </View>
          <View style={[styles.badge, { backgroundColor: priorityColor + "20" }]}>
            <View
              style={[styles.priorityDot, { backgroundColor: priorityColor }]}
            />
            <ThemedText
              type="caption"
              style={[styles.badgeText, { color: priorityColor }]}
            >
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
            </ThemedText>
          </View>
          {item.projectName ? (
            <View
              style={[
                styles.badge,
                { backgroundColor: Colors.secondary + "20" },
              ]}
            >
              <Feather name="briefcase" size={10} color={Colors.secondary} />
              <ThemedText
                type="caption"
                style={[styles.badgeText, { color: Colors.secondary }]}
                numberOfLines={1}
              >
                {item.projectName}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </Card>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      icon="mail"
      title="No Messages"
      message="You don't have any messages yet"
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={isLoading ? [] : filteredMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl + 70,
          },
          filteredMessages.length === 0 && !isLoading && styles.emptyList,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="caption" style={styles.filterLabel}>
              Status
            </ThemedText>
            <FilterChips
              options={statusFilters}
              selected={statusFilter}
              onSelect={setStatusFilter}
            />
            <ThemedText type="caption" style={[styles.filterLabel, { marginTop: Spacing.md }]}>
              Priority
            </ThemedText>
            <FilterChips
              options={priorityFilters}
              selected={priorityFilter}
              onSelect={setPriorityFilter}
            />
          </View>
        }
        ListEmptyComponent={renderEmpty}
      />

      <Pressable
        style={styles.fab}
        onPress={handleComposePress}
        testID="button-compose"
      >
        <Feather name="edit" size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  emptyList: {
    flexGrow: 1,
  },
  header: {
    marginBottom: Spacing.md,
  },
  filterLabel: {
    marginBottom: Spacing.xs,
    opacity: 0.7,
  },
  messageCard: {
    marginBottom: Spacing.md,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  senderInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  senderName: {
    flex: 1,
  },
  timeAgo: {
    opacity: 0.6,
  },
  subject: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  preview: {
    opacity: 0.7,
    marginBottom: Spacing.md,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  badgeText: {
    fontWeight: "600",
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
