import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeContext, AccentColor } from "@/context/ThemeContext";

export function useTheme() {
  try {
    const context = useThemeContext();
    return {
      theme: context.theme,
      isDark: context.isDark,
      themeMode: context.themeMode,
      setThemeMode: context.setThemeMode,
      accentColor: context.accentColor,
      setAccentColor: context.setAccentColor,
      accentColors: context.accentColors,
    };
  } catch {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const theme = Colors[colorScheme ?? "light"];
    return {
      theme,
      isDark,
      themeMode: "system" as const,
      setThemeMode: () => {},
      accentColor: "blue" as AccentColor,
      setAccentColor: () => {},
      accentColors: { primary: Colors.primary, primaryDark: Colors.primaryDark },
    };
  }
}
