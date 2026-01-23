import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { api, CreateMessageData } from "@/lib/api";
import { getApiUrl } from "@/lib/query-client";

const categories: { label: string; value: CreateMessageData["category"]; icon: "message-circle" | "shield" | "calendar" | "tool" | "alert-triangle" }[] = [
  { label: "General", value: "general", icon: "message-circle" },
  { label: "Safety", value: "safety", icon: "shield" },
  { label: "Schedule", value: "schedule", icon: "calendar" },
  { label: "Equipment", value: "equipment", icon: "tool" },
  { label: "Urgent", value: "urgent", icon: "alert-triangle" },
];

const mockProjects = [
  { id: "p1", name: "Downtown Tower" },
  { id: "p2", name: "Harbor Bridge Repair" },
  { id: "p3", name: "City Mall Renovation" },
  { id: "p4", name: "Residential Complex" },
  { id: "p5", name: "Office Park Phase 2" },
];

const mockTasks = [
  { id: "t1", name: "Install electrical conduits", projectId: "p1" },
  { id: "t2", name: "Foundation reinforcement", projectId: "p1" },
  { id: "t3", name: "Deck surface preparation", projectId: "p2" },
  { id: "t4", name: "Interior framing", projectId: "p3" },
  { id: "t5", name: "Plumbing rough-in", projectId: "p4" },
];

