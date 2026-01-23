import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { mockUser } from "@/lib/mockData";

export default function CrewIDCardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user } = useAuth();

  const currentUser = user || mockUser;
  const crewId = `CM-${currentUser.id?.slice(-6)?.toUpperCase() || "001234"}`;
  const skills = ["Electrical", "HVAC", "Blueprint Reading"];
  const emergencyContact = {
    name: "Maria Johnson",
    phone: "(555) 123-4567",
    relationship: "Spouse",
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `CrewMe ID Card\nName: ${currentUser.firstName} ${currentUser.lastName}\nCrew ID: ${crewId}\nRole: ${currentUser.role}`,
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  const generateQRPattern = () => {
    const pattern = [];
    for (let i = 0; i < 15; i++) {
      const row = [];
      for (let j = 0; j < 15; j++) {
        const isCorner = 
          (i < 3 && j < 3) || 
          (i < 3 && j > 11) || 
          (i > 11 && j < 3);
        const isCenter = i >= 6 && i <= 8 && j >= 6 && j <= 8;
        const isFilled = isCorner || isCenter || Math.random() > 0.5;
        row.push(isFilled);
      }
      pattern.push(row);
    }
    return pattern;
  };

  const qrPattern = generateQRPattern();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.idCard}
        >
          <View style={styles.cardHeader}>
            <View style={styles.logoContainer}>
              <Feather name="tool" size={24} color="#fff" />
              <ThemedText style={styles.logoText}>CrewMe</ThemedText>
            </View>
            <ThemedText style={styles.cardType}>CREW ID</ThemedText>
          </View>

          <View style={styles.photoSection}>
            <View style={styles.photoPlaceholder}>
              <Feather name="user" size={48} color={Colors.primary} />
            </View>
            <View style={styles.userInfo}>
              <ThemedText style={styles.userName}>
                {currentUser.firstName} {currentUser.lastName}
              </ThemedText>
              <ThemedText style={styles.userRole}>
                {currentUser.role?.replace("_", " ").toUpperCase() || "CREW MEMBER"}
              </ThemedText>
              <ThemedText style={styles.crewIdText}>
                ID: {crewId}
              </ThemedText>
            </View>
          </View>

          <View style={styles.qrSection}>
            <View style={styles.qrCode}>
              {qrPattern.map((row, i) => (
                <View key={i} style={styles.qrRow}>
                  {row.map((filled, j) => (
                    <View
                      key={j}
                      style={[
                        styles.qrCell,
                        { backgroundColor: filled ? "#000" : "#fff" }
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
            <ThemedText style={styles.scanText}>
              Scan for attendance check-in
            </ThemedText>
          </View>

          <View style={styles.cardFooter}>
            <ThemedText style={styles.footerText}>
              Valid Through: 12/2026
            </ThemedText>
          </View>
        </LinearGradient>

        <Card style={styles.skillsCard}>
          <View style={styles.sectionHeader}>
            <Feather name="award" size={20} color={Colors.primary} />
            <ThemedText type="h4">Skills & Certifications</ThemedText>
          </View>
          <View style={styles.skillsContainer}>
            {skills.map((skill, index) => (
              <View key={index} style={[styles.skillBadge, { backgroundColor: Colors.primary + "20" }]}>
                <ThemedText style={[styles.skillText, { color: Colors.primary }]}>
                  {skill}
                </ThemedText>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.emergencyCard}>
          <View style={styles.sectionHeader}>
            <Feather name="phone" size={20} color={Colors.error} />
            <ThemedText type="h4">Emergency Contact</ThemedText>
          </View>
          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <ThemedText style={{ color: theme.textSecondary }}>Name:</ThemedText>
              <ThemedText style={styles.contactValue}>{emergencyContact.name}</ThemedText>
            </View>
            <View style={styles.contactRow}>
              <ThemedText style={{ color: theme.textSecondary }}>Phone:</ThemedText>
              <ThemedText style={[styles.contactValue, { color: Colors.primary }]}>
                {emergencyContact.phone}
              </ThemedText>
            </View>
            <View style={styles.contactRow}>
              <ThemedText style={{ color: theme.textSecondary }}>Relationship:</ThemedText>
              <ThemedText style={styles.contactValue}>{emergencyContact.relationship}</ThemedText>
            </View>
          </View>
        </Card>

        <View style={styles.actions}>
          <Pressable style={[styles.actionButton, { backgroundColor: Colors.primary }]} onPress={handleShare}>
            <Feather name="share-2" size={20} color="#fff" />
            <ThemedText style={styles.actionButtonText}>Share ID Card</ThemedText>
          </Pressable>
          <Pressable style={[styles.actionButton, { backgroundColor: theme.backgroundSecondary, borderWidth: 1, borderColor: theme.border }]}>
            <Feather name="download" size={20} color={Colors.primary} />
            <ThemedText style={[styles.actionButtonText, { color: Colors.primary }]}>Save to Photos</ThemedText>
          </Pressable>
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
  idCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  logoText: {
    color: "#fff",
    fontSize: FontSizes.lg,
    fontWeight: "700",
  },
  cardType: {
    color: "#fff",
    fontSize: FontSizes.sm,
    fontWeight: "600",
    letterSpacing: 2,
  },
  photoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: "#fff",
    fontSize: FontSizes.xl,
    fontWeight: "700",
    marginBottom: 4,
  },
  userRole: {
    color: "rgba(255,255,255,0.8)",
    fontSize: FontSizes.sm,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 4,
  },
  crewIdText: {
    color: "#fff",
    fontSize: FontSizes.md,
    fontWeight: "500",
  },
  qrSection: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  qrCode: {
    backgroundColor: "#fff",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  qrRow: {
    flexDirection: "row",
  },
  qrCell: {
    width: 10,
    height: 10,
  },
  scanText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: FontSizes.sm,
  },
  cardFooter: {
    alignItems: "center",
  },
  footerText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: FontSizes.xs,
  },
  skillsCard: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  skillBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  skillText: {
    fontSize: FontSizes.sm,
    fontWeight: "500",
  },
  emergencyCard: {
    marginBottom: Spacing.lg,
  },
  contactInfo: {
    gap: Spacing.sm,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  contactValue: {
    fontWeight: "500",
  },
  actions: {
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
});
