import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { api, CrewMessage } from "@/lib/api";

type RouteParams = {
  MessageDetail: { messageId: string };
};

const mockMessages: CrewMessage[] = [
  {
    id: "msg-1",
    subject: "Safety Equipment Delivery Delayed",
    content: "The safety harnesses ordered for the Downtown Tower project have been delayed by 2 days. Please use existing equipment and check certifications. New delivery ETA is Thursday.\n\nPlease ensure all team members are informed and verify that current equipment meets safety standards before use. If any equipment is found to be expired or damaged, please report it immediately to the safety department.",
    senderName: "Mike Rodriguez",
    senderRole: "Safety Manager",
    receivedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: "unread",
    priority: "high",
    sentiment: "negative",
    category: "safety",
    projectName: "Downtown Tower",
    aiSummary: "Safety harness delivery delayed 2 days. Use certified existing equipment. New ETA: Thursday. Verify equipment meets safety standards. Report damaged/expired equipment immediately.",
    timeline: [
      { date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), action: "Message received", by: "System" },
    ],
  },
  {
    id: "msg-2",
    subject: "Great work on Phase 2 completion!",
    content: "Congratulations team! We finished Phase 2 of the Harbor Bridge project ahead of schedule. The client is very impressed with the quality of work. Keep up the excellent effort!\n\nSpecial recognition goes to the welding team for their exceptional precision and the safety team for maintaining zero incidents throughout the phase.",
    senderName: "Sarah Chen",
    senderRole: "Project Manager",
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: "read",
    priority: "low",
    sentiment: "positive",
    category: "general",
    projectName: "Harbor Bridge Repair",
    aiSummary: "Team congratulated for completing Phase 2 ahead of schedule. Client impressed with quality. Special recognition: welding team (precision) and safety team (zero incidents).",
    timeline: [
      { date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), action: "Message received", by: "System" },
      { date: new Date(Date.now() - 1000 * 60 * 60).toISOString(), action: "Message read", by: "Alex Johnson" },
    ],
  },
  {
    id: "msg-3",
    subject: "Schedule Change: Tomorrow's Start Time",
    content: "Due to concrete delivery timing, tomorrow's shift will start at 6:00 AM instead of 7:00 AM. This applies to all crew members on the City Mall Renovation project. Please confirm receipt.\n\nBreakfast will be provided on-site. Please plan your commute accordingly.",
    senderName: "Carlos Martinez",
    senderRole: "Foreman",
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    status: "replied",
    priority: "medium",
    sentiment: "neutral",
    category: "schedule",
    projectName: "City Mall Renovation",
    aiSummary: "Tomorrow's shift starts 6 AM (1 hour early) for City Mall project due to concrete delivery. Breakfast provided on-site.",
    timeline: [
      { date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), action: "Message received", by: "System" },
      { date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), action: "Message read", by: "Alex Johnson" },
      { date: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString(), action: "Replied: Confirmed, will be there", by: "Alex Johnson" },
    ],
  },
  {
    id: "msg-4",
    subject: "Equipment Request Approved",
    content: "Your request for additional power tools has been approved. The equipment will be available at the main site storage tomorrow morning. Please sign out the tools when you pick them up.\n\nItems approved:\n- 2x Cordless Drills\n- 1x Circular Saw\n- 1x Angle Grinder\n\nReturn deadline: End of project phase.",
    senderName: "Equipment Depot",
    senderRole: "System",
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: "resolved",
    priority: "low",
    sentiment: "positive",
    category: "equipment",
    projectName: "Residential Complex",
    aiSummary: "Power tools request approved: 2 cordless drills, 1 circular saw, 1 angle grinder. Available tomorrow at main site storage. Sign-out required. Return by end of project phase.",
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
    content: "Mandatory safety evacuation drill scheduled for tomorrow at 10:00 AM. All personnel must participate. Assembly point is the main parking lot. Duration: approximately 30 minutes.\n\nProcedure:\n1. Stop all work safely when alarm sounds\n2. Exit via nearest marked exit\n3. Proceed to assembly point\n4. Wait for headcount and all-clear",
    senderName: "Safety Department",
    senderRole: "System",
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: "unread",
    priority: "high",
    sentiment: "neutral",
    category: "urgent",
    aiSummary: "Mandatory evacuation drill tomorrow 10 AM. Assembly: main parking lot. Duration: 30 min. Stop work, exit via nearest exit, wait for all-clear.",
    timeline: [
      { date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), action: "Message received", by: "System" },
    ],
  },
];

