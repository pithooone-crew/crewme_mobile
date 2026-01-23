import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

const categories = [
  { label: "General", value: "general", icon: "message-circle" as const },
  { label: "Safety", value: "safety", icon: "shield" as const },
  { label: "Schedule", value: "schedule", icon: "calendar" as const },
  { label: "Equipment", value: "equipment", icon: "tool" as const },
  { label: "Urgent", value: "urgent", icon: "alert-triangle" as const },
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
  const { theme } = useTheme();
  
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const filteredTasks = mockTasks.filter(
    (task) => !selectedProject || task.projectId === selectedProject
  );

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

    setIsSending(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSending(false);

    if (Platform.OS === "web") {
      alert("Message sent successfully!");
    } else {
      Alert.alert("Success", "Your message has been sent");
    }
    navigation.goBack();
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
          <ThemedText type="h4" style={styles.sectionTitle}>
            Message
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.messageInput,
              {
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
              },
            ]}
            placeholder="Type your message here..."
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
            isSending && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={isSending}
          testID="button-send"
        >
          <Feather
            name={isSending ? "loader" : "send"}
            size={20}
            color="#FFFFFF"
          />
          <ThemedText type="body" style={styles.sendButtonText}>
            {isSending ? "Sending..." : "Send Message"}
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
