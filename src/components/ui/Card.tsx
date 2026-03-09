import React, { ReactNode } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useThemeColors } from '../../store/ThemeContext';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';

interface CardProps {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  noPadding?: boolean;
}

export default function Card({
  header,
  children,
  footer,
  onPress,
  style,
  noPadding = false,
}: CardProps) {
  const colors = useThemeColors();

  const cardContent = (
    <>
      {header && (
        <View
          style={[
            styles.header,
            { borderBottomColor: colors.border },
          ]}
        >
          {header}
        </View>
      )}
      <View style={[styles.body, noPadding && styles.noPadding]}>
        {children}
      </View>
      {footer && (
        <View
          style={[
            styles.footer,
            { borderTopColor: colors.border },
          ]}
        >
          {footer}
        </View>
      )}
    </>
  );

  const containerStyle: ViewStyle[] = [
    styles.container,
    Shadows.md,
    {
      backgroundColor: colors.card,
      borderColor: colors.borderLight,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={containerStyle}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{cardContent}</View>;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  body: {
    padding: Spacing.md,
  },
  noPadding: {
    padding: 0,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
  },
});
