import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";

interface TimeEntry {
  id: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  duration: number;
  project: string;
  status: "active" | "submitted" | "approved";
  estimatedPay?: number;
}

const mockTimeEntries: TimeEntry[] = [
  {
    id: "1",
    date: new Date().toISOString(),
    clockIn: "07:00 AM",
    clockOut: undefined,
    duration: 0,
    project: "Downtown Tower",
    status: "active",
  },
  {
    id: "2",
    date: new Date(Date.now() - 86400000).toISOString(),
    clockIn: "06:45 AM",
    clockOut: "03:30 PM",
    duration: 8.75,
    project: "Harbor Bridge Repair",
    status: "approved",
    estimatedPay: 262.50,
  },
  {
    id: "3",
    date: new Date(Date.now() - 172800000).toISOString(),
    clockIn: "07:15 AM",
    clockOut: "04:00 PM",
    duration: 8.75,
    project: "Downtown Tower",
    status: "approved",
    estimatedPay: 262.50,
  },
  {
    id: "4",
    date: new Date(Date.now() - 259200000).toISOString(),
    clockIn: "07:00 AM",
    clockOut: "03:45 PM",
    duration: 8.75,
    project: "City Mall Renovation",
    status: "approved",
    estimatedPay: 262.50,
  },
  {
    id: "5",
    date: new Date(Date.now() - 345600000).toISOString(),
    clockIn: "06:30 AM",
    clockOut: "03:15 PM",
    duration: 8.75,
    project: "Harbor Bridge Repair",
    status: "submitted",
    estimatedPay: 262.50,
  },
];