export default function ComposeMessageScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const { isDemoMode } = useAuth();
  
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<CreateMessageData["category"]>("general");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredTasks = mockTasks.filter(
    (task) => !selectedProject || task.projectId === selectedProject
  );

  const createMutation = useMutation({
    mutationFn: async (data: CreateMessageData) => {
      if (isDemoMode) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { data: { id: "new-msg", ...data } };
      }
      return api.messages.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crew-messages"] });
      if (Platform.OS === "web") {
        alert("Message sent successfully!");
      } else {
        Alert.alert("Success", "Your message has been sent");
      }
      navigation.goBack();
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to send message";
      if (Platform.OS === "web") {
        alert(message);
      } else {
        Alert.alert("Error", message);
      }
    },
  });

  const handleGenerateWithAI = async () => {
    if (!subject.trim()) {
      if (Platform.OS === "web") {
        alert("Please enter a subject first to generate a message");
      } else {
        Alert.alert("Subject Required", "Please enter a subject first to help AI generate a relevant message");
      }
      return;
    }

    setIsGenerating(true);
    try {
      const projectName = selectedProject 
        ? mockProjects.find(p => p.id === selectedProject)?.name 
        : undefined;
      const taskName = selectedTask 
        ? mockTasks.find(t => t.id === selectedTask)?.name 
        : undefined;

      const response = await fetch(new URL("/api/generate-message", getApiUrl()).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          projectName,
          taskName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate message");
      }

      const data = await response.json();
      setContent(data.message);
    } catch (error) {
      const message = "Could not generate message. Please try again.";
      if (Platform.OS === "web") {
        alert(message);
      } else {
        Alert.alert("Generation Failed", message);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!subject.trim()) {
      if (Platform.OS === "web") {
        alert("Please enter a subject");
      } else {
        Alert.alert("Missing Subject", "Please enter a subject for your message");
      }
      return;
    }
    if (!content.trim()) {
      if (Platform.OS === "web") {
        alert("Please enter a message");
      } else {
        Alert.alert("Missing Message", "Please enter your message content");
      }
      return;
    }

    const messageData: CreateMessageData = {
      subject: subject.trim(),
      content: content.trim(),
      category,
      priority: category === "urgent" ? "high" : "medium",
      projectId: selectedProject || undefined,
      taskId: selectedTask || undefined,
    };

    createMutation.mutate(messageData);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Category
          </ThemedText>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <Pressable
                key={cat.value}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor:
                      category === cat.value
                        ? Colors.primary
                        : theme.backgroundSecondary,
                  },
                ]}
                onPress={() => setCategory(cat.value)}
                testID={`category-${cat.value}`}
              >
                <Feather
                  name={cat.icon}
                  size={20}
                  color={category === cat.value ? "#FFFFFF" : theme.text}
                />
                <ThemedText
                  type="caption"
                  style={[
                    styles.categoryLabel,
                    { color: category === cat.value ? "#FFFFFF" : theme.text },
                  ]}
                >
                  {cat.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Project (Optional)
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.projectScroll}
          >
            <Pressable
              style={[
                styles.projectChip,
                {
                  backgroundColor: !selectedProject
                    ? Colors.secondary
                    : theme.backgroundSecondary,
                },
              ]}
              onPress={() => {
                setSelectedProject(null);
                setSelectedTask(null);
              }}
            >
              <ThemedText
                type="small"
                style={{
                  color: !selectedProject ? "#FFFFFF" : theme.text,
                }}
              >
                None
              </ThemedText>
            </Pressable>
            {mockProjects.map((project) => (
              <Pressable
                key={project.id}
                style={[
                  styles.projectChip,
                  {
                    backgroundColor:
                      selectedProject === project.id
                        ? Colors.secondary
                        : theme.backgroundSecondary,
                  },
                ]}
                onPress={() => {
                  setSelectedProject(project.id);
                  setSelectedTask(null);
                }}
                testID={`project-${project.id}`}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: selectedProject === project.id ? "#FFFFFF" : theme.text,
                  }}
                >
                  {project.name}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </Card>

        {selectedProject && filteredTasks.length > 0 ? (
          <Card style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Related Task (Optional)
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.projectScroll}
            >
              <Pressable
                style={[
                  styles.projectChip,
                  {
                    backgroundColor: !selectedTask
                      ? Colors.warning
                      : theme.backgroundSecondary,
                  },
                ]}
                onPress={() => setSelectedTask(null)}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: !selectedTask ? "#FFFFFF" : theme.text,
                  }}
                >
                  None
                </ThemedText>
              </Pressable>
              {filteredTasks.map((task) => (
                <Pressable
                  key={task.id}
                  style={[
                    styles.projectChip,
                    {
                      backgroundColor:
                        selectedTask === task.id
                          ? Colors.warning
                          : theme.backgroundSecondary,
                    },
                  ]}
                  onPress={() => setSelectedTask(task.id)}
                  testID={`task-${task.id}`}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: selectedTask === task.id ? "#FFFFFF" : theme.text,
                    }}
                    numberOfLines={1}
                  >
                    {task.name}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </Card>
        ) : null}

        <Card style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Subject
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
              },
            ]}
            placeholder="Enter message subject"
            placeholderTextColor={theme.textSecondary}
            value={subject}
            onChangeText={setSubject}
            testID="input-subject"
          />
        </Card>

        <Card style={styles.section}>
          <View style={styles.messageTitleRow}>
            <ThemedText type="h4">
              Message
            </ThemedText>
            <Pressable
              style={[
                styles.aiButton,
                isGenerating && styles.aiButtonDisabled,
              ]}
              onPress={handleGenerateWithAI}
              disabled={isGenerating}
              testID="button-ai-generate"
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="zap" size={16} color="#FFFFFF" />
              )}
              <ThemedText type="small" style={styles.aiButtonText}>
                {isGenerating ? "Generating..." : "AI Generate"}
              </ThemedText>
            </Pressable>
          </View>
          <TextInput
            style={[
              styles.input,
              styles.messageInput,
              {
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
              },
            ]}
            placeholder="Type your message here or use AI Generate..."
            placeholderTextColor={theme.textSecondary}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            testID="input-message"
          />
        </Card>

        <Pressable
          style={[
            styles.sendButton,
            createMutation.isPending && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={createMutation.isPending}
          testID="button-send"
        >
          <Feather
            name={createMutation.isPending ? "loader" : "send"}
            size={20}
            color="#FFFFFF"
          />
          <ThemedText type="body" style={styles.sendButtonText}>
            {createMutation.isPending ? "Sending..." : "Send Message"}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  section: {
    marginBottom: 0,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  messageTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  aiButtonDisabled: {
    opacity: 0.7,
  },
  aiButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  categoryLabel: {
    fontWeight: "600",
  },
  projectScroll: {
    marginHorizontal: -Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  projectChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    fontSize: 16,
  },
  messageInput: {
    minHeight: 150,
    paddingTop: Spacing.md,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
