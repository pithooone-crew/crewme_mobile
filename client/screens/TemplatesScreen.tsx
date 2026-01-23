import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import {
  api,
  Template,
  TemplateDetail,
  GenerateTemplateInput,
  ApplyTemplateInput,
} from "@/lib/api";

type CategoryFilter = "all" | Template["category"];

const categories: { label: string; value: CategoryFilter; icon: keyof typeof Feather.glyphMap }[] = [
  { label: "All", value: "all", icon: "grid" },
  { label: "Datacenter", value: "datacenter", icon: "server" },
  { label: "Commercial", value: "commercial", icon: "briefcase" },
  { label: "Residential", value: "residential", icon: "home" },
  { label: "Industrial", value: "industrial", icon: "settings" },
  { label: "Infrastructure", value: "infrastructure", icon: "map" },
];

const mockTemplates: Template[] = [
  {
    id: 1,
    name: "Data Center Build-Out",
    description: "Complete data center construction including power, cooling, and network infrastructure",
    category: "datacenter",
    estimatedDuration: 180,
    estimatedBudget: "$2,500,000",
    isPublic: true,
    createdBy: null,
    taskCount: 45,
    phaseCount: 6,
  },
  {
    id: 2,
    name: "Office Renovation",
    description: "Modern office space renovation with open floor plan and conference rooms",
    category: "commercial",
    estimatedDuration: 60,
    estimatedBudget: "$450,000",
    isPublic: true,
    createdBy: null,
    taskCount: 28,
    phaseCount: 4,
  },
  {
    id: 3,
    name: "Single Family Home",
    description: "Standard single family residential construction from foundation to finish",
    category: "residential",
    estimatedDuration: 120,
    estimatedBudget: "$350,000",
    isPublic: true,
    createdBy: null,
    taskCount: 52,
    phaseCount: 7,
  },
  {
    id: 4,
    name: "Warehouse Facility",
    description: "Industrial warehouse with loading docks and climate control",
    category: "industrial",
    estimatedDuration: 90,
    estimatedBudget: "$1,200,000",
    isPublic: true,
    createdBy: null,
    taskCount: 35,
    phaseCount: 5,
  },
  {
    id: 5,
    name: "Bridge Repair",
    description: "Infrastructure bridge repair and reinforcement project",
    category: "infrastructure",
    estimatedDuration: 45,
    estimatedBudget: "$800,000",
    isPublic: true,
    createdBy: null,
    taskCount: 22,
    phaseCount: 3,
  },
];

const mockTemplateDetail: TemplateDetail = {
  ...mockTemplates[0],
  phases: [
    {
      id: 1,
      name: "Site Preparation",
      description: "Clear and prepare the construction site",
      order: 1,
      estimatedDays: 14,
      tasks: [
        { id: 1, name: "Site Survey", description: "Complete site survey", estimatedHours: 8, requiredSkills: ["Surveying"], crewSize: 2, order: 1, isMilestone: false, inspectionRequired: false },
        { id: 2, name: "Grading", description: "Grade and level site", estimatedHours: 40, requiredSkills: ["Equipment Operation"], crewSize: 4, order: 2, isMilestone: false, inspectionRequired: true },
      ],
    },
    {
      id: 2,
      name: "Foundation",
      description: "Pour and cure foundation",
      order: 2,
      estimatedDays: 21,
      tasks: [
        { id: 3, name: "Excavation", description: "Excavate foundation area", estimatedHours: 24, requiredSkills: ["Excavation"], crewSize: 3, order: 1, isMilestone: false, inspectionRequired: false },
        { id: 4, name: "Concrete Pour", description: "Pour foundation concrete", estimatedHours: 16, requiredSkills: ["Concrete"], crewSize: 6, order: 2, isMilestone: true, inspectionRequired: true },
      ],
    },
  ],
};