export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { isDemoMode } = useAuth();
  const [isClockedIn, setIsClockedIn] = useState(true);
  const [clockInTime, setClockInTime] = useState<Date>(new Date(Date.now() - 3600000 * 3));
  const [elapsedTime, setElapsedTime] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatElapsedTime = (startTime: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  useEffect(() => {
    if (isClockedIn && clockInTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(formatElapsedTime(clockInTime));
      }, 1000);
      setElapsedTime(formatElapsedTime(clockInTime));
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedTime("");
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isClockedIn, clockInTime]);

  const { data: timeEntries = mockTimeEntries, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/time-entries"],
    queryFn: async () => mockTimeEntries,
    enabled: isDemoMode,
  });

  const handleClockAction = () => {
    if (isClockedIn) {
      setIsClockedIn(false);
    } else {
      setIsClockedIn(true);
      setClockInTime(new Date());
    }
  };

  const totalHoursToday = isClockedIn 
    ? ((Date.now() - clockInTime.getTime()) / (1000 * 60 * 60)).toFixed(1)
    : "0.0";

  const weeklyHours = timeEntries.reduce((sum, entry) => sum + entry.duration, 0) + parseFloat(totalHoursToday);
  const weeklyPay = timeEntries.reduce((sum, entry) => sum + (entry.estimatedPay || 0), 0) + (parseFloat(totalHoursToday) * 30);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return Colors.success;
      case "approved": return Colors.primary;
      case "submitted": return Colors.warning;
      default: return theme.textSecondary;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
        }
      >
        <Card style={styles.clockCard}>
          <View style={styles.clockHeader}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: isClockedIn ? Colors.success : theme.textSecondary }
            ]} />
            <ThemedText type="h4">
              {isClockedIn ? "Currently Clocked In" : "Not Clocked In"}
            </ThemedText>
          </View>

          {isClockedIn ? (
            <View style={styles.clockInfo}>
              <ThemedText style={[styles.clockTime, { color: theme.textSecondary }]}>
                Started at {clockInTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </ThemedText>
              <View style={[styles.timerContainer, { backgroundColor: Colors.success + "15" }]}>
                <Feather name="clock" size={20} color={Colors.success} />
                <ThemedText style={styles.timerText}>{elapsedTime}</ThemedText>
              </View>
            </View>
          ) : null}

          <Pressable
            style={[
              styles.clockButton,
              { backgroundColor: isClockedIn ? Colors.error : Colors.success }
            ]}
            onPress={handleClockAction}
          >
            <Feather name={isClockedIn ? "log-out" : "log-in"} size={24} color="#fff" />
            <ThemedText style={styles.clockButtonText}>
              {isClockedIn ? "Clock Out" : "Clock In"}
            </ThemedText>
          </Pressable>

          <View style={styles.clockOptions}>
            <Pressable style={[styles.clockOption, { borderColor: theme.border }]}>
              <Feather name="camera" size={18} color={Colors.primary} />
              <ThemedText style={[styles.clockOptionText, { color: Colors.primary }]}>
                Scan QR
              </ThemedText>
            </Pressable>
            <Pressable style={[styles.clockOption, { borderColor: theme.border }]}>
              <Feather name="edit-3" size={18} color={Colors.primary} />
              <ThemedText style={[styles.clockOptionText, { color: Colors.primary }]}>
                Manual Entry
              </ThemedText>
            </Pressable>
          </View>
        </Card>

        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Feather name="clock" size={24} color={Colors.primary} />
            <ThemedText type="h2" style={styles.summaryValue}>
              {totalHoursToday}h
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Today
            </ThemedText>
          </Card>
          <Card style={styles.summaryCard}>
            <Feather name="calendar" size={24} color={Colors.accent} />
            <ThemedText type="h2" style={styles.summaryValue}>
              {weeklyHours.toFixed(1)}h
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              This Week
            </ThemedText>
          </Card>
          <Card style={styles.summaryCard}>
            <Feather name="dollar-sign" size={24} color={Colors.success} />
            <ThemedText type="h2" style={styles.summaryValue}>
              ${weeklyPay.toFixed(0)}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Est. Pay
            </ThemedText>
          </Card>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>Timesheet History</ThemedText>
          
          {timeEntries.map((entry) => (
            <Card key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View style={styles.entryDate}>
                  <ThemedText type="h4">{formatDate(entry.date)}</ThemedText>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(entry.status) + "20" }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(entry.status) }]} />
                    <ThemedText style={[styles.statusText, { color: getStatusColor(entry.status) }]}>
                      {entry.status === "active" ? "Active" : entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                    </ThemedText>
                  </View>
                </View>
                {entry.estimatedPay ? (
                  <ThemedText style={[styles.entryPay, { color: Colors.success }]}>
                    ${entry.estimatedPay.toFixed(2)}
                  </ThemedText>
                ) : null}
              </View>
              
              <ThemedText style={[styles.entryProject, { color: theme.textSecondary }]}>
                {entry.project}
              </ThemedText>
              
              <View style={styles.entryTimes}>
                <View style={styles.entryTimeItem}>
                  <Feather name="log-in" size={14} color={Colors.success} />
                  <ThemedText style={styles.entryTimeText}>{entry.clockIn}</ThemedText>
                </View>
                {entry.clockOut ? (
                  <>
                    <Feather name="arrow-right" size={14} color={theme.textSecondary} />
                    <View style={styles.entryTimeItem}>
                      <Feather name="log-out" size={14} color={Colors.error} />
                      <ThemedText style={styles.entryTimeText}>{entry.clockOut}</ThemedText>
                    </View>
                    <View style={styles.entryDuration}>
                      <ThemedText style={[styles.durationText, { color: Colors.primary }]}>
                        {entry.duration}h
                      </ThemedText>
                    </View>
                  </>
                ) : (
                  <ThemedText style={[styles.activeText, { color: Colors.success }]}>
                    In Progress...
                  </ThemedText>
                )}
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
  content: {
    paddingHorizontal: Spacing.lg,
  },
  clockCard: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
    marginBottom: Spacing.lg,
  },
  clockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  clockInfo: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  clockTime: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  timerText: {
    color: Colors.success,
    fontSize: FontSizes.xl,
    fontWeight: "700",
  },
  clockButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    width: "100%",
  },
  clockButtonText: {
    color: "#fff",
    fontSize: FontSizes.lg,
    fontWeight: "600",
  },
  clockOptions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  clockOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  clockOptionText: {
    fontSize: FontSizes.sm,
    fontWeight: "500",
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  summaryValue: {
    marginTop: Spacing.sm,
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
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
  },
  entryDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
  },
  entryPay: {
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  entryProject: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  entryTimes: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  entryTimeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  entryTimeText: {
    fontSize: FontSizes.sm,
  },
  entryDuration: {
    marginLeft: "auto",
  },
  durationText: {
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  activeText: {
    fontSize: FontSizes.sm,
    fontWeight: "500",
  },
});
