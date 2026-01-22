import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ImageBackground,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { XPProgressBar } from "@/components/XPProgressBar";
import { BadgeCard } from "@/components/BadgeCard";
import { SkillTreeNode } from "@/components/SkillTreeNode";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { api, Badge, SkillTree } from "@/lib/api";
import { ProgressStackParamList } from "@/navigation/ProgressStackNavigator";

type NavigationProp = NativeStackNavigationProp<ProgressStackParamList>;

const tradeIcons: Record<string, keyof typeof Feather.glyphMap> = {
  carpentry: "tool",
  electrical: "zap",
  plumbing: "droplet",
  hvac: "wind",
  masonry: "box",
  welding: "target",
};

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);

  const { data: badges, isLoading: badgesLoading, refetch: refetchBadges } = useQuery({
    queryKey: ["/api/gamification/badges"],
    queryFn: async () => {
      const response = await api.gamification.badges();
      return response.data || [];
    },
  });

  const { data: skillTrees, isLoading: skillsLoading, refetch: refetchSkills } = useQuery({
    queryKey: ["/api/skills/trees"],
    queryFn: async () => {
      const response = await api.skills.trees();
      return response.data || [];
    },
  });

  const { data: xpData, refetch: refetchXp } = useQuery({
    queryKey: ["/api/gamification/xp"],
    queryFn: async () => {
      const response = await api.gamification.xp();
      return response.data || { xp: 0, level: 1, nextLevelXp: 1000 };
    },
  });

  const handleRefresh = () => {
    refetchBadges();
    refetchSkills();
    refetchXp();
  };

  const handleLeaderboardPress = () => {
    navigation.navigate("Leaderboard");
  };

  const unlockedBadges = (badges || []).filter((b: Badge) => b.isUnlocked);
  const lockedBadges = (badges || []).filter((b: Badge) => !b.isUnlocked);
  const currentTree = selectedTrade
    ? (skillTrees || []).find((t: SkillTree) => t.id === selectedTrade)
    : null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      <Card style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <View style={styles.levelInfo}>
            <View style={styles.levelBadge}>
              <ThemedText style={styles.levelNumber}>
                {xpData?.level || user?.level || 1}
              </ThemedText>
            </View>
            <View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Current Level
              </ThemedText>
              <ThemedText type="h3">
                {xpData?.xp?.toLocaleString() || user?.xp?.toLocaleString() || 0} XP
              </ThemedText>
            </View>
          </View>
          <Pressable onPress={handleLeaderboardPress} style={styles.leaderboardButton}>
            <Feather name="bar-chart-2" size={20} color={Colors.primary} />
            <ThemedText style={{ color: Colors.primary, fontWeight: "600" }}>
              Leaderboard
            </ThemedText>
          </Pressable>
        </View>
        <XPProgressBar
          currentXP={xpData?.xp || 0}
          nextLevelXP={xpData?.nextLevelXp || 1000}
          level={xpData?.level || 1}
          showLabel={false}
        />
        <ThemedText type="small" style={[styles.xpToNext, { color: theme.textSecondary }]}>
          {((xpData?.nextLevelXp || 1000) - (xpData?.xp || 0)).toLocaleString()} XP to next level
        </ThemedText>
      </Card>

      <View style={styles.section}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Badges ({unlockedBadges.length}/{(badges || []).length})
        </ThemedText>
        {badgesLoading ? (
          <View style={styles.badgesLoading}>
            <LoadingSkeleton width={70} height={70} borderRadius={35} />
            <LoadingSkeleton width={70} height={70} borderRadius={35} />
            <LoadingSkeleton width={70} height={70} borderRadius={35} />
            <LoadingSkeleton width={70} height={70} borderRadius={35} />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesContainer}
          >
            {unlockedBadges.map((badge: Badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
            {lockedBadges.slice(0, 3).map((badge: Badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Skill Trees
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tradesContainer}
        >
          {skillsLoading ? (
            <>
              <LoadingSkeleton width={100} height={80} borderRadius={BorderRadius.xs} />
              <LoadingSkeleton width={100} height={80} borderRadius={BorderRadius.xs} />
              <LoadingSkeleton width={100} height={80} borderRadius={BorderRadius.xs} />
            </>
          ) : (
            (skillTrees || []).map((tree: SkillTree) => (
              <Pressable
                key={tree.id}
                onPress={() => setSelectedTrade(selectedTrade === tree.id ? null : tree.id)}
                style={[
                  styles.tradeCard,
                  {
                    backgroundColor:
                      selectedTrade === tree.id
                        ? Colors.primary
                        : theme.backgroundDefault,
                    borderColor:
                      selectedTrade === tree.id ? Colors.primary : theme.border,
                  },
                ]}
              >
                <Feather
                  name={tradeIcons[tree.id.toLowerCase()] || "tool"}
                  size={24}
                  color={selectedTrade === tree.id ? "#FFFFFF" : Colors.primary}
                />
                <ThemedText
                  type="small"
                  style={{
                    color: selectedTrade === tree.id ? "#FFFFFF" : theme.text,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  {tree.name}
                </ThemedText>
                <ThemedText
                  style={{
                    fontSize: 11,
                    color:
                      selectedTrade === tree.id
                        ? "rgba(255,255,255,0.8)"
                        : theme.textSecondary,
                  }}
                >
                  Lvl {tree.currentLevel}/5
                </ThemedText>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>

      {currentTree ? (
        <ImageBackground
          source={require("../../assets/images/skill-tree-bg.png")}
          style={styles.skillTreeContainer}
          imageStyle={styles.skillTreeBg}
        >
          <View style={styles.skillTreeHeader}>
            <ThemedText type="h4">{currentTree.name}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Level {currentTree.currentLevel}/5
            </ThemedText>
          </View>
          <View style={styles.skillTreeProgress}>
            <XPProgressBar
              currentXP={Math.round(currentTree.progress * 100)}
              nextLevelXP={100}
              level={currentTree.currentLevel}
              showLabel={false}
            />
          </View>
          {currentTree.levels.map((level, levelIndex) => (
            <View key={level.level} style={styles.skillLevel}>
              <View
                style={[
                  styles.levelIndicator,
                  {
                    backgroundColor: level.isUnlocked
                      ? Colors.primary
                      : theme.backgroundSecondary,
                  },
                ]}
              >
                <ThemedText
                  style={{
                    color: level.isUnlocked ? "#FFFFFF" : theme.textSecondary,
                    fontWeight: "700",
                    fontSize: 12,
                  }}
                >
                  {level.level}
                </ThemedText>
              </View>
              <View style={styles.skillNodes}>
                {level.skills.map((skill) => (
                  <SkillTreeNode key={skill.id} skill={skill} />
                ))}
              </View>
            </View>
          ))}
        </ImageBackground>
      ) : (
        <Card style={styles.selectTradeCard}>
          <Feather name="git-branch" size={40} color={theme.textSecondary} />
          <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
            Select a trade above to view skill tree
          </ThemedText>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  levelCard: {
    marginBottom: Spacing.xl,
  },
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  levelInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.xpGold,
    justifyContent: "center",
    alignItems: "center",
  },
  levelNumber: {
    color: "#1A1D1F",
    fontSize: 20,
    fontWeight: "700",
  },
  leaderboardButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + "15",
  },
  xpToNext: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  badgesLoading: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  badgesContainer: {
    paddingVertical: Spacing.sm,
  },
  tradesContainer: {
    gap: Spacing.md,
  },
  tradeCard: {
    width: 100,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    marginRight: Spacing.md,
  },
  skillTreeContainer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
  },
  skillTreeBg: {
    opacity: 0.1,
    borderRadius: BorderRadius.xs,
  },
  skillTreeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  skillTreeProgress: {
    marginBottom: Spacing.xl,
  },
  skillLevel: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  levelIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  skillNodes: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
  },
  selectTradeCard: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
});