export default function TemplatesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { isDemoMode, user } = useAuth();
  const queryClient = useQueryClient();

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateDetail, setTemplateDetail] = useState<TemplateDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [generateDescription, setGenerateDescription] = useState("");
  const [generateType, setGenerateType] = useState<Template["category"]>("commercial");
  const [generateBudget, setGenerateBudget] = useState("");
  const [generateDuration, setGenerateDuration] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [applyProjectName, setApplyProjectName] = useState("");
  const [applyLocation, setApplyLocation] = useState("");
  const [applyStartDate, setApplyStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [isApplying, setIsApplying] = useState(false);

  const {
    data: templates,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/templates"],
    queryFn: async () => {
      if (isDemoMode) {
        return mockTemplates;
      }
      const response = await api.templates.list();
      return response.data || mockTemplates;
    },
  });

  const filteredTemplates = templates?.filter(
    (t) => categoryFilter === "all" || t.category === categoryFilter
  ) || [];

  const handleTemplatePress = async (template: Template) => {
    setSelectedTemplate(template);
    setLoadingDetail(true);
    setShowDetailModal(true);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 500));
        setTemplateDetail({ ...mockTemplateDetail, ...template });
      } else {
        const response = await api.templates.get(template.id);
        setTemplateDetail(response.data || { ...mockTemplateDetail, ...template });
      }
    } catch (error) {
      setTemplateDetail({ ...mockTemplateDetail, ...template });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleGenerateTemplate = async () => {
    if (generateDescription.length < 10) {
      Alert.alert("Description Required", "Please enter at least 10 characters describing your project.");
      return;
    }

    setIsGenerating(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const input: GenerateTemplateInput = {
        description: generateDescription,
        projectType: generateType,
        estimatedBudget: generateBudget ? parseFloat(generateBudget) : undefined,
        estimatedDuration: generateDuration ? parseInt(generateDuration) : undefined,
      };

      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 3000));
        const newTemplate: Template = {
          id: Date.now(),
          name: `AI: ${generateDescription.substring(0, 30)}...`,
          description: generateDescription,
          category: generateType,
          estimatedDuration: parseInt(generateDuration) || 90,
          estimatedBudget: `$${generateBudget || "500,000"}`,
          isPublic: false,
          createdBy: user?.firstName || "You",
          taskCount: 25,
          phaseCount: 4,
        };
        queryClient.setQueryData(["/api/templates"], (old: Template[] | undefined) => [
          newTemplate,
          ...(old || []),
        ]);
      } else {
        await api.templates.generate(input);
        await refetch();
      }

      setShowGenerateModal(false);
      setGenerateDescription("");
      setGenerateBudget("");
      setGenerateDuration("");

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Success", "Your custom template has been generated!");
    } catch (error) {
      Alert.alert("Error", "Failed to generate template. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyTemplate = async () => {
    if (!applyProjectName.trim()) {
      Alert.alert("Project Name Required", "Please enter a name for your new project.");
      return;
    }
    if (!applyLocation.trim()) {
      Alert.alert("Location Required", "Please enter the project location.");
      return;
    }

    setIsApplying(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const input: ApplyTemplateInput = {
        projectName: applyProjectName,
        location: applyLocation,
        startDate: applyStartDate,
      };

      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 1500));
      } else {
        await api.templates.apply(selectedTemplate!.id, input);
      }

      setShowApplyModal(false);
      setShowDetailModal(false);
      setApplyProjectName("");
      setApplyLocation("");

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        "Project Created!",
        `"${applyProjectName}" has been created with ${templateDetail?.taskCount || selectedTemplate?.taskCount || 0} tasks. You saved 40+ hours of setup time!`
      );
    } catch (error) {
      Alert.alert("Error", "Failed to create project. Please try again.");
    } finally {
      setIsApplying(false);
    }
  };

  const getCategoryIcon = (category: Template["category"]): keyof typeof Feather.glyphMap => {
    const icons: Record<Template["category"], keyof typeof Feather.glyphMap> = {
      datacenter: "server",
      commercial: "briefcase",
      residential: "home",
      industrial: "settings",
      infrastructure: "map",
    };
    return icons[category];
  };

  const formatDuration = (days: number): string => {
    if (days >= 30) {
      const months = Math.round(days / 30);
      return `${months} month${months > 1 ? "s" : ""}`;
    }
    return `${days} days`;
  };

  const canGenerateTemplates = user?.role === "project_manager" || user?.role === "admin";
  const canApplyTemplates = user?.role !== "crew_member";

  const renderTemplateCard = (template: Template) => (
    <Pressable
      key={template.id}
      onPress={() => handleTemplatePress(template)}
      testID={`template-card-${template.id}`}
    >
      <Card style={styles.templateCard}>
        <View style={styles.templateHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: `${Colors.primary}15` }]}>
            <Feather name={getCategoryIcon(template.category)} size={24} color={Colors.primary} />
          </View>
          <View style={styles.templateInfo}>
            <ThemedText style={styles.templateName}>{template.name}</ThemedText>
            <ThemedText style={styles.templateCategory}>
              {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
            </ThemedText>
          </View>
          {template.createdBy ? (
            <View style={styles.aiBadge}>
              <Feather name="cpu" size={12} color="#fff" />
              <ThemedText style={styles.aiBadgeText}>AI</ThemedText>
            </View>
          ) : null}
        </View>

        <ThemedText style={styles.templateDescription} numberOfLines={2}>
          {template.description}
        </ThemedText>

        <View style={styles.templateMeta}>
          <View style={styles.metaItem}>
            <Feather name="clock" size={14} color={Colors.textSecondary} />
            <ThemedText style={styles.metaText}>{formatDuration(template.estimatedDuration)}</ThemedText>
          </View>
          <View style={styles.metaItem}>
            <Feather name="dollar-sign" size={14} color={Colors.textSecondary} />
            <ThemedText style={styles.metaText}>{template.estimatedBudget}</ThemedText>
          </View>
          <View style={styles.metaItem}>
            <Feather name="check-square" size={14} color={Colors.textSecondary} />
            <ThemedText style={styles.metaText}>{template.taskCount || 0} tasks</ThemedText>
          </View>
        </View>

        <View style={styles.quickStartBadge}>
          <Feather name="zap" size={12} color={Colors.success} />
          <ThemedText style={styles.quickStartText}>2 min setup</ThemedText>
        </View>
      </Card>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.md, paddingBottom: tabBarHeight + Spacing.xl + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} tintColor={Colors.primary} />
        }
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {categories.map((cat) => (
            <Pressable
              key={cat.value}
              style={[
                styles.filterChip,
                categoryFilter === cat.value && styles.filterChipActive,
              ]}
              onPress={() => setCategoryFilter(cat.value)}
            >
              <Feather
                name={cat.icon}
                size={14}
                color={categoryFilter === cat.value ? "#fff" : Colors.textSecondary}
              />
              <ThemedText
                style={[
                  styles.filterChipText,
                  categoryFilter === cat.value && styles.filterChipTextActive,
                ]}
              >
                {cat.label}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <LoadingSkeleton width="100%" height={180} style={{ marginBottom: Spacing.md }} />
            <LoadingSkeleton width="100%" height={180} style={{ marginBottom: Spacing.md }} />
            <LoadingSkeleton width="100%" height={180} />
          </View>
        ) : filteredTemplates.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Feather name="file-text" size={48} color={Colors.textSecondary} />
            <ThemedText style={styles.emptyTitle}>No Templates Found</ThemedText>
            <ThemedText style={styles.emptyText}>
              {categoryFilter !== "all"
                ? "Try selecting a different category"
                : "Templates will appear here once available"}
            </ThemedText>
          </Card>
        ) : (
          filteredTemplates.map(renderTemplateCard)
        )}
      </ScrollView>

      {canGenerateTemplates ? (
        <Pressable
          style={styles.fab}
          onPress={() => setShowGenerateModal(true)}
          testID="button-generate-template"
        >
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="cpu" size={24} color="#fff" />
          </LinearGradient>
        </Pressable>
      ) : null}

      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Template Details</ThemedText>
            <Pressable onPress={() => setShowDetailModal(false)} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {loadingDetail ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <ThemedText style={styles.loadingText}>Loading template...</ThemedText>
              </View>
            ) : selectedTemplate ? (
              <>
                <View style={styles.detailHeader}>
                  <View style={[styles.categoryIconLarge, { backgroundColor: `${Colors.primary}15` }]}>
                    <Feather name={getCategoryIcon(selectedTemplate.category)} size={32} color={Colors.primary} />
                  </View>
                  <ThemedText style={styles.detailName}>{selectedTemplate.name}</ThemedText>
                  <ThemedText style={styles.detailDescription}>{selectedTemplate.description}</ThemedText>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <ThemedText style={styles.statValue}>{formatDuration(selectedTemplate.estimatedDuration)}</ThemedText>
                    <ThemedText style={styles.statLabel}>Duration</ThemedText>
                  </View>
                  <View style={styles.statItem}>
                    <ThemedText style={styles.statValue}>{selectedTemplate.estimatedBudget}</ThemedText>
                    <ThemedText style={styles.statLabel}>Budget</ThemedText>
                  </View>
                  <View style={styles.statItem}>
                    <ThemedText style={styles.statValue}>{templateDetail?.taskCount || selectedTemplate.taskCount || 0}</ThemedText>
                    <ThemedText style={styles.statLabel}>Tasks</ThemedText>
                  </View>
                </View>

                {templateDetail?.phases ? (
                  <View style={styles.phasesSection}>
                    <ThemedText style={styles.sectionTitle}>Project Phases</ThemedText>
                    {templateDetail.phases.map((phase) => (
                      <Card key={phase.id} style={styles.phaseCard}>
                        <View style={styles.phaseHeader}>
                          <View style={styles.phaseNumber}>
                            <ThemedText style={styles.phaseNumberText}>{phase.order}</ThemedText>
                          </View>
                          <View style={styles.phaseInfo}>
                            <ThemedText style={styles.phaseName}>{phase.name}</ThemedText>
                            <ThemedText style={styles.phaseMeta}>
                              {phase.estimatedDays} days - {phase.tasks.length} tasks
                            </ThemedText>
                          </View>
                        </View>
                      </Card>
                    ))}
                  </View>
                ) : null}

                <View style={styles.savingsCard}>
                  <Feather name="zap" size={24} color={Colors.success} />
                  <View style={styles.savingsContent}>
                    <ThemedText style={styles.savingsTitle}>Save 40+ Hours</ThemedText>
                    <ThemedText style={styles.savingsText}>
                      Skip manual project setup and get started in minutes
                    </ThemedText>
                  </View>
                </View>
              </>
            ) : null}
          </ScrollView>

          {canApplyTemplates && selectedTemplate ? (
            <View style={[styles.modalFooter, { paddingBottom: insets.bottom + Spacing.md }]}>
              <Button
                title="Apply Template"
                onPress={() => setShowApplyModal(true)}
                style={styles.applyButton}
              />
            </View>
          ) : null}
        </ThemedView>
      </Modal>

      <Modal
        visible={showGenerateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGenerateModal(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Generate Template with AI</ThemedText>
            <Pressable onPress={() => setShowGenerateModal(false)} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <ThemedText style={styles.inputLabel}>Project Description</ThemedText>
            <TextInput
              style={[styles.textInput, styles.textArea, { color: theme.text, backgroundColor: theme.inputBackground }]}
              placeholder="Describe your project in detail (min 10 characters)..."
              placeholderTextColor={Colors.textSecondary}
              value={generateDescription}
              onChangeText={setGenerateDescription}
              multiline
              numberOfLines={4}
              testID="input-generate-description"
            />

            <ThemedText style={styles.inputLabel}>Project Type</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {categories.slice(1).map((cat) => (
                <Pressable
                  key={cat.value}
                  style={[
                    styles.typeChip,
                    generateType === cat.value && styles.typeChipActive,
                  ]}
                  onPress={() => setGenerateType(cat.value as Template["category"])}
                >
                  <Feather
                    name={cat.icon}
                    size={16}
                    color={generateType === cat.value ? "#fff" : Colors.primary}
                  />
                  <ThemedText
                    style={[
                      styles.typeChipText,
                      generateType === cat.value && styles.typeChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>

            <ThemedText style={styles.inputLabel}>Estimated Budget ($)</ThemedText>
            <TextInput
              style={[styles.textInput, { color: theme.text, backgroundColor: theme.inputBackground }]}
              placeholder="e.g., 500000"
              placeholderTextColor={Colors.textSecondary}
              value={generateBudget}
              onChangeText={setGenerateBudget}
              keyboardType="numeric"
            />

            <ThemedText style={styles.inputLabel}>Duration (days)</ThemedText>
            <TextInput
              style={[styles.textInput, { color: theme.text, backgroundColor: theme.inputBackground }]}
              placeholder="e.g., 90"
              placeholderTextColor={Colors.textSecondary}
              value={generateDuration}
              onChangeText={setGenerateDuration}
              keyboardType="numeric"
            />

            <View style={styles.aiInfoCard}>
              <Feather name="info" size={20} color={Colors.primary} />
              <ThemedText style={styles.aiInfoText}>
                AI will analyze your description and create a complete project template with phases, tasks, and skill requirements. This may take 15-45 seconds.
              </ThemedText>
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + Spacing.md }]}>
            <Button
              title={isGenerating ? "Generating..." : "Generate Template"}
              onPress={handleGenerateTemplate}
              disabled={isGenerating || generateDescription.length < 10}
              style={styles.generateButton}
              icon={isGenerating ? undefined : <Feather name="cpu" size={18} color="#fff" />}
            />
          </View>
        </ThemedView>
      </Modal>

      <Modal
        visible={showApplyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowApplyModal(false)}
      >
        <View style={styles.applyModalOverlay}>
          <View style={[styles.applyModalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Create Project</ThemedText>
              <Pressable onPress={() => setShowApplyModal(false)} style={styles.closeButton}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ThemedText style={styles.applySubtitle}>
              Create a new project from "{selectedTemplate?.name}"
            </ThemedText>

            <ThemedText style={styles.inputLabel}>Project Name</ThemedText>
            <TextInput
              style={[styles.textInput, { color: theme.text, backgroundColor: theme.inputBackground }]}
              placeholder="Enter project name"
              placeholderTextColor={Colors.textSecondary}
              value={applyProjectName}
              onChangeText={setApplyProjectName}
              testID="input-project-name"
            />

            <ThemedText style={styles.inputLabel}>Location</ThemedText>
            <TextInput
              style={[styles.textInput, { color: theme.text, backgroundColor: theme.inputBackground }]}
              placeholder="Enter project location"
              placeholderTextColor={Colors.textSecondary}
              value={applyLocation}
              onChangeText={setApplyLocation}
              testID="input-project-location"
            />

            <ThemedText style={styles.inputLabel}>Start Date</ThemedText>
            <TextInput
              style={[styles.textInput, { color: theme.text, backgroundColor: theme.inputBackground }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textSecondary}
              value={applyStartDate}
              onChangeText={setApplyStartDate}
            />

            <View style={styles.applyActions}>
              <Button
                title="Cancel"
                onPress={() => setShowApplyModal(false)}
                variant="outline"
                style={styles.cancelButton}
              />
              <Button
                title={isApplying ? "Creating..." : "Create Project"}
                onPress={handleApplyTemplate}
                disabled={isApplying}
                style={styles.createButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },
  filterScroll: {
    marginBottom: Spacing.md,
  },
  filterContainer: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  emptyCard: {
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    marginTop: Spacing.md,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  templateCard: {
    marginBottom: Spacing.md,
  },
  templateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  categoryIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  templateCategory: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  aiBadgeText: {
    fontSize: FontSizes.xs,
    color: "#fff",
    fontWeight: "600",
  },
  templateDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  templateMeta: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  quickStartBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: `${Colors.success}15`,
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  quickStartText: {
    fontSize: FontSizes.xs,
    color: Colors.success,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: Spacing.md,
    bottom: 100,
    borderRadius: 28,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabGradient: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
  },
  closeButton: {
    padding: Spacing.sm,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.md,
  },
  modalFooter: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailHeader: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  detailName: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    textAlign: "center",
  },
  detailDescription: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  phasesSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  phaseCard: {
    marginBottom: Spacing.sm,
  },
  phaseHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  phaseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  phaseNumberText: {
    color: "#fff",
    fontWeight: "700",
  },
  phaseInfo: {
    flex: 1,
  },
  phaseName: {
    fontWeight: "600",
  },
  phaseMeta: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  savingsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: `${Colors.success}10`,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  savingsContent: {
    flex: 1,
  },
  savingsTitle: {
    fontWeight: "600",
    color: Colors.success,
  },
  savingsText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  applyButton: {
    width: "100%",
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: FontSizes.md,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  typeScroll: {
    marginTop: Spacing.sm,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginRight: Spacing.sm,
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
  },
  typeChipText: {
    color: Colors.primary,
    fontWeight: "500",
  },
  typeChipTextActive: {
    color: "#fff",
  },
  aiInfoCard: {
    flexDirection: "row",
    gap: Spacing.md,
    backgroundColor: `${Colors.primary}10`,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  aiInfoText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  generateButton: {
    width: "100%",
  },
  applyModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  applyModalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  applySubtitle: {
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  applyActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
  },
  createButton: {
    flex: 1,
  },
});
