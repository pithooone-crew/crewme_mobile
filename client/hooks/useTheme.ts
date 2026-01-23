import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeContext } from "@/context/ThemeContext";

export function useTheme() {
  try {
    const context = useThemeContext();
    return {
      theme: context.theme,
      isDark: context.isDark,
      themeMode: context.themeMode,
      setThemeMode: context.setThemeMode,
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
    };
  }
}
