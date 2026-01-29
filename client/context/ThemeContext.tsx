import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/theme";

type ThemeMode = "light" | "dark" | "system";

export type AccentColor = "blue" | "orange" | "green" | "purple" | "pink" | "teal";

const accentColors: Record<AccentColor, { primary: string; primaryDark: string }> = {
  blue: { primary: "#0ea5e9", primaryDark: "#0284c7" },
  orange: { primary: "#f97316", primaryDark: "#ea580c" },
  green: { primary: "#10b981", primaryDark: "#059669" },
  purple: { primary: "#8b5cf6", primaryDark: "#7c3aed" },
  pink: { primary: "#ec4899", primaryDark: "#db2777" },
  teal: { primary: "#14b8a6", primaryDark: "#0d9488" },
};

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  theme: typeof Colors.light;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  accentColors: { primary: string; primaryDark: string };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@crewme_theme_mode";
const ACCENT_STORAGE_KEY = "@crewme_accent_color";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [accentColor, setAccentColorState] = useState<AccentColor>("blue");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const [storedTheme, storedAccent] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(ACCENT_STORAGE_KEY),
      ]);
      if (storedTheme && (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system")) {
        setThemeModeState(storedTheme as ThemeMode);
      }
      if (storedAccent && Object.keys(accentColors).includes(storedAccent)) {
        setAccentColorState(storedAccent as AccentColor);
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  };

  const setAccentColor = async (color: AccentColor) => {
    setAccentColorState(color);
    try {
      await AsyncStorage.setItem(ACCENT_STORAGE_KEY, color);
    } catch (error) {
      console.error("Failed to save accent preference:", error);
    }
  };

  const resolvedColorScheme = themeMode === "system" ? (systemColorScheme ?? "light") : themeMode;
  const isDark = resolvedColorScheme === "dark";
  const theme = Colors[resolvedColorScheme];
  const currentAccentColors = accentColors[accentColor];

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ 
      themeMode, 
      setThemeMode, 
      isDark, 
      theme, 
      accentColor, 
      setAccentColor,
      accentColors: currentAccentColors 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}
