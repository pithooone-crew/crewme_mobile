import React, { useState, useCallback, useRef, useEffect } from "react";
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
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

interface TaskUpdate {
  id: string;
  taskName: string;
  projectName: string;
  status: string;
  notes: string;
  createdAt: string;
  fromVoice: boolean;
}

export default function VoiceTaskScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme, accentColors } = useTheme();
  const { user } = useAuth();

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [parsedUpdate, setParsedUpdate] = useState<{
    task: string;
    status: string;
    notes: string;
  } | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<TaskUpdate[]>([
    {
      id: "1",
      taskName: "Install drywall - Room 204",
      projectName: "Downtown Office Building",
      status: "completed",
      notes: "Finished all wall panels. Ready for taping tomorrow.",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      fromVoice: true,
    },
    {
      id: "2",
      taskName: "Electrical rough-in - Floor 3",
      projectName: "Downtown Office Building",
      status: "in_progress",
      notes: "50% complete. Need more 12-gauge wire.",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      fromVoice: true,
    },
  ]);

  const pulseScale = useSharedValue(1);
  const waveOpacity = useSharedValue(0);

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

  const handleStartRecording = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsRecording(true);
    setTranscribedText("");
    setParsedUpdate(null);
  };

  const handleStopRecording = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsRecording(false);
    setIsProcessing(true);

    await new Promise((r) => setTimeout(r, 1500));

    const mockTranscription = "Finished installing the drywall in room 204. All panels are up and ready for taping tomorrow morning.";
    setTranscribedText(mockTranscription);

    await new Promise((r) => setTimeout(r, 1000));

    setParsedUpdate({
      task: "Install drywall - Room 204",
      status: "completed",
      notes: "All panels are up and ready for taping tomorrow morning.",
    });

    setIsProcessing(false);
  };

  const handleConfirmUpdate = async () => {
    if (!parsedUpdate) return;

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const newUpdate: TaskUpdate = {
      id: Date.now().toString(),
      taskName: parsedUpdate.task,
      projectName: "Downtown Office Building",
      status: parsedUpdate.status,
      notes: parsedUpdate.notes,
      createdAt: new Date().toISOString(),
      fromVoice: true,
    };

    setRecentUpdates((prev) => [newUpdate, ...prev]);
    setTranscribedText("");
    setParsedUpdate(null);

    Alert.alert("Task Updated", "Your voice update has been logged successfully!");
  };

  const handleEditUpdate = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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
            Tap and hold the microphone to record your task update. Speak naturally about what you completed, any issues, or materials needed.
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
              onPressIn={handleStartRecording}
              onPressOut={handleStopRecording}
              testID="voice-record-button"
            >
              <Animated.View style={pulseStyle}>
                <Feather
                  name={isRecording ? "mic" : "mic"}
                  size={40}
                  color="#FFFFFF"
                />
              </Animated.View>
            </Pressable>
          </View>

          <ThemedText style={styles.micHint}>
            {isRecording ? "Recording... Release to stop" : "Hold to record"}
          </ThemedText>

          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color={accentColors.primary} />
              <ThemedText style={styles.processingText}>
                Processing your voice...
              </ThemedText>
            </View>
          ) : null}
        </Card>

        {transcribedText ? (
          <Card style={styles.transcriptionCard}>
            <View style={styles.sectionHeader}>
              <Feather name="message-circle" size={18} color={accentColors.primary} />
              <ThemedText style={styles.sectionTitle}>Transcription</ThemedText>
            </View>
            <ThemedText style={styles.transcriptionText}>
              "{transcribedText}"
            </ThemedText>
          </Card>
        ) : null}

        {parsedUpdate ? (
          <Card style={styles.parsedCard}>
            <View style={styles.sectionHeader}>
              <Feather name="check-circle" size={18} color={Colors.success} />
              <ThemedText style={styles.sectionTitle}>Parsed Update</ThemedText>
            </View>

            <View style={styles.parsedField}>
              <ThemedText style={styles.parsedLabel}>Task:</ThemedText>
              <ThemedText style={styles.parsedValue}>{parsedUpdate.task}</ThemedText>
            </View>

            <View style={styles.parsedField}>
              <ThemedText style={styles.parsedLabel}>Status:</ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(parsedUpdate.status)}20` }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(parsedUpdate.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(parsedUpdate.status) }]}>
                  {parsedUpdate.status.replace("_", " ").charAt(0).toUpperCase() + parsedUpdate.status.slice(1).replace("_", " ")}
                </Text>
              </View>
            </View>

            <View style={styles.parsedField}>
              <ThemedText style={styles.parsedLabel}>Notes:</ThemedText>
              <ThemedText style={styles.parsedValue}>{parsedUpdate.notes}</ThemedText>
            </View>

            <View style={styles.actionButtons}>
              <Pressable
                style={[styles.editButton, { borderColor: theme.border }]}
                onPress={handleEditUpdate}
              >
                <Feather name="edit-2" size={16} color={theme.text} />
                <ThemedText style={styles.editButtonText}>Edit</ThemedText>
              </Pressable>
              <GradientButton
                title="Confirm Update"
                onPress={handleConfirmUpdate}
                variant="success"
                size="medium"
                icon="check"
                style={styles.confirmButton}
              />
            </View>
          </Card>
        ) : null}

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
                  {update.status.replace("_", " ").charAt(0).toUpperCase() + update.status.slice(1).replace("_", " ")}
                </Text>
              </View>

              <ThemedText style={styles.updateNotes}>{update.notes}</ThemedText>
              <ThemedText style={styles.updateTime}>{formatTime(update.createdAt)}</ThemedText>
            </Card>
          ))}
        </View>
      </ScrollView>
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
  parsedField: {
    marginBottom: Spacing.sm,
  },
  parsedLabel: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
    opacity: 0.6,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  parsedValue: {
    fontSize: FontSizes.md,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 6,
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
});
