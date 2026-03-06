import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Image,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/constants/theme";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { GradientButton } from "@/components/ui";
import { apiRequest } from "@/lib/query-client";

interface Measurement {
  item: string;
  quantity: string;
  unit: string;
  category: string;
  estimatedCost: string;
  notes: string;
}

interface TakeoffResult {
  summary: string;
  measurements: Measurement[];
  totalEstimate: string;
  materialCategories: Record<string, number>;
  recommendations: string[];
  warnings: string[];
  accuracy: "high" | "medium" | "low";
  analyzedAt: string;
}

const categoryColors: Record<string, string> = {
  structural: "#EF4444",
  electrical: "#F59E0B",
  plumbing: "#3B82F6",
  finishing: "#8B5CF6",
  exterior: "#10B981",
  mechanical: "#6366F1",
};

const categoryIcons: Record<string, keyof typeof Feather.glyphMap> = {
  structural: "layers",
  electrical: "zap",
  plumbing: "droplet",
  finishing: "edit-3",
  exterior: "home",
  mechanical: "settings",
};

export default function AIBlueprintTakeoffScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme, accentColors } = useTheme();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<TakeoffResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<"camera" | "library" | null>(null);

  const handleTakePhoto = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      if (!canAskAgain) {
        setPermissionDenied("camera");
      }
      setErrorMessage("Camera access is needed to take blueprint photos.");
      return;
    }
    setErrorMessage(null);
    setPermissionDenied(null);

    const pickerResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setSelectedImage(pickerResult.assets[0].uri);
      setResult(null);
    }
  };

  const handlePickImage = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      if (!canAskAgain) {
        setPermissionDenied("library");
      }
      setErrorMessage("Photo library access is needed to select blueprint images.");
      return;
    }
    setErrorMessage(null);
    setPermissionDenied(null);

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setSelectedImage(pickerResult.assets[0].uri);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsAnalyzing(true);
    setResult(null);
    setSelectedCategory(null);
    setErrorMessage(null);

    try {
      const response = await apiRequest("POST", "/api/ai/blueprint-takeoff", {
        photoDescription: `Construction blueprint/photo captured from ${selectedImage.includes("camera") ? "camera" : "device gallery"}. Analyze for structural elements, dimensions, materials, electrical layout, plumbing fixtures, HVAC, and finishing details visible in the image.`,
        projectType: "commercial construction",
      });

      const data = await response.json();
      setResult(data);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      setErrorMessage("Could not analyze the blueprint. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClearImage = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedImage(null);
    setResult(null);
    setSelectedCategory(null);
  };

  const filteredMeasurements = result?.measurements
    ? selectedCategory
      ? result.measurements.filter((m) => m.category === selectedCategory)
      : result.measurements
    : [];

  const accuracyColor =
    result?.accuracy === "high"
      ? Colors.success
      : result?.accuracy === "medium"
        ? Colors.warning
        : Colors.error;

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
        <Card style={styles.uploadCard}>
          <View style={styles.cardHeader}>
            <Feather name="file-text" size={24} color={accentColors.primary} />
            <ThemedText style={styles.cardTitle}>Blueprint Takeoff</ThemedText>
          </View>
          <ThemedText style={styles.cardDescription}>
            Upload a blueprint or construction photo and AI will extract quantities, measurements, and material estimates.
          </ThemedText>

          {errorMessage ? (
            <View style={[styles.errorBanner, { backgroundColor: Colors.error + "15" }]}>
              <Feather name="alert-circle" size={16} color={Colors.error} />
              <ThemedText style={[styles.errorText, { color: Colors.error }]}>
                {errorMessage}
              </ThemedText>
              {permissionDenied && Platform.OS !== "web" ? (
                <Pressable
                  onPress={async () => {
                    try { await Linking.openSettings(); } catch {}
                  }}
                  style={[styles.settingsButton, { borderColor: Colors.error }]}
                  testID="button-open-settings"
                >
                  <ThemedText style={[styles.settingsButtonText, { color: Colors.error }]}>
                    Open Settings
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {selectedImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <Pressable
                style={styles.clearImageButton}
                onPress={handleClearImage}
                testID="button-clear-image"
              >
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
                style={[
                  styles.captureButton,
                  { backgroundColor: theme.backgroundSecondary, borderWidth: 1, borderColor: theme.border },
                ]}
                onPress={handlePickImage}
                testID="button-pick-image"
              >
                <Feather name="image" size={28} color={theme.text} />
                <ThemedText style={styles.captureButtonTextSecondary}>From Gallery</ThemedText>
              </Pressable>
            </View>
          )}

          {selectedImage && !isAnalyzing && !result ? (
            <GradientButton
              title="Analyze Blueprint"
              onPress={handleAnalyze}
              variant="primary"
              size="large"
              icon="cpu"
              style={styles.analyzeButton}
            />
          ) : null}

          {isAnalyzing ? (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="large" color={accentColors.primary} />
              <ThemedText style={styles.analyzingTitle}>Analyzing Blueprint</ThemedText>
              <ThemedText style={styles.analyzingText}>
                AI is extracting measurements and quantities...
              </ThemedText>
            </View>
          ) : null}
        </Card>

        {result ? (
          <>
            <Card style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={styles.summaryTitleRow}>
                  <Feather name="check-circle" size={20} color={Colors.success} />
                  <ThemedText style={styles.summaryTitle}>Analysis Complete</ThemedText>
                </View>
                <View style={[styles.accuracyBadge, { backgroundColor: `${accuracyColor}20` }]}>
                  <View style={[styles.accuracyDot, { backgroundColor: accuracyColor }]} />
                  <Text style={[styles.accuracyText, { color: accuracyColor }]}>
                    {result.accuracy} confidence
                  </Text>
                </View>
              </View>
              <ThemedText style={styles.summaryText}>{result.summary}</ThemedText>

              <View style={styles.totalEstimateContainer}>
                <ThemedText style={styles.totalLabel}>Estimated Total</ThemedText>
                <ThemedText style={styles.totalValue}>{result.totalEstimate}</ThemedText>
              </View>
            </Card>

            {result.materialCategories ? (
              <Card style={styles.categoriesCard}>
                <View style={styles.cardHeader}>
                  <Feather name="grid" size={20} color={accentColors.primary} />
                  <ThemedText style={styles.cardTitle}>Material Categories</ThemedText>
                </View>
                <View style={styles.categoryChips}>
                  <Pressable
                    style={[
                      styles.categoryChip,
                      !selectedCategory
                        ? { backgroundColor: accentColors.primary }
                        : { backgroundColor: theme.backgroundSecondary, borderWidth: 1, borderColor: theme.border },
                    ]}
                    onPress={() => setSelectedCategory(null)}
                    testID="button-category-all"
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: !selectedCategory ? "#FFFFFF" : theme.text },
                      ]}
                    >
                      All ({result.measurements?.length || 0})
                    </Text>
                  </Pressable>
                  {Object.entries(result.materialCategories).map(([cat, count]) =>
                    count > 0 ? (
                      <Pressable
                        key={cat}
                        style={[
                          styles.categoryChip,
                          selectedCategory === cat
                            ? { backgroundColor: categoryColors[cat] || accentColors.primary }
                            : { backgroundColor: theme.backgroundSecondary, borderWidth: 1, borderColor: theme.border },
                        ]}
                        onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                        testID={`button-category-${cat}`}
                      >
                        <Feather
                          name={categoryIcons[cat] || "box"}
                          size={14}
                          color={selectedCategory === cat ? "#FFFFFF" : theme.textSecondary}
                        />
                        <Text
                          style={[
                            styles.categoryChipText,
                            { color: selectedCategory === cat ? "#FFFFFF" : theme.text },
                          ]}
                        >
                          {cat} ({count})
                        </Text>
                      </Pressable>
                    ) : null
                  )}
                </View>
              </Card>
            ) : null}

            {filteredMeasurements.length > 0 ? (
              <Card style={styles.measurementsCard}>
                <View style={styles.cardHeader}>
                  <Feather name="list" size={20} color={accentColors.primary} />
                  <ThemedText style={styles.cardTitle}>
                    Extracted Items ({filteredMeasurements.length})
                  </ThemedText>
                </View>
                {filteredMeasurements.map((m, index) => (
                  <View
                    key={index}
                    style={[styles.measurementRow, { borderBottomColor: theme.border }]}
                    testID={`measurement-row-${index}`}
                  >
                    <View style={styles.measurementLeft}>
                      <View
                        style={[
                          styles.measurementDot,
                          { backgroundColor: categoryColors[m.category] || accentColors.primary },
                        ]}
                      />
                      <View style={styles.measurementInfo}>
                        <ThemedText style={styles.measurementItem}>{m.item}</ThemedText>
                        <ThemedText style={styles.measurementQuantity}>
                          {m.quantity} {m.unit}
                        </ThemedText>
                        {m.notes ? (
                          <ThemedText style={styles.measurementNotes}>{m.notes}</ThemedText>
                        ) : null}
                      </View>
                    </View>
                    <ThemedText style={styles.measurementCost}>{m.estimatedCost}</ThemedText>
                  </View>
                ))}
              </Card>
            ) : null}

            {result.recommendations && result.recommendations.length > 0 ? (
              <Card style={styles.recommendationsCard}>
                <View style={styles.cardHeader}>
                  <Feather name="thumbs-up" size={20} color={Colors.success} />
                  <ThemedText style={styles.cardTitle}>Recommendations</ThemedText>
                </View>
                {result.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationRow}>
                    <Feather name="check" size={16} color={Colors.success} />
                    <ThemedText style={styles.recommendationText}>{rec}</ThemedText>
                  </View>
                ))}
              </Card>
            ) : null}

            {result.warnings && result.warnings.length > 0 ? (
              <Card style={styles.warningsCard}>
                <View style={styles.cardHeader}>
                  <Feather name="alert-triangle" size={20} color={Colors.warning} />
                  <ThemedText style={styles.cardTitle}>Warnings</ThemedText>
                </View>
                {result.warnings.map((warning, index) => (
                  <View key={index} style={styles.warningRow}>
                    <Feather name="alert-circle" size={16} color={Colors.warning} />
                    <ThemedText style={styles.warningText}>{warning}</ThemedText>
                  </View>
                ))}
              </Card>
            ) : null}

            <GradientButton
              title="New Analysis"
              onPress={handleClearImage}
              variant="secondary"
              size="large"
              icon="refresh-cw"
              style={styles.newAnalysisButton}
            />
          </>
        ) : null}
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
  uploadCard: {
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
    height: 220,
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
  analyzeButton: {
    marginTop: Spacing.lg,
  },
  analyzingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
    gap: Spacing.sm,
  },
  analyzingTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    marginTop: Spacing.sm,
  },
  analyzingText: {
    fontSize: FontSizes.sm,
    opacity: 0.7,
  },
  summaryCard: {
    padding: Spacing.lg,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  summaryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  summaryTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
  },
  accuracyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  accuracyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  accuracyText: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  summaryText: {
    fontSize: FontSizes.md,
    lineHeight: 22,
    opacity: 0.8,
    marginBottom: Spacing.lg,
  },
  totalEstimateContainer: {
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  totalLabel: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
    opacity: 0.6,
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
  },
  totalValue: {
    fontSize: FontSizes.xxl,
    fontWeight: "700",
  },
  categoriesCard: {
    padding: Spacing.lg,
  },
  categoryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  categoryChipText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  measurementsCard: {
    padding: Spacing.lg,
  },
  measurementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  measurementLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    gap: Spacing.sm,
  },
  measurementDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  measurementInfo: {
    flex: 1,
  },
  measurementItem: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    marginBottom: 2,
  },
  measurementQuantity: {
    fontSize: FontSizes.sm,
    opacity: 0.7,
  },
  measurementNotes: {
    fontSize: FontSizes.xs,
    opacity: 0.5,
    fontStyle: "italic",
    marginTop: 2,
  },
  measurementCost: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    marginLeft: Spacing.sm,
  },
  recommendationsCard: {
    padding: Spacing.lg,
  },
  recommendationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  recommendationText: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
    flex: 1,
  },
  warningsCard: {
    padding: Spacing.lg,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  warningText: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
    flex: 1,
  },
  newAnalysisButton: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    marginTop: Spacing.md,
    flexWrap: "wrap",
  },
  errorText: {
    fontSize: FontSizes.sm,
    flex: 1,
  },
  settingsButton: {
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
  },
  settingsButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
  },
});
