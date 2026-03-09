import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../store/ThemeContext';
import { Shadows, Spacing, Typography } from '../../constants/theme';

interface TabRoute {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
}

interface CustomTabBarProps {
  routes: TabRoute[];
  activeKey: string;
  onTabPress: (key: string) => void;
  fabIcon?: keyof typeof Ionicons.glyphMap;
  onFabPress?: () => void;
  fabIndex?: number;
}

export default function CustomTabBar({
  routes,
  activeKey,
  onTabPress,
  fabIcon = 'add',
  onFabPress,
  fabIndex,
}: CustomTabBarProps) {
  const colors = useThemeColors();
  const centralIndex = fabIndex ?? Math.floor(routes.length / 2);

  return (
    <View
      style={[
        styles.container,
        Shadows.md,
        {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
        },
      ]}
    >
      {routes.map((route, index) => {
        const isActive = route.key === activeKey;
        const isCentralSlot = index === centralIndex && onFabPress;

        if (isCentralSlot) {
          return (
            <View key={route.key} style={styles.tabItem}>
              <View style={styles.fabContainer}>
                <TouchableOpacity
                  onPress={onFabPress}
                  activeOpacity={0.8}
                  style={[
                    styles.fab,
                    Shadows.lg,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons name={fabIcon} size={28} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? colors.primary : colors.textTertiary,
                  },
                ]}
              >
                {route.label}
              </Text>
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => onTabPress(route.key)}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? route.iconFocused : route.icon}
              size={24}
              color={isActive ? colors.primary : colors.textTertiary}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? colors.primary : colors.textTertiary,
                  fontWeight: isActive
                    ? Typography.fontWeight.semibold
                    : Typography.fontWeight.regular,
                },
              ]}
            >
              {route.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : Spacing.sm,
    paddingTop: Spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  fabContainer: {
    position: 'relative',
    top: -20,
    marginBottom: -14,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
