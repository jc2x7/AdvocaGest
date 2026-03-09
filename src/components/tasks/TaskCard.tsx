import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { formatDate, getDaysUntil, getUrgencyLabel } from '../../utils/dateUtils';
import { Task, TaskPriority, TaskStatus, TASK_PRIORITIES, TASK_STATUS_LABELS } from '../../types/task';

interface TaskCardProps {
  task: Task;
  onPress?: (task: Task) => void;
  onToggleStatus?: (task: Task) => void;
}

function getPriorityConfig(priority: TaskPriority): { label: string; color: string } {
  const found = TASK_PRIORITIES.find((p) => p.value === priority);
  return found || { label: priority, color: '#64748b' };
}

export default function TaskCard({ task, onPress, onToggleStatus }: TaskCardProps) {
  const { colors } = useTheme();

  const priorityConfig = getPriorityConfig(task.priority);
  const isDone = task.status === 'done';

  const checklistTotal = task.checklist?.length || 0;
  const checklistDone = task.checklist?.filter((item) => item.done).length || 0;
  const checklistProgress = checklistTotal > 0 ? (checklistDone / checklistTotal) * 100 : 0;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderLeftColor: priorityConfig.color },
        Shadows.sm,
        isDone && styles.doneCard,
      ]}
      onPress={() => onPress?.(task)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => onToggleStatus?.(task)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={isDone ? colors.success : priorityConfig.color}
          />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.title,
              { color: colors.text },
              isDone && styles.doneText,
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
        </View>

        <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.color + '20' }]}>
          <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
            {priorityConfig.label}
          </Text>
        </View>
      </View>

      {task.description ? (
        <Text
          style={[styles.description, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {task.description}
        </Text>
      ) : null}

      {task.caseName && (
        <View style={styles.metaItem}>
          <Ionicons name="briefcase-outline" size={12} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
            {task.caseName}
          </Text>
        </View>
      )}

      {task.clientName && (
        <View style={styles.metaItem}>
          <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
            {task.clientName}
          </Text>
        </View>
      )}

      {checklistTotal > 0 && (
        <View style={styles.checklistSection}>
          <View style={styles.checklistHeader}>
            <Ionicons name="list-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.checklistText, { color: colors.textSecondary }]}>
              {checklistDone}/{checklistTotal} itens
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.success, width: `${checklistProgress}%` },
              ]}
            />
          </View>
        </View>
      )}

      <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
        <View style={[styles.statusBadge, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            {TASK_STATUS_LABELS[task.status]}
          </Text>
        </View>

        {task.dueDate && (
          <View style={styles.dueDateContainer}>
            <Ionicons
              name="calendar-outline"
              size={12}
              color={isDone ? colors.textTertiary : getDaysUntil(task.dueDate) <= 1 ? colors.error : colors.textSecondary}
            />
            <Text
              style={[
                styles.dueDateText,
                {
                  color: isDone
                    ? colors.textTertiary
                    : getDaysUntil(task.dueDate) <= 1
                      ? colors.error
                      : colors.textSecondary,
                },
              ]}
            >
              {formatDate(task.dueDate)}
            </Text>
          </View>
        )}

        {task.estimatedHours !== undefined && (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>
              {task.estimatedHours}h
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  doneCard: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  doneText: {
    textDecorationLine: 'line-through',
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
  },
  description: {
    fontSize: Typography.xs,
    lineHeight: 18,
    marginBottom: Spacing.xs,
    marginLeft: 30,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 30,
    marginTop: 2,
  },
  metaText: {
    fontSize: Typography.xs,
    flex: 1,
  },
  checklistSection: {
    marginLeft: 30,
    marginTop: Spacing.xs,
    gap: 4,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checklistText: {
    fontSize: Typography.xs,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderTopWidth: 1,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});
