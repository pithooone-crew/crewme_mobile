import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, InAppNotification } from "@/lib/api";
import { mockNotifications } from "@/lib/mockData";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/constants/theme";
import { Card } from "@/components/Card";

const typeIcons: Record<string, { name: keyof typeof Feather.glyphMap; color: string }> = {
  task: { name: "clipboard", color: Colors.primary },
  achievement: { name: "award", color: Colors.accent },
  schedule: { name: "calendar", color: Colors.secondary },
  announcement: { name: "bell", color: "#7B1FA2" },
  weather: { name: "cloud", color: "#0288D1" },
};

export default function NotificationsScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = mockNotifications, refetch } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      try {
        const result = await api.inAppNotifications.list();
        if ("error" in result) return mockNotifications;
        return result;
      } catch {
        return mockNotifications;
      }
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.inAppNotifications.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["/api/notifications"] });
      queryClient.setQueryData(["/api/notifications"], (old: InAppNotification[] | undefined) =>
        old?.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.inAppNotifications.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["/api/notifications"] });
      queryClient.setQueryData(["/api/notifications"], (old: InAppNotification[] | undefined) =>
        old?.map((n) => ({ ...n, isRead: true }))
      );
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + Spacing.md, paddingBottom: insets.bottom + Spacing.xl }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {unreadCount > 0 ? (
          <View style={styles.headerRow}>
            <Text style={styles.unreadCount}>{unreadCount} unread</Text>
            <Pressable onPress={() => markAllReadMutation.mutate()} style={styles.markAllButton}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          </View>
        ) : null}

        {notifications.map((notification) => {
          const icon = typeIcons[notification.type] || { name: "bell", color: Colors.primary };
          return (
            <Pressable
              key={notification.id}
              onPress={() => {
                if (!notification.isRead) {
                  markReadMutation.mutate(notification.id);
                }
              }}
            >
              <Card style={[styles.notificationCard, !notification.isRead && styles.unreadCard]}>
                <View style={styles.notificationRow}>
                  <View style={[styles.iconContainer, { backgroundColor: `${icon.color}20` }]}>
                    <Feather name={icon.name} size={20} color={icon.color} />
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.titleRow}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      <Text style={styles.timeText}>{formatTimeAgo(notification.createdAt)}</Text>
                    </View>
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                      {notification.message}
                    </Text>
                  </View>
                  {!notification.isRead ? <View style={styles.unreadDot} /> : null}
                </View>
              </Card>
            </Pressable>
          );
        })}

        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="bell-off" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>You're all caught up!</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  unreadCount: {
    fontWeight: "600",
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  markAllButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  markAllText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
  },
  notificationCard: {
    marginBottom: Spacing.sm,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  notificationTitle: {
    fontWeight: "700",
    fontSize: FontSizes.md,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  timeText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  notificationMessage: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
  },
  emptyTitle: {
    fontWeight: "700",
    fontSize: FontSizes.lg,
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
