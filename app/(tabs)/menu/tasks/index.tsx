import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/store/ThemeContext';
import { useAuth } from '../../../../src/store/AuthContext';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TASK_PRIORITIES,
  TASK_STATUS_LABELS,
} from '../../../../src/types/task';
import { subscribeToTasks, updateTaskStatus } from '../../../../src/services/firebase/taskService';
import { formatDate, getDaysUntil } from '../../../../src/utils/dateUtils';
import LoadingState from '../../../../src/components/ui/LoadingState';
import EmptyState from '../../../../src/components/ui/EmptyState';
import ErrorState from '../../../../src/components/ui/ErrorState';
import { BorderRadius, Shadows, Spacing, Typography } from '../../../../src/constants/theme';

const STATUS_COLUMNS: { status: TaskStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { status: 'todo', label: 'A Fazer', icon: 'radio-button-off-outline' },
  { status: 'in_progress', label: 'Em Andamento', icon: 'play-circle-outline' },
  { status: 'done', label: 'Concluido', icon: 'checkmark-circle-outline' },
];

type FilterType = 'all' | TaskPriority;

function TaskCard({
  task,
  onMoveLeft,
  onMoveRight,
  colors,
}: {
  task: Task;
  onMoveLeft: (() => void) | null;
  onMoveRight: (() => void) | null;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const priorityInfo = TASK_PRIORITIES.find((p) => p.value === task.priority);
  const daysUntilDue = task.dueDate ? getDaysUntil(task.dueDate) : null;
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && task.status !== 'done';
  const checkedCount = task.checklist?.filter((c) => c.done).length ?? 0;
  const totalChecklist = task.checklist?.length ?? 0;

  return (
    <View
      style={[
        styles.taskCard,
        Shadows.sm,
        { backgroundColor: colors.card, borderColor: colors.borderLight, borderLeftColor: priorityInfo?.color ?? colors.border, borderLeftWidth: 3 },
      ]}
    >
      <View style={styles.taskHeader}>
        <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2}>
          {task.title}
        </Text>
      </View>

      {task.caseName && (
        <View style={styles.taskMeta}>
          <Ionicons name="briefcase-outline" size={12} color={colors.textTertiary} />
          <Text style={[styles.taskMetaText, { color: colors.textTertiary }]} numberOfLines={1}>
            {task.caseName}
          </Text>
        </View>
      )}

      {task.clientName && (
        <View style={styles.taskMeta}>
          <Ionicons name="person-outline" size={12} color={colors.textTertiary} />
          <Text style={[styles.taskMetaText, { color: colors.textTertiary }]} numberOfLines={1}>
            {task.clientName}
          </Text>
        </View>
      )}

      {task.dueDate && (
        <View style={styles.taskMeta}>
          <Ionicons
            name="calendar-outline"
            size={12}
            color={isOverdue ? colors.error : colors.textTertiary}
          />
          <Text
            style={[
              styles.taskMetaText,
              { color: isOverdue ? colors.error : colors.textTertiary },
              isOverdue && { fontWeight: '600' },
            ]}
          >
            {formatDate(task.dueDate)}
            {isOverdue ? ' (atrasada)' : ''}
          </Text>
        </View>
      )}

      {totalChecklist > 0 && (
        <View style={styles.taskMeta}>
          <Ionicons name="checkbox-outline" size={12} color={colors.textTertiary} />
          <Text style={[styles.taskMetaText, { color: colors.textTertiary }]}>
            {checkedCount}/{totalChecklist}
          </Text>
        </View>
      )}

      <View style={styles.taskFooter}>
        <View style={[styles.priorityBadge, { backgroundColor: (priorityInfo?.color ?? colors.border) + '20' }]}>
          <Text style={[styles.priorityText, { color: priorityInfo?.color ?? colors.textSecondary }]}>
            {priorityInfo?.label}
          </Text>
        </View>
        <View style={styles.moveButtons}>
          {onMoveLeft && (
            <TouchableOpacity onPress={onMoveLeft} style={styles.moveButton}>
              <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          {onMoveRight && (
            <TouchableOpacity onPress={onMoveRight} style={styles.moveButton}>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

export default function TasksScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilter, setShowFilter] = useState(false);

  const loadTasks = useCallback(() => {
    if (!user) return;
    setError(null);
    try {
      const unsubscribe = subscribeToTasks(user.uid, (data) => {
        setTasks(data);
        setLoading(false);
        setRefreshing(false);
      });
      return unsubscribe;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar tarefas';
      setError(message);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = loadTasks();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    return tasks.filter((t) => t.priority === filter);
  }, [tasks, filter]);

  const handleMoveTask = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      if (!user) return;
      try {
        await updateTaskStatus(user.uid, taskId, newStatus);
      } catch (err) {
        console.error('Error moving task:', err);
      }
    },
    [user]
  );

  const statusOrder: TaskStatus[] = ['todo', 'in_progress', 'done'];

  if (loading) {
    return <LoadingState message="Carregando tarefas..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadTasks} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>Tarefas</Text>
        <TouchableOpacity
          onPress={() => setShowFilter(true)}
          style={[styles.filterButton, { backgroundColor: colors.surfaceVariant }]}
        >
          <Ionicons name="filter-outline" size={18} color={colors.primary} />
          {filter !== 'all' && (
            <View style={[styles.filterBadge, { backgroundColor: colors.primary }]} />
          )}
        </TouchableOpacity>
      </View>

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon="checkbox-outline"
          title="Nenhuma tarefa encontrada"
          message="Crie sua primeira tarefa para comecar"
          actionLabel="Nova Tarefa"
          onAction={() => router.push('/(tabs)/menu/tasks/new')}
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kanbanContainer}
        >
          {STATUS_COLUMNS.map((col) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col.status);
            const colIdx = statusOrder.indexOf(col.status);
            return (
              <View
                key={col.status}
                style={[styles.column, { backgroundColor: colors.surfaceVariant }]}
              >
                <View style={styles.columnHeader}>
                  <Ionicons name={col.icon} size={18} color={colors.primary} />
                  <Text style={[styles.columnTitle, { color: colors.text }]}>{col.label}</Text>
                  <View style={[styles.columnCount, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.columnCountText, { color: colors.primary }]}>
                      {columnTasks.length}
                    </Text>
                  </View>
                </View>
                <FlatList
                  data={columnTasks}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TaskCard
                      task={item}
                      onMoveLeft={
                        colIdx > 0
                          ? () => handleMoveTask(item.id, statusOrder[colIdx - 1])
                          : null
                      }
                      onMoveRight={
                        colIdx < statusOrder.length - 1
                          ? () => handleMoveTask(item.id, statusOrder[colIdx + 1])
                          : null
                      }
                      colors={colors}
                    />
                  )}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.columnList}
                />
              </View>
            );
          })}
        </ScrollView>
      )}

      <TouchableOpacity
        style={[styles.fab, Shadows.lg, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(tabs)/menu/tasks/new')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal visible={showFilter} transparent animationType="fade" onRequestClose={() => setShowFilter(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowFilter(false)}>
          <Pressable style={[styles.modal, Shadows.lg, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Filtrar por Prioridade</Text>
            <TouchableOpacity
              style={[styles.filterItem, filter === 'all' && { backgroundColor: colors.primaryLight + '20' }]}
              onPress={() => { setFilter('all'); setShowFilter(false); }}
            >
              <Text style={[styles.filterItemText, { color: colors.text }]}>Todas</Text>
              {filter === 'all' && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </TouchableOpacity>
            {TASK_PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[styles.filterItem, filter === p.value && { backgroundColor: p.color + '20' }]}
                onPress={() => { setFilter(p.value); setShowFilter(false); }}
              >
                <View style={styles.filterItemRow}>
                  <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                  <Text style={[styles.filterItemText, { color: colors.text }]}>{p.label}</Text>
                </View>
                {filter === p.value && <Ionicons name="checkmark" size={20} color={p.color} />}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: { fontSize: Typography.xl, fontWeight: '700' },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  kanbanContainer: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: 80,
  },
  column: {
    width: 260,
    marginHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    maxHeight: '100%',
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  columnTitle: { fontSize: Typography.sm, fontWeight: '600', flex: 1 },
  columnCount: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  columnCountText: { fontSize: Typography.xs, fontWeight: '600' },
  columnList: { paddingBottom: Spacing.sm },
  taskCard: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.sm,
  },
  taskHeader: { marginBottom: 4 },
  taskTitle: { fontSize: Typography.sm, fontWeight: '600' },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  taskMetaText: { fontSize: 11, flex: 1 },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  priorityText: { fontSize: 10, fontWeight: '600' },
  moveButtons: { flexDirection: 'row', gap: Spacing.xs },
  moveButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modal: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalTitle: { fontSize: Typography.lg, fontWeight: '700', marginBottom: Spacing.md },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  filterItemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  filterItemText: { fontSize: Typography.md },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },
});
