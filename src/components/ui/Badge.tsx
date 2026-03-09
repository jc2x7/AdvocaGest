import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemeColors } from '../../store/ThemeContext';
import { ThemeColors } from '../../constants/theme';
import { BorderRadius, Spacing, Typography } from '../../constants/theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const getVariantStyles = (
  variant: BadgeVariant,
  colors: ThemeColors
): { bg: string; text: string } => {
  switch (variant) {
    case 'success':
      return { bg: colors.successLight, text: colors.success };
    case 'warning':
      return { bg: colors.warningLight, text: colors.warning };
    case 'error':
      return { bg: colors.errorLight, text: colors.error };
    case 'info':
      return { bg: colors.infoLight, text: colors.info };
    case 'neutral':
      return { bg: colors.surfaceVariant, text: colors.textSecondary };
  }
};

export default function Badge({
  label,
  variant = 'neutral',
  style,
  textStyle,
}: BadgeProps) {
  const colors = useThemeColors();
  const variantColors = getVariantStyles(variant, colors);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: variantColors.bg },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: variantColors.text },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
  },
  text: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
});
