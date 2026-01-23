import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";

interface AvailabilityEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  maxHours: number;
  skills: string[];
  status: "active" | "matched" | "expired";
  matchedProject?: string;
}

const mockAvailability: AvailabilityEntry[] = [
  {
    id: "1",
    date: new Date(Date.now() + 86400000).toISOString(),
    startTime: "6:00 AM",
    endTime: "4:00 PM",
    maxHours: 10,
    skills: ["Electrical", "HVAC"],
    status: "active",
  },
  {
    id: "2",
    date: new Date(Date.now() + 172800000).toISOString(),
    startTime: "7:00 AM",
    endTime: "3:00 PM",
    maxHours: 8,
    skills: ["Electrical"],
    status: "matched",
    matchedProject: "Downtown Tower",
  },
  {
    id: "3",
    date: new Date(Date.now() + 259200000).toISOString(),
    startTime: "6:00 AM",
    endTime: "6:00 PM",
    maxHours: 12,
    skills: ["Electrical", "HVAC", "Plumbing"],
    status: "active",
  },
];

const allSkills = ["Electrical", "HVAC", "Plumbing", "Carpentry", "Welding", "Concrete", "Framing", "Roofing"];

const upcomingDates = Array.from({ length: 14 }, (_, i) => {
  const date = new Date(Date.now() + (i + 1) * 86400000);
  return {
    date: date.toISOString(),
    dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
    dayNum: date.getDate(),
    month: date.toLocaleDateString("en-US", { month: "short" }),
  };
});

