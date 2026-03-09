import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography } from '../../constants/theme';
import { formatDate, getDaysUntil, getUrgencyLabel } from '../../utils/dateUtils';
import { Deadline, DeadlineType, DeadlineStatus } from '../../types/deadline';

interface DeadlineItemProps {
  deadline: Deadline;
  onPress?: (deadline: Deadline) => void;
  onComplete?: (deadline: Deadline) => void;
}

const TYPE_CONFIG: Record<DeadlineType, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  judicial: { icon: 'hammer-outline', label: 'Judicial' },
  administrative: { icon: 'document-outline', label: 'Administrativo' },
  personal: { icon: 'person-outline', label: 'Pessoal' },
};

function getUrgencyColor(
  daysUntil: number,
  status: DeadlineStatus,
  colors: ReturnType<typeof import('../../store/ThemeContext').useTheme>['colors'],
): string {
  if (status === 'completed') return colors.success;
  if (daysUntil < 0) return colors.error;
  if (daysUntil === 0) return colors.error;
  if (daysUntil <= 3) return colors.warning;
  if (daysUntil <= 7) return colors.info;
  return colors.success;
}

function formatCountdown(daysUntil: number): string {
  if (daysUntil < 0) {
    const abs = Math.abs(daysUntil);
    return `${abs} dia${abs !== 1 ? 's' : ''} atrasado`;
  }
  if (daysUntil === 0) return 'Vence hoje';
  if (daysUntil === 1) return 'Vence amanha';
  return `${daysUntil} dia${daysUntil !== 1 ? 's' : ''} restantes`;
}

export default function DeadlineItem({
  deadline,
  onPress,
  onComplete,
}: DeadlineItemProps) {
  const { colors } = useTheme();

  const daysUntil = getDaysUntil(deadline.dueDate);
  const urgencyColor = getUrgencyColor(daysUntil, deadline.status, colors);
  const config = TYPE_CONFIG[deadline.type];
  const isCompleted = deadline.status === 'completed';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { borderBottomColor: colors.borderLight },
        isCompleted && styles.completedContainer,
      ]}
      onPress={() => onPress?.(deadline)}
      activeOpacity={0.7}
    >
      <TouchableOpacity
        style={[styles.checkbox, { borderColor: urgencyColor }]}
        onPress={() => onComplete?.(deadline)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {isCompleted && (
          <Ionicons name="checkmark" size={14} color={urgencyColor} />
        )}
      </TouchableOpacity>

      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: colors.text },
            isCompleted && styles.completedText,
          ]}
          numberOfLines={1}
        >
          {deadline.title}
        </Text>

        {deadline.caseName && (
          <View style={styles.metaRow}>
            <Ionicons name="briefcase-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {deadline.caseName}
            </Text>
          </View>
        )}

        <View style={styles.metaRow}>
          <Ionicons name={config.icon} size={12} color={colors.textTertiary} />
          <Text style={[styles.metaText, { color: colors.textTertiary }]}>
            {config.label}
          </Text>
          <Text style={[styles.metaText, { color: colors.textTertiary }]}>
            - {formatDate(deadline.dueDate)}
          </Text>
        </View>
      </View>

      <View style={styles.countdownContainer}>
        {!isCompleted ? (
          <>
            <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor + '20' }]}>
              <Text style={[styles.urgencyText, { color: urgencyColor }]}>
                {getUrgencyLabel(daysUntil)}
              </Text>
            </View>
            <Text style={[styles.countdown, { color: urgencyColor }]}>
              {formatCountdown(daysUntil)}
            </Text>
          </>
        ) : (
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  completedContainer: {
    opacity: 0.6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  content: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 2,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: Typography.xs,
  },
  countdownContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  urgencyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
  },
  countdown: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});
