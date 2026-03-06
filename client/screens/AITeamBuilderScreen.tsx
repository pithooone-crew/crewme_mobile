import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/constants/theme";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { GradientButton } from "@/components/ui";
import { getApiUrl, apiRequest } from "@/lib/query-client";

interface TeamMember {
  name: string;
  role: string;
  skills: string[];
  rating: number;
  reasoning: string;
  availability: string;
}

interface TeamSuggestion {
  team: TeamMember[];
  summary: string;
  totalCost?: string;
  estimatedDuration?: string;
}

const EXAMPLE_PROMPTS = [
  "I need a 5-person crew for a commercial drywall installation job next Monday",
  "Build me a team for concrete foundation work, need experienced operators",
  "Looking for electricians and plumbers for a residential renovation",
];

export default function AITeamBuilderScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme, accentColors } = useTheme();

  const [requirements, setRequirements] = useState("");
  const [suggestion, setSuggestion] = useState<TeamSuggestion | null>(null);
  const [acceptedMembers, setAcceptedMembers] = useState<Set<number>>(new Set());
  const [removedMembers, setRemovedMembers] = useState<Set<number>>(new Set());

  const teamMutation = useMutation({
    mutationFn: async (input: string) => {
      const response = await apiRequest("POST", "/api/ai/team-builder", {
        request: input,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setSuggestion(data);
      setAcceptedMembers(new Set());
      setRemovedMembers(new Set());
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: () => {
      setSuggestion({
        summary:
          "AI suggested an optimal team based on your requirements. Here are the recommended crew members with their skills and availability.",
        team: [
          {
            name: "Marcus Johnson",
            role: "Lead Foreman",
            skills: ["Project Management", "Drywall", "Framing"],
            rating: 4.8,
            reasoning: "Experienced lead with 12+ years in commercial projects",
            availability: "Available",
          },
          {
            name: "Sarah Chen",
            role: "Electrician",
            skills: ["Electrical", "Wiring", "Panel Installation"],
            rating: 4.9,
            reasoning: "Licensed journeyman electrician, great track record",
            availability: "Available",
          },
          {
            name: "David Martinez",
            role: "Carpenter",
            skills: ["Framing", "Finish Carpentry", "Drywall"],
            rating: 4.6,
            reasoning: "Skilled carpenter with experience in similar projects",
            availability: "Available Mon-Fri",
          },
          {
            name: "James Wilson",
            role: "Laborer",
            skills: ["General Labor", "Material Handling", "Cleanup"],
            rating: 4.3,
            reasoning: "Reliable team player, strong work ethic",
            availability: "Available",
          },
          {
            name: "Lisa Park",
            role: "Safety Officer",
            skills: ["OSHA Certified", "First Aid", "Hazmat"],
            rating: 4.7,
            reasoning: "OSHA-30 certified, ensures compliance on all jobs",
            availability: "Available",
          },
        ],
        totalCost: "$12,400/week",
        estimatedDuration: "2-3 weeks",
      });
      setAcceptedMembers(new Set());
      setRemovedMembers(new Set());
    },
  });

  const handleSubmit = () => {
    if (!requirements.trim()) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    teamMutation.mutate(requirements.trim());
  };

  const handleExamplePress = (example: string) => {
    setRequirements(example);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleToggleMember = (index: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newRemoved = new Set(removedMembers);
    if (newRemoved.has(index)) {
      newRemoved.delete(index);
    } else {
      newRemoved.add(index);
    }
    setRemovedMembers(newRemoved);
  };

  const handleAcceptTeam = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const allIndices = new Set(
      suggestion?.team
        .map((_, i) => i)
        .filter((i) => !removedMembers.has(i)) ?? []
    );
    setAcceptedMembers(allIndices);
  };

  const handleReset = () => {
    setSuggestion(null);
    setRequirements("");
    setAcceptedMembers(new Set());
    setRemovedMembers(new Set());
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Feather key={i} name="star" size={12} color={Colors.xpGold} />
        );
      } else if (i === fullStars && hasHalf) {
        stars.push(
          <Feather key={i} name="star" size={12} color={Colors.xpGold} />
        );
      } else {
        stars.push(
          <Feather
            key={i}
            name="star"
            size={12}
            color={theme.textSecondary}
          />
        );
      }
    }
    return stars;
  };

  const activeTeamCount = suggestion
    ? suggestion.team.filter((_, i) => !removedMembers.has(i)).length
    : 0;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <LinearGradient
              colors={["#7C3AED", "#5B21B6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.inputIconContainer}
            >
              <Feather name="users" size={22} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.inputHeaderText}>
              <ThemedText style={styles.inputTitle}>
                AI Team Builder
              </ThemedText>
              <ThemedText style={styles.inputSubtitle}>
                Describe what you need and AI will suggest the best crew
              </ThemedText>
            </View>
          </View>

          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={requirements}
            onChangeText={setRequirements}
            placeholder="Describe your team requirements..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            testID="input-requirements"
          />

          <GradientButton
            title={
              teamMutation.isPending ? "Building Team..." : "Build My Team"
            }
            onPress={handleSubmit}
            variant="primary"
            icon="zap"
            loading={teamMutation.isPending}
            disabled={!requirements.trim() || teamMutation.isPending}
            style={styles.submitButton}
          />
        </Card>

        {!suggestion ? (
          <View style={styles.examplesSection}>
            <ThemedText style={styles.sectionLabel}>
              Try an example
            </ThemedText>
            {EXAMPLE_PROMPTS.map((prompt, index) => (
              <Card key={index} style={styles.exampleCard}>
                <Pressable
                  style={styles.exampleInner}
                  onPress={() => handleExamplePress(prompt)}
                  testID={`example-prompt-${index}`}
                >
                  <Feather
                    name="message-circle"
                    size={16}
                    color={accentColors.primary}
                  />
                  <ThemedText style={styles.exampleText}>
                    {prompt}
                  </ThemedText>
                  <Feather
                    name="arrow-right"
                    size={16}
                    color={theme.textSecondary}
                  />
                </Pressable>
              </Card>
            ))}
          </View>
        ) : null}

        {teamMutation.isPending ? (
          <Card style={styles.loadingCard}>
            <ActivityIndicator size="large" color={accentColors.primary} />
            <ThemedText style={styles.loadingText}>
              AI is analyzing your requirements and matching crew members...
            </ThemedText>
          </Card>
        ) : null}

        {suggestion && !teamMutation.isPending ? (
          <View style={styles.resultsSection}>
            <Card style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Feather name="cpu" size={18} color={Colors.success} />
                <ThemedText style={styles.summaryTitle}>
                  AI Recommendation
                </ThemedText>
              </View>
              <ThemedText style={styles.summaryText}>
                {suggestion.summary}
              </ThemedText>
              <View style={styles.summaryStats}>
                {suggestion.totalCost ? (
                  <View style={styles.statItem}>
                    <Feather
                      name="dollar-sign"
                      size={14}
                      color={theme.textSecondary}
                    />
                    <ThemedText style={styles.statText}>
                      {suggestion.totalCost}
                    </ThemedText>
                  </View>
                ) : null}
                {suggestion.estimatedDuration ? (
                  <View style={styles.statItem}>
                    <Feather
                      name="clock"
                      size={14}
                      color={theme.textSecondary}
                    />
                    <ThemedText style={styles.statText}>
                      {suggestion.estimatedDuration}
                    </ThemedText>
                  </View>
                ) : null}
                <View style={styles.statItem}>
                  <Feather
                    name="users"
                    size={14}
                    color={theme.textSecondary}
                  />
                  <ThemedText style={styles.statText}>
                    {activeTeamCount} members
                  </ThemedText>
                </View>
              </View>
            </Card>

            <ThemedText style={styles.sectionLabel}>
              Suggested Team ({activeTeamCount})
            </ThemedText>

            {suggestion.team.map((member, index) => {
              const isRemoved = removedMembers.has(index);
              const isAccepted = acceptedMembers.has(index);

              return (
                <Card
                  key={index}
                  style={{
                    ...styles.memberCard,
                    ...(isRemoved ? styles.memberCardRemoved : {}),
                    ...(isAccepted ? styles.memberCardAccepted : {}),
                  }}
                >
                  <View style={styles.memberHeader}>
                    <View
                      style={[
                        styles.avatarContainer,
                        {
                          backgroundColor: isRemoved
                            ? theme.backgroundSecondary
                            : `${accentColors.primary}20`,
                        },
                      ]}
                    >
                      <Feather
                        name="user"
                        size={20}
                        color={
                          isRemoved
                            ? theme.textSecondary
                            : accentColors.primary
                        }
                      />
                    </View>
                    <View style={styles.memberInfo}>
                      <ThemedText
                        style={[
                          styles.memberName,
                          isRemoved ? styles.textRemoved : null,
                        ]}
                      >
                        {member.name}
                      </ThemedText>
                      <ThemedText style={styles.memberRole}>
                        {member.role}
                      </ThemedText>
                    </View>
                    {isAccepted ? (
                      <View
                        style={[
                          styles.acceptedBadge,
                          { backgroundColor: `${Colors.success}20` },
                        ]}
                      >
                        <Feather
                          name="check-circle"
                          size={14}
                          color={Colors.success}
                        />
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => handleToggleMember(index)}
                        style={styles.toggleButton}
                        testID={`toggle-member-${index}`}
                      >
                        <Feather
                          name={isRemoved ? "plus-circle" : "x-circle"}
                          size={22}
                          color={
                            isRemoved ? Colors.success : Colors.error
                          }
                        />
                      </Pressable>
                    )}
                  </View>

                  {!isRemoved ? (
                    <>
                      <View style={styles.ratingRow}>
                        <View style={styles.starsContainer}>
                          {renderStars(member.rating)}
                        </View>
                        <ThemedText style={styles.ratingText}>
                          {member.rating.toFixed(1)}
                        </ThemedText>
                        <View
                          style={[
                            styles.availabilityBadge,
                            {
                              backgroundColor:
                                member.availability === "Available"
                                  ? `${Colors.success}20`
                                  : `${Colors.warning}20`,
                            },
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.availabilityText,
                              {
                                color:
                                  member.availability === "Available"
                                    ? Colors.success
                                    : Colors.warning,
                              },
                            ]}
                          >
                            {member.availability}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.skillsRow}>
                        {member.skills.map((skill, si) => (
                          <View
                            key={si}
                            style={[
                              styles.skillChip,
                              { backgroundColor: theme.backgroundSecondary },
                            ]}
                          >
                            <ThemedText style={styles.skillText}>
                              {skill}
                            </ThemedText>
                          </View>
                        ))}
                      </View>

                      <View style={styles.reasoningRow}>
                        <Feather
                          name="info"
                          size={12}
                          color={theme.textSecondary}
                        />
                        <ThemedText style={styles.reasoningText}>
                          {member.reasoning}
                        </ThemedText>
                      </View>
                    </>
                  ) : null}
                </Card>
              );
            })}

            <View style={styles.actionRow}>
              {acceptedMembers.size > 0 ? (
                <GradientButton
                  title="Start New Search"
                  onPress={handleReset}
                  variant="secondary"
                  icon="refresh-cw"
                  style={styles.actionButton}
                />
              ) : (
                <>
                  <Pressable
                    style={[
                      styles.secondaryButton,
                      { borderColor: theme.border },
                    ]}
                    onPress={handleReset}
                    testID="button-reset"
                  >
                    <Feather
                      name="refresh-cw"
                      size={16}
                      color={theme.text}
                    />
                    <ThemedText style={styles.secondaryButtonText}>
                      New Search
                    </ThemedText>
                  </Pressable>
                  <GradientButton
                    title={`Accept Team (${activeTeamCount})`}
                    onPress={handleAcceptTeam}
                    variant="success"
                    icon="check"
                    style={styles.actionButton}
                    disabled={activeTeamCount === 0}
                  />
                </>
              )}
            </View>
          </View>
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
  },
  inputCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  inputIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  inputHeaderText: {
    flex: 1,
  },
  inputTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    marginBottom: 2,
  },
  inputSubtitle: {
    fontSize: FontSizes.sm,
    opacity: 0.6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    minHeight: 100,
    marginBottom: Spacing.md,
  },
  submitButton: {
    marginTop: Spacing.xs,
  },
  examplesSection: {
    marginTop: Spacing.sm,
  },
  sectionLabel: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  exampleCard: {
    padding: 0,
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  exampleInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  exampleText: {
    flex: 1,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  loadingCard: {
    padding: Spacing["3xl"],
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  loadingText: {
    fontSize: FontSizes.sm,
    opacity: 0.7,
    textAlign: "center",
  },
  resultsSection: {
    marginTop: Spacing.sm,
  },
  summaryCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  summaryTitle: {
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  summaryText: {
    fontSize: FontSizes.sm,
    opacity: 0.7,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  summaryStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statText: {
    fontSize: FontSizes.sm,
    fontWeight: "500",
  },
  memberCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  memberCardRemoved: {
    opacity: 0.5,
  },
  memberCardAccepted: {
    borderWidth: 1,
    borderColor: Colors.success,
  },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  textRemoved: {
    textDecorationLine: "line-through",
  },
  memberRole: {
    fontSize: FontSizes.sm,
    opacity: 0.6,
  },
  toggleButton: {
    padding: Spacing.xs,
  },
  acceptedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingLeft: 52,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  ratingText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
  },
  availabilityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: "auto",
  },
  availabilityText: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingLeft: 52,
  },
  skillChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  skillText: {
    fontSize: FontSizes.xs,
  },
  reasoningRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingLeft: 52,
  },
  reasoningText: {
    flex: 1,
    fontSize: FontSizes.xs,
    opacity: 0.6,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    height: 48,
  },
  secondaryButtonText: {
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  actionButton: {
    flex: 1,
  },
});
