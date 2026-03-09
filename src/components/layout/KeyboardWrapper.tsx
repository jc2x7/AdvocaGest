import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useThemeColors } from '../../store/ThemeContext';

interface KeyboardWrapperProps {
  children: ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollEnabled?: boolean;
  keyboardVerticalOffset?: number;
}

export default function KeyboardWrapper({
  children,
  style,
  contentContainerStyle,
  scrollEnabled = true,
  keyboardVerticalOffset = 0,
}: KeyboardWrapperProps) {
  const colors = useThemeColors();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }, style]}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {scrollEnabled ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
