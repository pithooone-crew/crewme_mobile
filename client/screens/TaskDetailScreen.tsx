import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Image,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { api, Task } from "@/lib/api";
import { mockTasks } from "@/lib/mockData";
import { TasksStackParamList } from "@/navigation/TasksStackNavigator";

type TaskDetailRouteProp = RouteProp<TasksStackParamList, "TaskDetail">;

const priorityLabels: Record<string, { label: string; color: string }> = {
  low: { label: "Low Priority", color: Colors.success },
  medium: { label: "Medium Priority", color: Colors.warning },
  high: { label: "High Priority", color: Colors.primary },
  urgent: { label: "Urgent", color: Colors.error },
};

const statusLabels: Record<string, { label: string; icon: string }> = {
  pending: { label: "Pending", icon: "clock" },
  in_progress: { label: "In Progress", icon: "play-circle" },
  completed: { label: "Completed", icon: "check-circle" },
};

export default function TaskDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const route = useRoute<TaskDetailRouteProp>();
  const { theme } = useTheme();
  const { isDemoMode } = useAuth();
  const queryClient = useQueryClient();
  const { taskId } = route.params;
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();

  const { data: task, isLoading } = useQuery({
    queryKey: ["/api/tasks", taskId],
    queryFn: async () => {
      if (isDemoMode) {
        return mockTasks.find((t) => t.id === taskId) || mockTasks[0];
      }
      const response = await api.tasks.get(taskId);
      return response.data || mockTasks.find((t) => t.id === taskId);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (isDemoMode) {
        setLocalStatus(newStatus);
        return { status: newStatus };
      }
      const response = await api.tasks.updateStatus(taskId, newStatus);
      return response.data;
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handleStatusUpdate = (newStatus: string) => {
    updateStatusMutation.mutate(newStatus);
  };

  const takePhoto = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhoto = result.assets[0].uri;
      setPhotos([...photos, newPhoto]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newPhotos = result.assets.map((asset) => asset.uri);
      setPhotos([...photos, ...newPhotos]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  if (isLoading || !task) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const currentStatus = localStatus || task.status;
  const priority = priorityLabels[task.priority] || priorityLabels.medium;
  const status = statusLabels[currentStatus] || statusLabels.pending;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <View style={[styles.priorityBadge, { backgroundColor: priority.color + "20" }]}>
        <View style={[styles.priorityDot, { backgroundColor: priority.color }]} />
        <ThemedText style={[styles.priorityText, { color: priority.color }]}>
          {priority.label}
        </ThemedText>
      </View>

      <ThemedText type="h1" style={styles.title}>
        {task.title}
      </ThemedText>

      <View style={styles.projectRow}>
        <Feather name="folder" size={16} color={theme.textSecondary} />
        <ThemedText style={{ color: theme.textSecondary }}>
          {task.projectName}
        </ThemedText>
      </View>

      <Card style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.statusInfo}>
            <Feather
              name={status.icon as any}
              size={24}
              color={currentStatus === "completed" ? Colors.success : Colors.primary}
            />
            <View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Status
              </ThemedText>
              <ThemedText type="h4">{status.label}</ThemedText>
            </View>
          </View>
          <View style={styles.xpReward}>
            <Feather name="zap" size={20} color={Colors.xpGold} />
            <ThemedText style={styles.xpText}>+{task.xpReward} XP</ThemedText>
          </View>
        </View>
      </Card>

      <Card style={styles.detailsCard}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Description
        </ThemedText>
        <ThemedText style={{ color: theme.textSecondary }}>
          {task.description}
        </ThemedText>
      </Card>

      {task.scheduledDate ? (
        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Feather name="calendar" size={20} color={Colors.primary} />
            <View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Scheduled Date
              </ThemedText>
              <ThemedText type="h4">
                {new Date(task.scheduledDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </ThemedText>
            </View>
          </View>
        </Card>
      ) : null}

      {task.location ? (
        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Feather name="map-pin" size={20} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Location
              </ThemedText>
              <ThemedText type="h4">{task.location.address}</ThemedText>
            </View>
          </View>
        </Card>
      ) : null}

      {task.skillRequirements.length > 0 ? (
        <Card style={styles.detailsCard}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Skills Required
          </ThemedText>
          <View style={styles.skillsContainer}>
            {task.skillRequirements.map((skill, index) => (
              <View
                key={index}
                style={[styles.skillBadge, { backgroundColor: Colors.secondary + "15" }]}
              >
                <ThemedText style={{ color: Colors.secondary, fontSize: 13 }}>
                  {skill}
                </ThemedText>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <Card style={styles.detailsCard}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Photos ({task.photos.length + photos.length})
        </ThemedText>
        
        {photos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <Pressable style={styles.removePhotoButton} onPress={() => removePhoto(index)}>
                  <Feather name="x" size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : task.photos.length > 0 ? (
          <View style={styles.photosPlaceholder}>
            <Feather name="image" size={32} color={theme.textSecondary} />
            <ThemedText style={{ color: theme.textSecondary }}>
              {task.photos.length} photo(s) attached
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.photoActions}>
          <Pressable style={styles.photoButton} onPress={takePhoto}>
            <Feather name="camera" size={20} color={Colors.primary} />
            <ThemedText style={styles.photoButtonText}>Take Photo</ThemedText>
          </Pressable>
          <Pressable style={styles.photoButton} onPress={pickImage}>
            <Feather name="image" size={20} color={Colors.primary} />
            <ThemedText style={styles.photoButtonText}>Gallery</ThemedText>
          </Pressable>
        </View>
      </Card>

      <View style={styles.actionsContainer}>
        {currentStatus === "pending" ? (
          <Button
            onPress={() => handleStatusUpdate("in_progress")}
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              "Start Task"
            )}
          </Button>
        ) : null}

        {currentStatus === "in_progress" ? (
          <Button
            onPress={() => handleStatusUpdate("completed")}
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              "Mark Complete"
            )}
          </Button>
        ) : null}

        {currentStatus === "completed" ? (
          <View style={styles.completedBanner}>
            <Feather name="check-circle" size={24} color={Colors.success} />
            <ThemedText style={{ color: Colors.success, fontWeight: "600" }}>
              Task Completed
            </ThemedText>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 13,
    fontWeight: "600",
  },
  title: {
    marginBottom: Spacing.sm,
  },
  projectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statusCard: {
    marginBottom: Spacing.lg,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  xpReward: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  xpText: {
    color: Colors.xpGold,
    fontWeight: "700",
    fontSize: 16,
  },
  detailsCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  skillBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  photosPlaceholder: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  photosScroll: {
    marginBottom: Spacing.md,
  },
  photoContainer: {
    marginRight: Spacing.sm,
    position: "relative",
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.sm,
  },
  removePhotoButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  photoActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  photoButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary + "15",
    borderRadius: BorderRadius.sm,
  },
  photoButtonText: {
    color: Colors.primary,
    fontWeight: "600",
  },
  actionsContainer: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  completedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.success + "15",
    borderRadius: BorderRadius.xs,
  },
});
