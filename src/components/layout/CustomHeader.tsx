import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../store/ThemeContext';
import { Spacing, Typography, Shadows } from '../../constants/theme';

interface CustomHeaderProps {
  title: string;
  onBack?: () => void;
  onSearch?: () => void;
  onNotifications?: () => void;
  notificationCount?: number;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export default function CustomHeader({
  title,
  onBack,
  onSearch,
  onNotifications,
  notificationCount = 0,
  rightAction,
  style,
}: CustomHeaderProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.container,
        Shadows.sm,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
        style,
      ]}
    >
      <View style={styles.leftSection}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text
          style={[styles.title, { color: colors.text }]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      <View style={styles.rightSection}>
        {onSearch && (
          <TouchableOpacity
            onPress={onSearch}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="search-outline"
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>
        )}

        {onNotifications && (
          <TouchableOpacity
            onPress={onNotifications}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.text}
            />
            {notificationCount > 0 && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.error },
                ]}
              >
                <Text style={styles.badgeText}>
                  {notificationCount > 99 ? '99+' : String(notificationCount)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {rightAction}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    minHeight: 56,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: '700',
    flexShrink: 1,
  },
  iconButton: {
    padding: Spacing.xs,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
});
