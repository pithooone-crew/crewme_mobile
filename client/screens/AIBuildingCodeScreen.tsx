import React, { useState, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { apiRequest } from "@/lib/query-client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

function EmptyState() {
  const { theme } = useTheme();

  const suggestions = [
    "What are the IBC requirements for stairway width?",
    "Minimum ceiling height for residential rooms?",
    "ADA door clearance requirements?",
    "Fire-rated wall assembly requirements?",
  ];

  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconCircle, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="book-open" size={40} color={Colors.primary} />
      </View>
      <ThemedText style={styles.emptyTitle}>Building Code Q&A</ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Ask any question about building codes, regulations, or compliance requirements.
      </ThemedText>
      <View style={styles.suggestionsContainer}>
        <ThemedText style={[styles.suggestionsLabel, { color: theme.textSecondary }]}>
          Try asking:
        </ThemedText>
        {suggestions.map((s, i) => (
          <View
            key={i}
            style={[styles.suggestionChip, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
          >
            <ThemedText style={[styles.suggestionText, { color: theme.textSecondary }]}>
              {s}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AIBuildingCodeScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = useCallback(async () => {
    const question = inputText.trim();
    if (!question || isLoading) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await apiRequest("POST", "/api/ai/building-code", {
        question,
        conversationHistory,
      });

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        timestamp: data.timestamp || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I couldn't process your question. Please check your connection and try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, messages]);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isUser = item.role === "user";
      return (
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : [styles.assistantBubble, { backgroundColor: theme.backgroundSecondary }],
          ]}
        >
          {!isUser ? (
            <View style={styles.assistantHeader}>
              <View style={[styles.assistantIcon, { backgroundColor: Colors.primary }]}>
                <Feather name="book-open" size={12} color="#FFFFFF" />
              </View>
              <ThemedText style={[styles.assistantLabel, { color: theme.textSecondary }]}>
                Code Assistant
              </ThemedText>
            </View>
          ) : null}
          <ThemedText
            style={[
              styles.messageText,
              isUser ? styles.userText : { color: theme.text },
            ]}
          >
            {item.content}
          </ThemedText>
        </View>
      );
    },
    [theme],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          inverted={messages.length > 0}
          data={messages.toReversed()}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: Spacing.md, paddingBottom: headerHeight + Spacing.md },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          testID="chat-messages-list"
        />

        {isLoading ? (
          <View style={[styles.typingIndicator, { backgroundColor: theme.backgroundSecondary }]}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <ThemedText style={[styles.typingText, { color: theme.textSecondary }]}>
              Looking up building codes...
            </ThemedText>
          </View>
        ) : null}

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.backgroundDefault,
              borderTopColor: theme.border,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
              },
            ]}
            placeholder="Ask about building codes..."
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
            testID="input-question"
          />
          <Pressable
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  inputText.trim() && !isLoading ? Colors.primary : theme.backgroundTertiary,
              },
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
            testID="button-send"
          >
            <Feather
              name="send"
              size={20}
              color={inputText.trim() && !isLoading ? "#FFFFFF" : theme.textSecondary}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
    paddingHorizontal: Spacing.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  suggestionsContainer: {
    width: "100%",
    gap: Spacing.sm,
  },
  suggestionsLabel: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  suggestionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
  messageBubble: {
    maxWidth: "85%",
    marginVertical: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  assistantHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  assistantIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  assistantLabel: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
  },
  messageText: {
    fontSize: FontSizes.md,
    lineHeight: 22,
  },
  userText: {
    color: "#FFFFFF",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    alignSelf: "flex-start",
  },
  typingText: {
    fontSize: FontSizes.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.md,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
