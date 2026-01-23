import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, TextInput } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api, CrewMember } from "@/lib/api";
import { mockCrewMembers } from "@/lib/mockData";
import { Colors, Spacing, BorderRadius, FontSizes, Fonts } from "@/constants/theme";
import { Card, CardContent } from "@/components/Card";

const roleLabels: Record<string, string> = {
  crew_member: "Crew Member",
  lead: "Lead",
  foreman: "Foreman",
  project_manager: "Project Manager",
  admin: "Admin",
};

const roleColors: Record<string, string> = {
  crew_member: Colors.secondary,
  lead: Colors.primary,
  foreman: Colors.accent,
  project_manager: "#7B1FA2",
  admin: "#C62828",
};

export default function CrewScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: crew = mockCrewMembers, refetch } = useQuery({
    queryKey: ["/api/mobile/crew"],
    queryFn: async () => {
      try {
        const result = await api.crew.list();
        if ("error" in result) return mockCrewMembers;
        return result;
      } catch {
        return mockCrewMembers;
      }
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredCrew = crew.filter((member) => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const skillsMatch = member.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    return fullName.includes(searchQuery.toLowerCase()) || skillsMatch;
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + Spacing.md, paddingBottom: insets.bottom + Spacing.xl }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or skill..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.countText}>{filteredCrew.length} crew member{filteredCrew.length !== 1 ? "s" : ""}</Text>

        {filteredCrew.map((member) => (
          <Card key={member.id} style={styles.memberCard}>
            <CardContent>
              <View style={styles.memberHeader}>
                <View style={[styles.avatar, { backgroundColor: roleColors[member.role] || Colors.secondary }]}>
                  <Text style={styles.avatarText}>{getInitials(member.firstName, member.lastName)}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.firstName} {member.lastName}</Text>
                  <Text style={[styles.roleText, { color: roleColors[member.role] || Colors.secondary }]}>
                    {roleLabels[member.role] || member.role}
                  </Text>
                </View>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>Lv {member.level}</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Feather name="star" size={14} color={Colors.accent} />
                  <Text style={styles.statValue}>{member.rating.toFixed(1)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Feather name="check-circle" size={14} color={Colors.primary} />
                  <Text style={styles.statValue}>{member.tasksCompleted}</Text>
                </View>
                <View style={styles.statItem}>
                  <Feather name="zap" size={14} color={Colors.secondary} />
                  <Text style={styles.statValue}>{member.xp.toLocaleString()} XP</Text>
                </View>
              </View>

              <View style={styles.skillsContainer}>
                <Text style={styles.skillsLabel}>Skills</Text>
                <View style={styles.skillsRow}>
                  {member.skills.slice(0, 4).map((skill, index) => (
                    <View key={index} style={styles.skillChip}>
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                  {member.skills.length > 4 ? (
                    <View style={styles.skillChip}>
                      <Text style={styles.skillText}>+{member.skills.length - 4}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.contactRow}>
                <Pressable style={styles.contactButton}>
                  <Feather name="phone" size={16} color={Colors.primary} />
                  <Text style={styles.contactText}>Call</Text>
                </Pressable>
                <Pressable style={styles.contactButton}>
                  <Feather name="mail" size={16} color={Colors.primary} />
                  <Text style={styles.contactText}>Email</Text>
                </Pressable>
                <Pressable style={styles.contactButton}>
                  <Feather name="message-circle" size={16} color={Colors.primary} />
                  <Text style={styles.contactText}>Message</Text>
                </Pressable>
              </View>
            </CardContent>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: FontSizes.md,
    color: Colors.text,
    paddingVertical: Spacing.md,
  },
  countText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  memberCard: {
    marginBottom: Spacing.md,
  },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    color: "#fff",
  },
  memberInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  memberName: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    color: Colors.text,
  },
  roleText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  levelBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  levelText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xs,
    color: "#fff",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statValue: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  skillsContainer: {
    marginBottom: Spacing.md,
  },
  skillsLabel: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  skillChip: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  skillText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
    color: Colors.text,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  contactText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    color: Colors.primary,
  },
});
