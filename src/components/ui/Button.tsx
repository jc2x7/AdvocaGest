import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useThemeColors } from '../../store/ThemeContext';
import { ThemeColors } from '../../constants/theme';
import { BorderRadius, Spacing, Typography } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
type IconPosition = 'left' | 'right';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: IconPosition;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const getVariantStyles = (
  variant: ButtonVariant,
  colors: ThemeColors
): { container: ViewStyle; text: TextStyle; spinnerColor: string } => {
  switch (variant) {
    case 'primary':
      return {
        container: { backgroundColor: colors.primary },
        text: { color: '#ffffff' },
        spinnerColor: '#ffffff',
      };
    case 'secondary':
      return {
        container: { backgroundColor: colors.surfaceVariant },
        text: { color: colors.text },
        spinnerColor: colors.text,
      };
    case 'outline':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        },
        text: { color: colors.primary },
        spinnerColor: colors.primary,
      };
    case 'ghost':
      return {
        container: { backgroundColor: 'transparent' },
        text: { color: colors.primary },
        spinnerColor: colors.primary,
      };
    case 'danger':
      return {
        container: { backgroundColor: colors.error },
        text: { color: '#ffffff' },
        spinnerColor: '#ffffff',
      };
  }
};

const getSizeStyles = (
  size: ButtonSize
): { container: ViewStyle; text: TextStyle; spinnerSize: number } => {
  switch (size) {
    case 'sm':
      return {
        container: {
          paddingVertical: Spacing.xs + 2,
          paddingHorizontal: Spacing.md,
          borderRadius: BorderRadius.sm,
        },
        text: { fontSize: Typography.sm },
        spinnerSize: 16,
      };
    case 'md':
      return {
        container: {
          paddingVertical: Spacing.sm + 4,
          paddingHorizontal: Spacing.lg,
          borderRadius: BorderRadius.md,
        },
        text: { fontSize: Typography.md },
        spinnerSize: 20,
      };
    case 'lg':
      return {
        container: {
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.xl,
          borderRadius: BorderRadius.md,
        },
        text: { fontSize: Typography.lg },
        spinnerSize: 24,
      };
  }
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}: ButtonProps) {
  const colors = useThemeColors();
  const variantStyles = getVariantStyles(variant, colors);
  const sizeStyles = getSizeStyles(size);
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.container,
        variantStyles.container,
        sizeStyles.container,
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size={sizeStyles.spinnerSize < 20 ? 'small' : 'small'}
          color={variantStyles.spinnerColor}
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text
            style={[
              styles.text,
              variantStyles.text,
              sizeStyles.text,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: Typography.fontWeight.semibold,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});
