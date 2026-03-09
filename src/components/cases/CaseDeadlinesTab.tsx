import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { formatDate, getDaysUntil, getUrgencyLabel } from '../../utils/dateUtils';
import { Deadline, DeadlineStatus, DeadlineType } from '../../types/deadline';

interface CaseDeadlinesTabProps {
  deadlines: Deadline[];
  onPressDeadline?: (deadline: Deadline) => void;
  onCompleteDeadline?: (deadline: Deadline) => void;
}

const TYPE_LABELS: Record<DeadlineType, string> = {
  judicial: 'Judicial',
  administrative: 'Administrativo',
  personal: 'Pessoal',
};

function getUrgencyColor(daysUntil: number, colors: ReturnType<typeof import('../../store/ThemeContext').useTheme>['colors']): string {
  if (daysUntil < 0) return colors.error;
  if (daysUntil === 0) return colors.error;
  if (daysUntil <= 3) return colors.warning;
  if (daysUntil <= 7) return colors.info;
  return colors.success;
}

export default function CaseDeadlinesTab({
  deadlines,
  onPressDeadline,
  onCompleteDeadline,
}: CaseDeadlinesTabProps) {
  const { colors } = useTheme();

  const renderItem = ({ item }: { item: Deadline }) => {
    const daysUntil = getDaysUntil(item.dueDate);
    const urgencyColor = getUrgencyColor(daysUntil, colors);
    const urgencyLabel = getUrgencyLabel(daysUntil);
    const isCompleted = item.status === 'completed';

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderLeftColor: isCompleted ? colors.success : urgencyColor,
            opacity: isCompleted ? 0.7 : 1,
          },
          Shadows.sm,
        ]}
        onPress={() => onPressDeadline?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => onCompleteDeadline?.(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={isCompleted ? colors.success : urgencyColor}
              />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text
                style={[
                  styles.title,
                  { color: colors.text },
                  isCompleted && styles.completedText,
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {item.description ? (
                <Text
                  style={[styles.description, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.metaRow}>
            <View style={[styles.typeBadge, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.typeText, { color: colors.textSecondary }]}>
                {TYPE_LABELS[item.type]}
              </Text>
            </View>
            <View style={[styles.dayTypeBadge, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons
                name={item.dayType === 'business' ? 'briefcase-outline' : 'calendar-outline'}
                size={10}
                color={colors.textSecondary}
              />
              <Text style={[styles.dayTypeText, { color: colors.textSecondary }]}>
                {item.dayType === 'business' ? 'Dias uteis' : 'Dias corridos'}
              </Text>
            </View>
          </View>

          <View style={styles.dateRow}>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {formatDate(item.dueDate)}
            </Text>
            {!isCompleted && (
              <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor + '20' }]}>
                <Text style={[styles.urgencyText, { color: urgencyColor }]}>
                  {urgencyLabel}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={deadlines}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="timer-outline" size={40} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            Nenhum prazo cadastrado
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  card: {
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 2,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  description: {
    fontSize: Typography.xs,
    lineHeight: 18,
  },
  footer: {
    gap: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.semibold,
  },
  dayTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  dayTypeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.medium,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: Typography.xs,
  },
  urgencyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  urgencyText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.sm,
  },
});
