import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/constants/theme";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { GradientButton } from "@/components/ui";

interface ProgressEntry {
  id: string;
  imageUri: string;
  aiNotes: string;
  manualNotes: string;
  taskName: string;
  projectName: string;
  createdAt: string;
  tags: string[];
}

export default function PhotoDocScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme, accentColors } = useTheme();
  const { user } = useAuth();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiGeneratedNotes, setAiGeneratedNotes] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [detectedTags, setDetectedTags] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState("Drywall installation - Room 204");
  const [recentEntries, setRecentEntries] = useState<ProgressEntry[]>([
    {
      id: "1",
      imageUri: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400",
      aiNotes: "Electrical panel installation complete. All circuits labeled and organized. Safety covers installed on all live connections.",
      manualNotes: "Passed inspection",
      taskName: "Electrical panel - Floor 2",
      projectName: "Downtown Office Building",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      tags: ["electrical", "panel", "complete"],
    },
    {
      id: "2",
      imageUri: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=400",
      aiNotes: "Framing work in progress. Studs are properly spaced at 16 inches on center. Headers installed above door openings.",
      manualNotes: "Need more 2x4s for south wall",
      taskName: "Framing - Room 301",
      projectName: "Downtown Office Building",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      tags: ["framing", "in-progress", "lumber"],
    },
  ]);

  const handleTakePhoto = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Camera access is needed to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Photo library access is needed to select photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  const analyzeImage = async (imageUri: string) => {
    setIsAnalyzing(true);
    setAiGeneratedNotes("");
    setDetectedTags([]);

    await new Promise((r) => setTimeout(r, 2000));

    const mockNotes = "Drywall installation progress showing completed wall section. Panels are properly secured with appropriate screw spacing. Joints are aligned and ready for taping. No visible damage or improper cuts detected. Work appears to meet standard building code requirements.";
    const mockTags = ["drywall", "installation", "in-progress", "walls"];

    setAiGeneratedNotes(mockNotes);
    setDetectedTags(mockTags);
    setIsAnalyzing(false);
  };

  const handleSaveEntry = async () => {
    if (!selectedImage || !aiGeneratedNotes) return;

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const newEntry: ProgressEntry = {
      id: Date.now().toString(),
      imageUri: selectedImage,
      aiNotes: aiGeneratedNotes,
      manualNotes: manualNotes,
      taskName: selectedTask,
      projectName: "Downtown Office Building",
      createdAt: new Date().toISOString(),
      tags: detectedTags,
    };

    setRecentEntries((prev) => [newEntry, ...prev]);
    setSelectedImage(null);
    setAiGeneratedNotes("");
    setManualNotes("");
    setDetectedTags([]);

    Alert.alert("Saved", "Progress photo and notes have been documented!");
  };

  const handleClearImage = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedImage(null);
    setAiGeneratedNotes("");
    setManualNotes("");
    setDetectedTags([]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
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
        <Card style={styles.captureCard}>
          <View style={styles.cardHeader}>
            <Feather name="camera" size={24} color={accentColors.primary} />
            <ThemedText style={styles.cardTitle}>Photo Documentation</ThemedText>
          </View>
          <ThemedText style={styles.cardDescription}>
            Take a photo of your work and AI will automatically generate professional progress notes.
          </ThemedText>

          {selectedImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <Pressable style={styles.clearImageButton} onPress={handleClearImage}>
                <Feather name="x" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.captureButtons}>
              <Pressable
                style={[styles.captureButton, { backgroundColor: accentColors.primary }]}
                onPress={handleTakePhoto}
                testID="button-take-photo"
              >
                <Feather name="camera" size={28} color="#FFFFFF" />
                <Text style={styles.captureButtonText}>Take Photo</Text>
              </Pressable>
              <Pressable
                style={[styles.captureButton, { backgroundColor: theme.backgroundSecondary, borderWidth: 1, borderColor: theme.border }]}
                onPress={handlePickImage}
                testID="button-pick-image"
              >
                <Feather name="image" size={28} color={theme.text} />
                <ThemedText style={styles.captureButtonTextSecondary}>From Gallery</ThemedText>
              </Pressable>
            </View>
          )}

          {isAnalyzing ? (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="small" color={accentColors.primary} />
              <ThemedText style={styles.analyzingText}>AI is analyzing your photo...</ThemedText>
            </View>
          ) : null}
        </Card>

        {aiGeneratedNotes ? (
          <Card style={styles.notesCard}>
            <View style={styles.cardHeader}>
              <Feather name="file-text" size={20} color={Colors.success} />
              <ThemedText style={styles.cardTitle}>AI-Generated Notes</ThemedText>
            </View>

            <View style={styles.notesContainer}>
              <ThemedText style={styles.generatedNotes}>{aiGeneratedNotes}</ThemedText>
            </View>

            {detectedTags.length > 0 ? (
              <View style={styles.tagsContainer}>
                <ThemedText style={styles.tagsLabel}>Detected Tags:</ThemedText>
                <View style={styles.tagsList}>
                  {detectedTags.map((tag, index) => (
                    <View key={index} style={[styles.tag, { backgroundColor: `${accentColors.primary}20` }]}>
                      <Text style={[styles.tagText, { color: accentColors.primary }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.manualNotesSection}>
              <ThemedText style={styles.manualNotesLabel}>Add Your Notes (Optional):</ThemedText>
              <TextInput
                style={[styles.manualNotesInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                placeholder="Add any additional details..."
                placeholderTextColor={theme.textSecondary}
                value={manualNotes}
                onChangeText={setManualNotes}
                multiline
                numberOfLines={3}
                testID="input-manual-notes"
              />
            </View>

            <GradientButton
              title="Save Progress Entry"
              onPress={handleSaveEntry}
              variant="primary"
              size="large"
              icon="save"
              style={styles.saveButton}
            />
          </Card>
        ) : null}

        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Feather name="clock" size={18} color={theme.textSecondary} />
            <ThemedText style={styles.sectionTitle}>Recent Documentation</ThemedText>
          </View>

          {recentEntries.map((entry) => (
            <Card key={entry.id} style={styles.entryCard}>
              <View style={styles.entryContent}>
                <Image source={{ uri: entry.imageUri }} style={styles.entryThumbnail} />
                <View style={styles.entryDetails}>
                  <ThemedText style={styles.entryTask}>{entry.taskName}</ThemedText>
                  <ThemedText style={styles.entryProject}>{entry.projectName}</ThemedText>
                  <ThemedText style={styles.entryNotes} numberOfLines={2}>
                    {entry.aiNotes}
                  </ThemedText>
                  {entry.manualNotes ? (
                    <ThemedText style={styles.entryManualNotes} numberOfLines={1}>
                      Note: {entry.manualNotes}
                    </ThemedText>
                  ) : null}
                  <View style={styles.entryMeta}>
                    <ThemedText style={styles.entryDate}>{formatDate(entry.createdAt)}</ThemedText>
                    <View style={styles.entryTagsSmall}>
                      {entry.tags.slice(0, 2).map((tag, index) => (
                        <View key={index} style={[styles.tagSmall, { backgroundColor: `${accentColors.primary}15` }]}>
                          <Text style={[styles.tagTextSmall, { color: accentColors.primary }]}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
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
  captureCard: {
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
  },
  cardDescription: {
    fontSize: FontSizes.sm,
    opacity: 0.7,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  captureButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  captureButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  captureButtonText: {
    color: "#FFFFFF",
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  captureButtonTextSecondary: {
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  imagePreviewContainer: {
    position: "relative",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.lg,
  },
  clearImageButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  analyzingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  analyzingText: {
    fontSize: FontSizes.sm,
    opacity: 0.7,
  },
  notesCard: {
    padding: Spacing.md,
  },
  notesContainer: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  generatedNotes: {
    fontSize: FontSizes.md,
    lineHeight: 22,
  },
  tagsContainer: {
    marginBottom: Spacing.md,
  },
  tagsLabel: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
    opacity: 0.6,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
  },
  manualNotesSection: {
    marginBottom: Spacing.md,
  },
  manualNotesLabel: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  manualNotesInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: FontSizes.md,
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    marginTop: Spacing.sm,
  },
  recentSection: {
    marginTop: Spacing.md,
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
  entryCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  entryContent: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  entryThumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  entryDetails: {
    flex: 1,
  },
  entryTask: {
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  entryProject: {
    fontSize: FontSizes.xs,
    opacity: 0.6,
    marginBottom: Spacing.xs,
  },
  entryNotes: {
    fontSize: FontSizes.sm,
    opacity: 0.8,
    lineHeight: 18,
  },
  entryManualNotes: {
    fontSize: FontSizes.xs,
    fontStyle: "italic",
    opacity: 0.6,
    marginTop: 4,
  },
  entryMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  entryDate: {
    fontSize: FontSizes.xs,
    opacity: 0.5,
  },
  entryTagsSmall: {
    flexDirection: "row",
    gap: 4,
  },
  tagSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  tagTextSmall: {
    fontSize: 10,
    fontWeight: "600",
  },
});
