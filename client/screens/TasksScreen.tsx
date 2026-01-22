import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { TaskCard } from "@/components/TaskCard";
import { FilterChips } from "@/components/FilterChips";
import { EmptyState } from "@/components/EmptyState";
import { TaskCardSkeleton } from "@/components/LoadingSkeleton";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { api, Task } from "@/lib/api";
import { mockTasks } from "@/lib/mockData";
import { TasksStackParamList } from "@/navigation/TasksStackNavigator";

type NavigationProp = NativeStackNavigationProp<TasksStackParamList>;

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
];

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { isDemoMode } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: tasks,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      if (isDemoMode) {
        return mockTasks;
      }
      const response = await api.tasks.list();
      return response.data || mockTasks;
    },
  });

  const handleTaskPress = (taskId: string) => {
    navigation.navigate("TaskDetail", { taskId });
  };

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const filteredTasks = (tasks || []).filter((task: Task) => {
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const renderTask = ({ item }: { item: Task }) => (
    <TaskCard task={item} onPress={() => handleTaskPress(item.id)} />
  );

  const renderEmpty = () => (
    <EmptyState
      image={require("../../assets/images/empty-tasks.png")}
      title="No Tasks Found"
      message={
        statusFilter !== "all"
          ? `You don't have any ${statusFilter.replace("_", " ")} tasks`
          : "You don't have any tasks assigned yet"
      }
    />
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <TaskCardSkeleton />
      <TaskCardSkeleton />
      <TaskCardSkeleton />
      <TaskCardSkeleton />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={isLoading ? [] : filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
          filteredTasks.length === 0 && !isLoading && styles.emptyList,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View
              style={[
                styles.searchContainer,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              <Feather name="search" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search tasks..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                testID="input-search"
              />
              {searchQuery.length > 0 ? (
                <Feather
                  name="x"
                  size={20}
                  color={theme.textSecondary}
                  onPress={() => setSearchQuery("")}
                />
              ) : null}
            </View>
            <FilterChips
              options={statusFilters}
              selected={statusFilter}
              onSelect={setStatusFilter}
            />
          </View>
        }
        ListEmptyComponent={isLoading ? renderLoading : renderEmpty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  emptyList: {
    flexGrow: 1,
  },
  header: {
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    height: Spacing.inputHeight,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  loadingContainer: {
    paddingTop: Spacing.lg,
  },
});
