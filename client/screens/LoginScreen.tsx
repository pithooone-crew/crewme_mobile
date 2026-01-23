import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        setError(result.error || "Login failed");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[Colors.secondary, Colors.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + Spacing["4xl"], paddingBottom: insets.bottom + Spacing["2xl"] },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText type="h1" style={styles.title}>
            CrewMe
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Construction Crew Management
          </ThemedText>
        </View>

        <View style={styles.formContainer}>
          <Image
            source={require("../../assets/images/welcome-hero.png")}
            style={styles.heroImage}
            resizeMode="contain"
          />

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9BA1A6"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                testID="input-email"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#9BA1A6"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                testID="input-password"
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            ) : null}

            <Button
              onPress={handleLogin}
              disabled={isLoading}
              style={styles.loginButton}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                "Log In"
              )}
            </Button>

            <Pressable style={styles.forgotPassword}>
              <ThemedText style={styles.forgotPasswordText}>
                Forgot Password?
              </ThemedText>
            </Pressable>

            <View style={styles.demoHint}>
              <ThemedText style={styles.demoHintText}>
                Tip: Use "demo" as password to try the app
              </ThemedText>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing["2xl"],
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.lg,
  },
  title: {
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing["2xl"],
  },
  heroImage: {
    width: "100%",
    height: 160,
    marginBottom: Spacing["2xl"],
  },
  form: {
    gap: Spacing.lg,
  },
  inputContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: "#E1E4E8",
  },
  input: {
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    color: "#1A1D1F",
  },
  errorContainer: {
    backgroundColor: Colors.error + "15",
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: "center",
  },
  loginButton: {
    marginTop: Spacing.sm,
  },
  forgotPassword: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
  },
  demoHint: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    backgroundColor: Colors.secondary + "10",
    borderRadius: BorderRadius.xs,
  },
  demoHintText: {
    color: Colors.secondary,
    fontSize: 13,
  },
});