const getSentimentIcon = (sentiment: CrewMessage["sentiment"]) => {
  switch (sentiment) {
    case "positive":
      return { name: "smile" as const, color: Colors.success };
    case "negative":
      return { name: "frown" as const, color: Colors.error };
    default:
      return { name: "meh" as const, color: Colors.textSecondary };
  }
};

const getStatusColor = (status: CrewMessage["status"]) => {
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

const getPriorityColor = (priority: CrewMessage["priority"]) => {
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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export default function MessageDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const { isDemoMode } = useAuth();
  const route = useRoute<RouteProp<RouteParams, "MessageDetail">>();
  const { messageId } = route.params;

  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);

  const {
    data: message,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/crew-messages", messageId],
    queryFn: async () => {
      if (isDemoMode) {
        return mockMessages.find((m) => m.id === messageId) || null;
      }
      const response = await api.messages.get(messageId);
      return response.data || mockMessages.find((m) => m.id === messageId) || null;
    },
  });

  useEffect(() => {
    if (message && message.status === "unread" && !isDemoMode) {
      api.messages.markRead(messageId);
      queryClient.invalidateQueries({ queryKey: ["/api/crew-messages"] });
    }
  }, [message, messageId, isDemoMode, queryClient]);

  const replyMutation = useMutation({
    mutationFn: async (content: string) => {
      if (isDemoMode) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { data: { success: true } };
      }
      return api.messages.reply(messageId, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crew-messages"] });
      if (Platform.OS === "web") {
        alert("Reply sent!");
      } else {
        Alert.alert("Reply Sent", "Your reply has been sent successfully");
      }
      setReplyText("");
      setShowReply(false);
    },
    onError: (error: any) => {
      const msg = error?.message || "Failed to send reply";
      if (Platform.OS === "web") {
        alert(msg);
      } else {
        Alert.alert("Error", msg);
      }
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async () => {
      if (isDemoMode) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { data: { success: true } };
      }
      return api.messages.markResolved(messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crew-messages"] });
      if (Platform.OS === "web") {
        alert("Message marked as resolved");
      } else {
        Alert.alert("Resolved", "This message has been marked as resolved");
      }
      navigation.goBack();
    },
    onError: (error: any) => {
      const msg = error?.message || "Failed to resolve message";
      if (Platform.OS === "web") {
        alert(msg);
      } else {
        Alert.alert("Error", msg);
      }
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!message) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText type="body" style={styles.errorText}>
          Message not found
        </ThemedText>
      </View>
    );
  }

  const sentimentIcon = getSentimentIcon(message.sentiment);
  const statusColor = getStatusColor(message.status);
  const priorityColor = getPriorityColor(message.priority);

  const handleReply = () => {
    if (!replyText.trim()) {
      if (Platform.OS === "web") {
        alert("Please enter a reply");
      } else {
        Alert.alert("Empty Reply", "Please enter your reply message");
      }
      return;
    }
    replyMutation.mutate(replyText.trim());
  };

  const handleMarkResolved = () => {
    resolveMutation.mutate();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <Card style={styles.aiSummaryCard}>
          <View style={styles.aiHeader}>
            <Feather name="cpu" size={16} color={Colors.secondary} />
            <ThemedText type="h4" style={{ color: Colors.secondary }}>
              AI Summary
            </ThemedText>
          </View>
          <ThemedText type="body" style={styles.aiSummaryText}>
            {message.aiSummary || "No AI summary available."}
          </ThemedText>
        </Card>

        <Card>
          <View style={styles.messageHeader}>
            <View style={styles.senderRow}>
              <View style={styles.avatar}>
                <ThemedText type="h3" style={styles.avatarText}>
                  {message.senderName.charAt(0)}
                </ThemedText>
              </View>
              <View style={styles.senderInfo}>
                <ThemedText type="h4">{message.senderName}</ThemedText>
                <ThemedText type="caption" style={styles.senderRole}>
                  {message.senderRole}
                </ThemedText>
              </View>
              <Feather
                name={sentimentIcon.name}
                size={24}
                color={sentimentIcon.color}
              />
            </View>

            <ThemedText type="h3" style={styles.subject}>
              {message.subject}
            </ThemedText>

            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: statusColor + "20" }]}>
                <ThemedText
                  type="caption"
                  style={[styles.badgeText, { color: statusColor }]}
                >
                  {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                </ThemedText>
              </View>
              <View style={[styles.badge, { backgroundColor: priorityColor + "20" }]}>
                <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                <ThemedText
                  type="caption"
                  style={[styles.badgeText, { color: priorityColor }]}
                >
                  {message.priority.charAt(0).toUpperCase() + message.priority.slice(1)} Priority
                </ThemedText>
              </View>
              {message.projectName ? (
                <View style={[styles.badge, { backgroundColor: Colors.secondary + "20" }]}>
                  <Feather name="briefcase" size={10} color={Colors.secondary} />
                  <ThemedText
                    type="caption"
                    style={[styles.badgeText, { color: Colors.secondary }]}
                  >
                    {message.projectName}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.divider} />

          <ThemedText type="body" style={styles.messageContent}>
            {message.content}
          </ThemedText>

          <ThemedText type="caption" style={styles.receivedAt}>
            Received: {formatDate(message.receivedAt)}
          </ThemedText>
        </Card>

        {message.timeline && message.timeline.length > 0 ? (
          <Card>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Status Timeline
            </ThemedText>
            <View style={styles.timeline}>
              {message.timeline.map((event, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  {index < message.timeline!.length - 1 ? (
                    <View style={styles.timelineLine} />
                  ) : null}
                  <View style={styles.timelineContent}>
                    <ThemedText type="small" style={styles.timelineAction}>
                      {event.action}
                    </ThemedText>
                    <ThemedText type="caption" style={styles.timelineMeta}>
                      {event.by} - {formatDate(event.date)}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {message.resolutionNotes ? (
          <Card>
            <View style={styles.resolutionHeader}>
              <Feather name="check-circle" size={20} color={Colors.success} />
              <ThemedText type="h4" style={{ color: Colors.success }}>
                Resolution Notes
              </ThemedText>
            </View>
            <ThemedText type="body" style={styles.resolutionText}>
              {message.resolutionNotes}
            </ThemedText>
          </Card>
        ) : null}

        {showReply ? (
          <Card>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Reply
            </ThemedText>
            <TextInput
              style={[
                styles.replyInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                },
              ]}
              placeholder="Type your reply..."
              placeholderTextColor={theme.textSecondary}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              testID="input-reply"
            />
            <View style={styles.replyActions}>
              <Pressable
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowReply(false)}
              >
                <ThemedText type="small">Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.sendReplyButton]}
                onPress={handleReply}
                disabled={replyMutation.isPending}
                testID="button-send-reply"
              >
                <Feather name="send" size={16} color="#FFFFFF" />
                <ThemedText type="small" style={{ color: "#FFFFFF" }}>
                  {replyMutation.isPending ? "Sending..." : "Send Reply"}
                </ThemedText>
              </Pressable>
            </View>
          </Card>
        ) : null}

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => setShowReply(true)}
            testID="button-reply"
          >
            <Feather name="corner-up-left" size={18} color={theme.text} />
            <ThemedText type="small">Reply</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.resolveButton]}
            onPress={handleMarkResolved}
            disabled={resolveMutation.isPending}
            testID="button-resolve"
          >
            <Feather name="check-circle" size={18} color="#FFFFFF" />
            <ThemedText type="small" style={{ color: "#FFFFFF" }}>
              {resolveMutation.isPending ? "Resolving..." : "Mark Resolved"}
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
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
    gap: Spacing.md,
  },
  errorText: {
    textAlign: "center",
    marginTop: Spacing.xl,
    opacity: 0.6,
  },
  aiSummaryCard: {
    backgroundColor: Colors.secondary + "10",
    borderColor: Colors.secondary + "30",
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  aiSummaryText: {
    lineHeight: 22,
  },
  messageHeader: {
    marginBottom: Spacing.md,
  },
  senderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  senderInfo: {
    flex: 1,
  },
  senderRole: {
    opacity: 0.6,
  },
  subject: {
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
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  messageContent: {
    lineHeight: 24,
  },
  receivedAt: {
    marginTop: Spacing.md,
    opacity: 0.6,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  timeline: {
    paddingLeft: Spacing.xs,
  },
  timelineItem: {
    flexDirection: "row",
    paddingLeft: Spacing.md,
    marginBottom: Spacing.md,
    position: "relative",
  },
  timelineDot: {
    position: "absolute",
    left: 0,
    top: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  timelineLine: {
    position: "absolute",
    left: 4,
    top: 14,
    width: 2,
    height: "100%",
    backgroundColor: Colors.border,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: Spacing.sm,
  },
  timelineAction: {
    fontWeight: "500",
  },
  timelineMeta: {
    opacity: 0.6,
    marginTop: 2,
  },
  resolutionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  resolutionText: {
    lineHeight: 22,
  },
  replyInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    fontSize: 16,
    minHeight: 100,
  },
  replyActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendReplyButton: {
    backgroundColor: Colors.primary,
  },
  resolveButton: {
    backgroundColor: Colors.success,
  },
});
