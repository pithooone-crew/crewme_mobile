import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/constants/theme";

export interface ProjectOption {
  id: string;
  name: string;
  location?: string;
}

interface ProjectSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (project: ProjectOption) => void;
  projects: ProjectOption[];
  isLoading?: boolean;
}

export function ProjectSelectorModal({
  visible,
  onClose,
  onSelect,
  projects,
  isLoading = false,
}: ProjectSelectorModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Project</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={Colors.text} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>Which project are you working on?</Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <ScrollView style={styles.projectList} showsVerticalScrollIndicator={false}>
              {projects.map((project) => (
                <Pressable
                  key={project.id}
                  style={styles.projectItem}
                  onPress={() => onSelect(project)}
                >
                  <View style={styles.projectIcon}>
                    <Feather name="briefcase" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.projectInfo}>
                    <Text style={styles.projectName}>{project.name}</Text>
                    {project.location ? (
                      <Text style={styles.projectLocation}>{project.location}</Text>
                    ) : null}
                  </View>
                  <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing["2xl"],
    maxHeight: "70%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    padding: Spacing["2xl"],
    alignItems: "center",
  },
  projectList: {
    paddingHorizontal: Spacing.lg,
  },
  projectItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  projectIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  projectLocation: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
});
