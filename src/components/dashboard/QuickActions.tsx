import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography } from '../../constants/theme';

interface QuickAction {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  colorKey: 'primary' | 'success' | 'info' | 'warning' | 'error' | 'secondary';
}

interface QuickActionsProps {
  onPress: (actionKey: string) => void;
}

const ACTIONS: QuickAction[] = [
  { key: 'new_client', label: 'Novo Cliente', icon: 'person-add-outline', colorKey: 'primary' },
  { key: 'new_case', label: 'Novo Processo', icon: 'briefcase-outline', colorKey: 'info' },
  { key: 'new_event', label: 'Novo Evento', icon: 'calendar-outline', colorKey: 'success' },
  { key: 'new_task', label: 'Nova Tarefa', icon: 'checkbox-outline', colorKey: 'warning' },
  { key: 'new_document', label: 'Documento', icon: 'document-attach-outline', colorKey: 'secondary' },
  { key: 'new_finance', label: 'Financeiro', icon: 'cash-outline', colorKey: 'success' },
  { key: 'new_lead', label: 'Novo Lead', icon: 'trending-up-outline', colorKey: 'error' },
  { key: 'timer', label: 'Cronometro', icon: 'timer-outline', colorKey: 'info' },
];

export default function QuickActions({ onPress }: QuickActionsProps) {
  const { colors } = useTheme();

  const getColor = (colorKey: QuickAction['colorKey']): string => {
    const map: Record<QuickAction['colorKey'], string> = {
      primary: colors.primary,
      success: colors.success,
      info: colors.info,
      warning: colors.warning,
      error: colors.error,
      secondary: colors.secondary,
    };
    return map[colorKey];
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Acoes Rapidas</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {ACTIONS.map((action) => {
          const color = getColor(action.colorKey);

          return (
            <TouchableOpacity
              key={action.key}
              style={styles.actionItem}
              onPress={() => onPress(action.key)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colors.card, borderColor: color },
                ]}
              >
                <Ionicons name={action.icon} size={22} color={color} />
              </View>
              <Text
                style={[styles.label, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  actionItem: {
    alignItems: 'center',
    width: 72,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: Typography.xs,
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium,
  },
});
