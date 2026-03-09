import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, ThemeColors } from '../constants/theme';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: Colors.light,
  isDark: false,
});

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? Colors.dark : Colors.light,
      isDark,
    }),
    [isDark]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function useThemeColors(): ThemeColors {
  const { colors } = useContext(ThemeContext);
  return colors;
}
