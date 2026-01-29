import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/constants/theme";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { GradientButton } from "@/components/ui";
import { api } from "@/lib/api";
import { getApiUrl } from "@/lib/query-client";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  projectId?: string;
  projectName?: string;
  assignedTo?: string;
  dueDate?: string;
}

interface TaskUpdate {
  id: string;
  taskId: string;
  taskName: string;
  projectName: string;
  status: string;
  notes: string;
  createdAt: string;
  fromVoice: boolean;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "blocked", label: "Blocked" },
];

export default function VoiceTaskScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme, accentColors } = useTheme();
  const { user, isDemoMode } = useAuth();
  const queryClient = useQueryClient();

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [transcribedText, setTranscribedText] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<"high" | "medium" | "low" | null>(null);
  const [aiReasoning, setAiReasoning] = useState("");
  const [parsedUpdate, setParsedUpdate] = useState<{
    taskId: string;
    task: string;
    status: string;
    notes: string;
  } | null>(null);
  const [editableNotes, setEditableNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [recentUpdates, setRecentUpdates] = useState<TaskUpdate[]>([]);

  const pulseScale = useSharedValue(1);
  const waveOpacity = useSharedValue(0);

  const mockTasks: Task[] = [
    { id: "1", title: "Install drywall - Room 204", status: "in_progress", priority: "high", projectName: "Downtown Office Building" },
    { id: "2", title: "Electrical rough-in - Floor 3", status: "pending", priority: "medium", projectName: "Downtown Office Building" },
    { id: "3", title: "Plumbing fixtures - Restrooms", status: "in_progress", priority: "high", projectName: "Riverside Apartments" },
    { id: "4", title: "HVAC ductwork - Floor 2", status: "pending", priority: "low", projectName: "Downtown Office Building" },
    { id: "5", title: "Paint exterior walls", status: "pending", priority: "medium", projectName: "Riverside Apartments" },
  ];

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      if (isDemoMode) {
        return mockTasks;
      }
      const response = await api.tasks.list();
      return response.data || mockTasks;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      if (isDemoMode) {
        return { success: true };
      }
      return api.tasks.updateStatus(taskId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      waveOpacity.value = withRepeat(
        withTiming(0.5, { duration: 1000 }),
        -1,
        true
      );
    } else {
      pulseScale.value = withSpring(1);
      waveOpacity.value = withTiming(0);
    }
  }, [isRecording]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const waveStyle = useAnimatedStyle(() => ({
    opacity: waveOpacity.value,
  }));

  const parseVoiceWithAI = async (transcription: string) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/voice-task/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcription,
          availableTasks: tasks,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to parse voice update");
      }

      return await response.json();
    } catch (error) {
      console.error("AI parsing error:", error);
      return { needsManualSelection: true };
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording and process
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setIsRecording(false);
      setIsProcessing(true);

      // Simulate voice transcription
      setProcessingStep("Transcribing your voice...");
      await new Promise((r) => setTimeout(r, 1500));

      // Mock transcription examples that mention specific tasks/projects
      const mockTranscriptions = [
        "I just finished installing the drywall in room 204. All panels are up and ready for taping tomorrow morning.",
        "Working on the electrical rough-in on floor 3. About 75% complete, need more 12-gauge wire to finish.",
        "The plumbing fixtures in the restrooms are blocked. Waiting for inspection approval before we can continue.",
        "HVAC ductwork on floor 2 is progressing well. Should be done by end of day.",
        "Started painting the exterior walls at Riverside. Weather is good, making great progress.",
      ];

      const randomTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
      setTranscribedText(randomTranscription);

      // Use AI to identify the task
      setProcessingStep("AI identifying task...");
      await new Promise((r) => setTimeout(r, 500));

      const aiResult = await parseVoiceWithAI(randomTranscription);

      if (aiResult.needsManualSelection) {
        // AI couldn't identify the task - ask user to select
        setIsProcessing(false);
        setAiConfidence("low");
        setShowTaskPicker(true);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        Alert.alert(
          "Select Task",
          "I couldn't identify which task you're updating. Please select it from the list.",
          [{ text: "OK" }]
        );
      } else {
        // AI identified the task
        setSelectedTask(aiResult.matchedTask);
        setAiConfidence(aiResult.confidence);
        setAiReasoning(aiResult.reasoning);
        
        const parsed = {
          taskId: aiResult.matchedTask.id,
          task: aiResult.matchedTask.title,
          status: aiResult.suggestedStatus,
          notes: aiResult.extractedNotes,
        };

        setParsedUpdate(parsed);
        setEditableNotes(aiResult.extractedNotes);
        setIsProcessing(false);

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } else {
      // Start recording
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setIsRecording(true);
      setTranscribedText("");
      setParsedUpdate(null);
      setSelectedTask(null);
      setIsEditing(false);
      setAiConfidence(null);
      setAiReasoning("");
    }
  };

  const handleTaskSelectedManually = (task: Task) => {
    setSelectedTask(task);
    setShowTaskPicker(false);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Now parse the transcription with the manually selected task
    if (transcribedText) {
      let detectedStatus = "in_progress";
      const lowerText = transcribedText.toLowerCase();
      if (lowerText.includes("finished") || lowerText.includes("completed") || lowerText.includes("done")) {
        detectedStatus = "completed";
      } else if (lowerText.includes("blocked") || lowerText.includes("waiting") || lowerText.includes("stuck")) {
        detectedStatus = "blocked";
      }

      const parsed = {
        taskId: task.id,
        task: task.title,
        status: detectedStatus,
        notes: transcribedText,
      };

      setParsedUpdate(parsed);
      setEditableNotes(transcribedText);
      setAiConfidence("low");
    }
  };

  const handleConfirmUpdate = async () => {
    if (!parsedUpdate || !selectedTask) return;

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      await updateStatusMutation.mutateAsync({
        taskId: parsedUpdate.taskId,
        status: parsedUpdate.status,
      });

      const newUpdate: TaskUpdate = {
        id: Date.now().toString(),
        taskId: parsedUpdate.taskId,
        taskName: parsedUpdate.task,
        projectName: selectedTask.projectName || "Unknown Project",
        status: parsedUpdate.status,
        notes: editableNotes || parsedUpdate.notes,
        createdAt: new Date().toISOString(),
        fromVoice: true,
      };

      setRecentUpdates((prev) => [newUpdate, ...prev]);
      setTranscribedText("");
      setParsedUpdate(null);
      setEditableNotes("");
      setIsEditing(false);
      setSelectedTask(null);
      setAiConfidence(null);
      setAiReasoning("");

      Alert.alert(
        "Task Updated",
        `"${parsedUpdate.task}" has been updated to ${parsedUpdate.status.replace("_", " ")}.`
      );
    } catch (error) {
      Alert.alert("Error", "Failed to update task. Please try again.");
    }
  };

  const handleEditUpdate = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsEditing(true);
  };

  const handleChangeTask = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowTaskPicker(true);
  };

  const handleStatusChange = (newStatus: string) => {
    if (parsedUpdate) {
      setParsedUpdate({ ...parsedUpdate, status: newStatus });
    }
    setShowStatusPicker(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return Colors.success;
      case "in_progress":
        return accentColors.primary;
      case "blocked":
        return Colors.error;
      default:
        return theme.textSecondary;
    }
  };

  const getConfidenceColor = (confidence: string | null) => {
    switch (confidence) {
      case "high":
        return Colors.success;
      case "medium":
        return Colors.warning;
      case "low":
        return Colors.error;
      default:
        return theme.textSecondary;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    return date.toLocaleDateString();
  };

  const formatStatusLabel = (status: string) => {
    return status.replace("_", " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.md, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.voiceCard}>
          <View style={styles.voiceHeader}>
            <Feather name="mic" size={24} color={accentColors.primary} />
            <ThemedText style={styles.voiceTitle}>Voice-to-Task</ThemedText>
          </View>
          <ThemedText style={styles.voiceDescription}>
            Just speak naturally about your work. AI will identify which task you're updating and parse your notes automatically.
          </ThemedText>

          <View style={styles.microphoneContainer}>
            <Animated.View style={[styles.waveRing, styles.waveOuter, waveStyle]} />
            <Animated.View style={[styles.waveRing, styles.waveMiddle, waveStyle]} />
            <Animated.View style={[styles.waveRing, styles.waveInner, waveStyle]} />
            
            <Pressable
              style={[
                styles.microphoneButton,
                { backgroundColor: isRecording ? Colors.error : accentColors.primary },
              ]}
              onPress={handleToggleRecording}
              disabled={isProcessing}
              testID="voice-record-button"
            >
              <Animated.View style={pulseStyle}>
                <Feather name={isRecording ? "square" : "mic"} size={40} color="#FFFFFF" />
              </Animated.View>
            </Pressable>
          </View>

          <ThemedText style={styles.micHint}>
            {isRecording ? "Tap to stop when done speaking" : "Tap to start recording"}
          </ThemedText>

          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color={accentColors.primary} />
              <ThemedText style={styles.processingText}>
                {processingStep}
              </ThemedText>
            </View>
          ) : null}
        </Card>

        {transcribedText ? (
          <Card style={styles.transcriptionCard}>
            <View style={styles.sectionHeader}>
              <Feather name="message-circle" size={18} color={accentColors.primary} />
              <ThemedText style={styles.sectionTitle}>What You Said</ThemedText>
            </View>
            <ThemedText style={styles.transcriptionText}>
              "{transcribedText}"
            </ThemedText>
          </Card>
        ) : null}

        {parsedUpdate && selectedTask ? (
          <Card style={styles.parsedCard}>
            <View style={styles.sectionHeader}>
              <Feather name="cpu" size={18} color={Colors.success} />
              <ThemedText style={styles.sectionTitle}>AI Parsed Update</ThemedText>
              {aiConfidence ? (
                <View style={[styles.confidenceBadge, { backgroundColor: `${getConfidenceColor(aiConfidence)}20` }]}>
                  <Text style={[styles.confidenceText, { color: getConfidenceColor(aiConfidence) }]}>
                    {aiConfidence.toUpperCase()} confidence
                  </Text>
                </View>
              ) : null}
            </View>

            {aiReasoning ? (
              <ThemedText style={styles.aiReasoning}>
                <Feather name="info" size={12} color={theme.textSecondary} /> {aiReasoning}
              </ThemedText>
            ) : null}

            <View style={styles.parsedField}>
              <View style={styles.parsedLabelRow}>
                <ThemedText style={styles.parsedLabel}>Identified Task:</ThemedText>
                <Pressable onPress={handleChangeTask} style={styles.changeButton}>
                  <Feather name="edit-3" size={12} color={accentColors.primary} />
                  <Text style={[styles.changeButtonText, { color: accentColors.primary }]}>Change</Text>
                </Pressable>
              </View>
              <ThemedText style={styles.parsedValue}>{parsedUpdate.task}</ThemedText>
              <ThemedText style={styles.parsedSubValue}>{selectedTask.projectName}</ThemedText>
            </View>

            <View style={styles.parsedField}>
              <ThemedText style={styles.parsedLabel}>New Status:</ThemedText>
              <Pressable onPress={() => setShowStatusPicker(true)}>
                <View style={[styles.statusBadge, styles.statusEditable, { backgroundColor: `${getStatusColor(parsedUpdate.status)}20` }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(parsedUpdate.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(parsedUpdate.status) }]}>
                    {formatStatusLabel(parsedUpdate.status)}
                  </Text>
                  <Feather name="chevron-down" size={14} color={getStatusColor(parsedUpdate.status)} />
                </View>
              </Pressable>
            </View>

            <View style={styles.parsedField}>
              <ThemedText style={styles.parsedLabel}>Notes:</ThemedText>
              {isEditing ? (
                <TextInput
                  style={[styles.notesInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                  value={editableNotes}
                  onChangeText={setEditableNotes}
                  multiline
                  numberOfLines={3}
                  placeholder="Edit your notes..."
                  placeholderTextColor={theme.textSecondary}
                  testID="notes-input"
                />
              ) : (
                <ThemedText style={styles.parsedValue}>{editableNotes || parsedUpdate.notes}</ThemedText>
              )}
            </View>

            <View style={styles.actionButtons}>
              <Pressable
                style={[styles.editButton, { borderColor: theme.border }]}
                onPress={handleEditUpdate}
              >
                <Feather name="edit-2" size={16} color={theme.text} />
                <ThemedText style={styles.editButtonText}>{isEditing ? "Editing..." : "Edit"}</ThemedText>
              </Pressable>
              <GradientButton
                title={updateStatusMutation.isPending ? "Updating..." : "Confirm Update"}
                onPress={handleConfirmUpdate}
                variant="success"
                size="medium"
                icon="check"
                disabled={updateStatusMutation.isPending}
                style={styles.confirmButton}
              />
            </View>
          </Card>
        ) : null}

        {recentUpdates.length > 0 ? (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Feather name="clock" size={18} color={theme.textSecondary} />
              <ThemedText style={styles.sectionTitle}>Recent Voice Updates</ThemedText>
            </View>

            {recentUpdates.map((update) => (
              <Card key={update.id} style={styles.updateCard}>
                <View style={styles.updateHeader}>
                  <View style={styles.updateTitleRow}>
                    <ThemedText style={styles.updateTask}>{update.taskName}</ThemedText>
                    <View style={[styles.voiceBadge, { backgroundColor: `${accentColors.primary}20` }]}>
                      <Feather name="mic" size={12} color={accentColors.primary} />
                    </View>
                  </View>
                  <ThemedText style={styles.updateProject}>{update.projectName}</ThemedText>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(update.status)}20`, alignSelf: "flex-start" }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(update.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(update.status) }]}>
                    {formatStatusLabel(update.status)}
                  </Text>
                </View>

                <ThemedText style={styles.updateNotes}>{update.notes}</ThemedText>
                <ThemedText style={styles.updateTime}>{formatTime(update.createdAt)}</ThemedText>
              </Card>
            ))}
          </View>
        ) : null}

        <Card style={styles.tipsCard}>
          <View style={styles.sectionHeader}>
            <Feather name="zap" size={18} color={Colors.warning} />
            <ThemedText style={styles.sectionTitle}>Tips for Better Recognition</ThemedText>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Feather name="check" size={14} color={Colors.success} />
              <ThemedText style={styles.tipText}>Mention the task or location (e.g., "drywall in room 204")</ThemedText>
            </View>
            <View style={styles.tipItem}>
              <Feather name="check" size={14} color={Colors.success} />
              <ThemedText style={styles.tipText}>Say "finished" or "completed" for completed work</ThemedText>
            </View>
            <View style={styles.tipItem}>
              <Feather name="check" size={14} color={Colors.success} />
              <ThemedText style={styles.tipText}>Mention "blocked" or "waiting" if you're stuck</ThemedText>
            </View>
          </View>
        </Card>
      </ScrollView>

      <Modal
        visible={showTaskPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTaskPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Task</ThemedText>
              <Pressable onPress={() => setShowTaskPicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ThemedText style={styles.modalSubtitle}>
              Which task are you updating?
            </ThemedText>
            <FlatList
              data={tasks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.taskOption,
                    { borderBottomColor: theme.border },
                    selectedTask?.id === item.id && { backgroundColor: `${accentColors.primary}15` },
                  ]}
                  onPress={() => handleTaskSelectedManually(item)}
                >
                  <View style={styles.taskOptionInfo}>
                    <ThemedText style={styles.taskOptionTitle}>{item.title}</ThemedText>
                    <ThemedText style={styles.taskOptionProject}>{item.projectName}</ThemedText>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                      {formatStatusLabel(item.status)}
                    </Text>
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <ThemedText style={styles.emptyText}>No tasks available</ThemedText>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showStatusPicker}
        animationType="fade"
        transparent
        onRequestClose={() => setShowStatusPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowStatusPicker(false)}>
          <View style={[styles.statusPickerContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={styles.statusPickerTitle}>Change Status</ThemedText>
            {STATUS_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.statusOption,
                  parsedUpdate?.status === option.value && { backgroundColor: `${getStatusColor(option.value)}15` },
                ]}
                onPress={() => handleStatusChange(option.value)}
              >
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(option.value) }]} />
                <Text style={[styles.statusOptionText, { color: theme.text }]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  voiceCard: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  voiceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  voiceTitle: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
  },
  voiceDescription: {
    fontSize: FontSizes.sm,
    textAlign: "center",
    opacity: 0.7,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  microphoneContainer: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  waveRing: {
    position: "absolute",
    borderRadius: 100,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  waveOuter: {
    width: 160,
    height: 160,
  },
  waveMiddle: {
    width: 130,
    height: 130,
  },
  waveInner: {
    width: 100,
    height: 100,
  },
  microphoneButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micHint: {
    fontSize: FontSizes.sm,
    opacity: 0.6,
    marginTop: Spacing.md,
  },
  processingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  processingText: {
    fontSize: FontSizes.sm,
    opacity: 0.7,
  },
  transcriptionCard: {
    padding: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    flexWrap: "wrap",
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  transcriptionText: {
    fontSize: FontSizes.md,
    fontStyle: "italic",
    opacity: 0.8,
    lineHeight: 22,
  },
  parsedCard: {
    padding: Spacing.md,
  },
  confidenceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: "auto",
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: "700",
  },
  aiReasoning: {
    fontSize: FontSizes.xs,
    opacity: 0.7,
    fontStyle: "italic",
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  parsedField: {
    marginBottom: Spacing.sm,
  },
  parsedLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  parsedLabel: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
    opacity: 0.6,
    textTransform: "uppercase",
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  changeButtonText: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
  },
  parsedValue: {
    fontSize: FontSizes.md,
  },
  parsedSubValue: {
    fontSize: FontSizes.sm,
    opacity: 0.6,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  statusEditable: {
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
  },
  notesInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: FontSizes.md,
    minHeight: 80,
    textAlignVertical: "top",
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
  },
  recentSection: {
    marginTop: Spacing.md,
  },
  updateCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  updateHeader: {
    marginBottom: Spacing.sm,
  },
  updateTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  updateTask: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    flex: 1,
  },
  voiceBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  updateProject: {
    fontSize: FontSizes.sm,
    opacity: 0.6,
    marginTop: 2,
  },
  updateNotes: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.sm,
    opacity: 0.8,
    lineHeight: 20,
  },
  updateTime: {
    fontSize: FontSizes.xs,
    opacity: 0.5,
    marginTop: Spacing.sm,
  },
  tipsCard: {
    padding: Spacing.md,
  },
  tipsList: {
    gap: Spacing.sm,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  tipText: {
    fontSize: FontSizes.sm,
    flex: 1,
    opacity: 0.8,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
  },
  modalSubtitle: {
    fontSize: FontSizes.sm,
    opacity: 0.6,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  taskOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  taskOptionInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  taskOptionTitle: {
    fontSize: FontSizes.md,
    fontWeight: "500",
  },
  taskOptionProject: {
    fontSize: FontSizes.sm,
    opacity: 0.6,
    marginTop: 2,
  },
  emptyList: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: FontSizes.md,
    opacity: 0.5,
  },
  statusPickerContent: {
    position: "absolute",
    bottom: 100,
    left: Spacing.md,
    right: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statusPickerTitle: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  statusOptionText: {
    fontSize: FontSizes.md,
  },
});