export default function AvailabilityPoolScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { isDemoMode } = useAuth();
  const queryClient = useQueryClient();
  const [isAvailable, setIsAvailable] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["Electrical"]);
  const [maxHours, setMaxHours] = useState(8);

  const { data: entries = mockAvailability, isLoading, refetch } = useQuery({
    queryKey: ["/api/availability"],
    queryFn: async () => mockAvailability,
    enabled: isDemoMode,
  });

  const addMutation = useMutation({
    mutationFn: async (data: Partial<AvailabilityEntry>) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      setShowAddModal(false);
      setSelectedDate(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleAdd = () => {
    if (!selectedDate) return;
    addMutation.mutate({
      date: selectedDate,
      startTime: "6:00 AM",
      endTime: maxHours > 8 ? "6:00 PM" : "3:00 PM",
      maxHours,
      skills: selectedSkills,
      status: "active",
    });
  };

  const activeEntries = entries.filter(e => e.status === "active");
  const matchedEntries = entries.filter(e => e.status === "matched");

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <ThemedText type="h4">Available for Replacement Work</ThemedText>
              <ThemedText style={{ color: theme.textSecondary }}>
                {isAvailable ? "AI will match you with open shifts" : "You won't receive new requests"}
              </ThemedText>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: theme.border, true: Colors.success + "60" }}
              thumbColor={isAvailable ? Colors.success : theme.textSecondary}
            />
          </View>
        </Card>

        <Pressable
          style={[styles.addButton, { backgroundColor: Colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Feather name="plus" size={20} color="#fff" />
          <ThemedText style={styles.addButtonText}>Add Availability</ThemedText>
        </Pressable>

        {matchedEntries.length > 0 ? (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              <Feather name="check-circle" size={18} color={Colors.success} /> Matched Shifts
            </ThemedText>
            {matchedEntries.map(entry => (
              <Card key={entry.id} style={styles.matchedEntryCard}>
                <View style={styles.entryHeader}>
                  <ThemedText type="h4">{formatDate(entry.date)}</ThemedText>
                  <View style={[styles.statusBadge, { backgroundColor: Colors.success + "20" }]}>
                    <ThemedText style={[styles.statusText, { color: Colors.success }]}>Matched</ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.matchedProject, { color: Colors.primary }]}>
                  {entry.matchedProject}
                </ThemedText>
                <View style={styles.entryDetails}>
                  <View style={styles.detailItem}>
                    <Feather name="clock" size={14} color={theme.textSecondary} />
                    <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
                      {entry.startTime} - {entry.endTime}
                    </ThemedText>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>Upcoming Availability</ThemedText>
          {activeEntries.length > 0 ? (
            activeEntries.map(entry => (
              <Card key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <ThemedText type="h4">{formatDate(entry.date)}</ThemedText>
                  <Pressable onPress={() => deleteMutation.mutate(entry.id)}>
                    <Feather name="trash-2" size={18} color={Colors.error} />
                  </Pressable>
                </View>
                <View style={styles.entryDetails}>
                  <View style={styles.detailItem}>
                    <Feather name="clock" size={14} color={theme.textSecondary} />
                    <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
                      {entry.startTime} - {entry.endTime} (up to {entry.maxHours}h)
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.skillsRow}>
                  {entry.skills.map(skill => (
                    <View key={skill} style={[styles.skillBadge, { backgroundColor: Colors.primary + "20" }]}>
                      <ThemedText style={[styles.skillText, { color: Colors.primary }]}>{skill}</ThemedText>
                    </View>
                  ))}
                </View>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Feather name="calendar" size={32} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No upcoming availability set
              </ThemedText>
            </Card>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <ThemedView style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Pressable onPress={() => setShowAddModal(false)}>
              <ThemedText style={{ color: Colors.primary }}>Cancel</ThemedText>
            </Pressable>
            <ThemedText type="h4">Add Availability</ThemedText>
            <Pressable onPress={handleAdd} disabled={!selectedDate || addMutation.isPending}>
              <ThemedText style={{ color: selectedDate ? Colors.primary : theme.textSecondary }}>
                Save
              </ThemedText>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <ThemedText type="h4" style={styles.modalSectionTitle}>Select Date</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {upcomingDates.map(({ date, dayName, dayNum, month }) => (
                <Pressable
                  key={date}
                  style={[
                    styles.dateCard,
                    { borderColor: selectedDate === date ? Colors.primary : theme.border },
                    selectedDate === date ? { backgroundColor: Colors.primary + "10" } : null,
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <ThemedText style={[styles.dateDayName, { color: theme.textSecondary }]}>{dayName}</ThemedText>
                  <ThemedText style={[styles.dateDayNum, selectedDate === date ? { color: Colors.primary } : null]}>
                    {dayNum}
                  </ThemedText>
                  <ThemedText style={[styles.dateMonth, { color: theme.textSecondary }]}>{month}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>

            <ThemedText type="h4" style={styles.modalSectionTitle}>Max Hours</ThemedText>
            <View style={styles.hoursRow}>
              {[4, 6, 8, 10, 12].map(hours => (
                <Pressable
                  key={hours}
                  style={[
                    styles.hoursOption,
                    { borderColor: maxHours === hours ? Colors.primary : theme.border },
                    maxHours === hours ? { backgroundColor: Colors.primary + "10" } : null,
                  ]}
                  onPress={() => setMaxHours(hours)}
                >
                  <ThemedText style={maxHours === hours ? { color: Colors.primary, fontWeight: "600" } : undefined}>
                    {hours}h
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedText type="h4" style={styles.modalSectionTitle}>Skills Available</ThemedText>
            <View style={styles.skillsGrid}>
              {allSkills.map(skill => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <Pressable
                    key={skill}
                    style={[
                      styles.skillOption,
                      { borderColor: isSelected ? Colors.primary : theme.border },
                      isSelected ? { backgroundColor: Colors.primary + "10" } : null,
                    ]}
                    onPress={() => toggleSkill(skill)}
                  >
                    {isSelected ? <Feather name="check" size={14} color={Colors.primary} /> : null}
                    <ThemedText style={isSelected ? { color: Colors.primary } : undefined}>{skill}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  statusCard: {
    marginBottom: Spacing.lg,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusInfo: {
    flex: 1,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  addButtonText: {
    color: "#fff",
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  entryCard: {
    marginBottom: Spacing.sm,
  },
  matchedEntryCard: {
    marginBottom: Spacing.sm,
    borderLeftColor: Colors.success,
    borderLeftWidth: 3,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
  },
  matchedProject: {
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  entryDetails: {
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: FontSizes.sm,
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  skillBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  skillText: {
    fontSize: FontSizes.xs,
    fontWeight: "500",
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  modalSectionTitle: {
    marginBottom: Spacing.md,
  },
  dateScroll: {
    marginBottom: Spacing.xl,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  dateCard: {
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginRight: Spacing.sm,
    minWidth: 60,
  },
  dateDayName: {
    fontSize: FontSizes.xs,
  },
  dateDayNum: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
  },
  dateMonth: {
    fontSize: FontSizes.xs,
  },
  hoursRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  hoursOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  skillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  skillOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
});
