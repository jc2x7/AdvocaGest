import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { formatDate, getDaysUntil } from '../../utils/dateUtils';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TASK_STATUS_LABELS,
  TASK_PRIORITIES,
} from '../../types/task';

interface TaskKanbanProps {
  tasks: Task[];
  onPressTask?: (task: Task) => void;
  onPressAddTask?: (status: TaskStatus) => void;
}

const COLUMNS: { status: TaskStatus; icon: keyof typeof Ionicons.glyphMap; colorKey: string }[] = [
  { status: 'todo', icon: 'clipboard-outline', colorKey: 'info' },
  { status: 'in_progress', icon: 'play-circle-outline', colorKey: 'warning' },
  { status: 'done', icon: 'checkmark-circle-outline', colorKey: 'success' },
];

function getPriorityConfig(priority: TaskPriority): { label: string; color: string } {
  const found = TASK_PRIORITIES.find((p) => p.value === priority);
  return found || { label: priority, color: '#64748b' };
}

export default function TaskKanban({
  tasks,
  onPressTask,
  onPressAddTask,
}: TaskKanbanProps) {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const columnWidth = screenWidth * 0.72;

  const getColumnColor = (colorKey: string): string => {
    const map: Record<string, string> = {
      info: colors.info,
      warning: colors.warning,
      success: colors.success,
    };
    return map[colorKey] || colors.primary;
  };

  const renderTaskCard = (task: Task) => {
    const priorityConfig = getPriorityConfig(task.priority);
    const checklistTotal = task.checklist?.length || 0;
    const checklistDone = task.checklist?.filter((item) => item.done).length || 0;

    return (
      <TouchableOpacity
        key={task.id}
        style={[styles.taskCard, { backgroundColor: colors.card }, Shadows.sm]}
        onPress={() => onPressTask?.(task)}
        activeOpacity={0.7}
      >
        <View style={styles.taskHeader}>
          <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2}>
            {task.title}
          </Text>
          <View style={[styles.priorityDot, { backgroundColor: priorityConfig.color }]} />
        </View>

        {task.clientName && (
          <Text style={[styles.taskMeta, { color: colors.textSecondary }]} numberOfLines={1}>
            {task.clientName}
          </Text>
        )}

        {checklistTotal > 0 && (
          <View style={styles.checklistRow}>
            <Ionicons name="list-outline" size={12} color={colors.textTertiary} />
            <Text style={[styles.checklistText, { color: colors.textTertiary }]}>
              {checklistDone}/{checklistTotal}
            </Text>
            <View style={[styles.miniProgress, { backgroundColor: colors.borderLight }]}>
              <View
                style={[
                  styles.miniProgressFill,
                  {
                    backgroundColor: colors.success,
                    width: `${checklistTotal > 0 ? (checklistDone / checklistTotal) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {task.dueDate && (
          <View style={styles.dueDateRow}>
            <Ionicons
              name="calendar-outline"
              size={12}
              color={getDaysUntil(task.dueDate) <= 1 ? colors.error : colors.textTertiary}
            />
            <Text
              style={[
                styles.dueDateText,
                {
                  color: getDaysUntil(task.dueDate) <= 1 ? colors.error : colors.textTertiary,
                },
              ]}
            >
              {formatDate(task.dueDate)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      snapToInterval={columnWidth + Spacing.sm}
      decelerationRate="fast"
    >
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.status);
        const columnColor = getColumnColor(column.colorKey);

        return (
          <View key={column.status} style={[styles.column, { width: columnWidth }]}>
            <View style={styles.columnHeader}>
              <View style={styles.columnTitleRow}>
                <Ionicons name={column.icon} size={18} color={columnColor} />
                <Text style={[styles.columnTitle, { color: colors.text }]}>
                  {TASK_STATUS_LABELS[column.status]}
                </Text>
                <View style={[styles.countBadge, { backgroundColor: columnColor + '20' }]}>
                  <Text style={[styles.countText, { color: columnColor }]}>
                    {columnTasks.length}
                  </Text>
                </View>
              </View>
            </View>

            <ScrollView
              style={[styles.columnContent, { backgroundColor: colors.surfaceVariant }]}
              contentContainerStyle={styles.columnContentContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {columnTasks.map(renderTaskCard)}

              {onPressAddTask && (
                <TouchableOpacity
                  style={[styles.addButton, { borderColor: colors.border }]}
                  onPress={() => onPressAddTask(column.status)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-outline" size={18} color={colors.textTertiary} />
                  <Text style={[styles.addText, { color: colors.textTertiary }]}>
                    Nova Tarefa
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  column: {
    flex: 1,
  },
  columnHeader: {
    paddingVertical: Spacing.sm,
  },
  columnTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  columnTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  countText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  columnContent: {
    borderRadius: BorderRadius.md,
    maxHeight: 500,
  },
  columnContentContainer: {
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  taskCard: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  taskMeta: {
    fontSize: Typography.xs,
    marginBottom: 4,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  checklistText: {
    fontSize: Typography.xs,
  },
  miniProgress: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dueDateText: {
    fontSize: Typography.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});
