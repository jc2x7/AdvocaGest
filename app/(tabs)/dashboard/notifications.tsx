import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SectionList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/store/ThemeContext';
import { useAuth } from '../../../src/store/AuthContext';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../src/constants/theme';
import { formatDate, getRelativeTime } from '../../../src/utils/dateUtils';
import LoadingState from '../../../src/components/ui/LoadingState';
import ErrorState from '../../../src/components/ui/ErrorState';
import EmptyState from '../../../src/components/ui/EmptyState';
import FilterChips from '../../../src/components/ui/FilterChips';
import { AppNotification } from '../../../src/types/common';

type NotificationFilter = 'all' | 'deadline' | 'hearing' | 'payment' | 'movement' | 'general';

const FILTER_OPTIONS = [
  { key: 'all', label: 'Todas' },
  { key: 'deadline', label: 'Prazos' },
  { key: 'hearing', label: 'Audiencias' },
  { key: 'payment', label: 'Pagamentos' },
  { key: 'movement', label: 'Movimentacoes' },
  { key: 'general', label: 'Geral' },
];

const TYPE_ICONS: Record<AppNotification['type'], keyof typeof Ionicons.glyphMap> = {
  deadline: 'alert-circle-outline',
  hearing: 'hammer-outline',
  payment: 'cash-outline',
  movement: 'swap-vertical-outline',
  lead: 'person-add-outline',
  general: 'notifications-outline',
};

const TYPE_COLORS: Record<AppNotification['type'], string> = {
  deadline: '#f59e0b',
  hearing: '#ef4444',
  payment: '#22c55e',
  movement: '#3b82f6',
  lead: '#8b5cf6',
  general: '#64748b',
};

interface NotificationSection {
  title: string;
  data: AppNotification[];
}

function groupByDate(notifications: AppNotification[]): NotificationSection[] {
  const groups: Record<string, AppNotification[]> = {};
  for (const n of notifications) {
    const dateKey = formatDate(n.createdAt);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(n);
  }
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

// Mock data for notifications since no notification service exists yet
function getMockNotifications(): AppNotification[] {
  const now = new Date();
  return [
    {
      id: '1',
      title: 'Prazo proximo',
      body: 'O prazo para contestacao no processo 0001234-56.2025 vence em 2 dias.',
      type: 'deadline',
      read: false,
      createdAt: now,
    },
    {
      id: '2',
      title: 'Audiencia amanha',
      body: 'Audiencia de instrucao no processo 0004567-89.2025 agendada para amanha as 14:00.',
      type: 'hearing',
      read: false,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: '3',
      title: 'Pagamento recebido',
      body: 'Pagamento de R$ 2.500,00 referente ao contrato de honorarios foi confirmado.',
      type: 'payment',
      read: true,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
    {
      id: '4',
      title: 'Nova movimentacao',
      body: 'Despacho publicado no processo 0007890-12.2025.',
      type: 'movement',
      read: true,
      createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
    },
  ];
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>('all');

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      // Use mock data until notification service is implemented
      const data = getMockNotifications();
      setNotifications(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar notificacoes.';
      setError(message);
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    void load();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  const sections = useMemo(() => groupByDate(filteredNotifications), [filteredNotifications]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const renderNotificationItem = useCallback(
    ({ item }: { item: AppNotification }) => {
      const icon = TYPE_ICONS[item.type];
      const typeColor = TYPE_COLORS[item.type];

      return (
        <TouchableOpacity
          style={[
            styles.notifCard,
            { backgroundColor: item.read ? colors.card : colors.infoLight },
            Shadows.sm,
          ]}
          onPress={() => markAsRead(item.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.notifIconBg, { backgroundColor: typeColor + '20' }]}>
            <Ionicons name={icon} size={20} color={typeColor} />
          </View>
          <View style={styles.notifContent}>
            <View style={styles.notifHeader}>
              <Text
                style={[
                  styles.notifTitle,
                  { color: colors.text, fontWeight: item.read ? Typography.fontWeight.regular : Typography.fontWeight.semibold },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
            </View>
            <Text style={[styles.notifBody, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.body}
            </Text>
            <Text style={[styles.notifTime, { color: colors.textTertiary }]}>
              {getRelativeTime(item.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [colors, markAsRead],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: NotificationSection }) => (
      <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionHeaderText, { color: colors.textSecondary }]}>{section.title}</Text>
      </View>
    ),
    [colors],
  );

  if (loading) {
    return <LoadingState message="Carregando notificacoes..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header actions */}
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
          <Ionicons name="checkmark-done-outline" size={18} color={colors.primary} />
          <Text style={[styles.markAllText, { color: colors.primary }]}>
            Marcar todas como lidas ({unreadCount})
          </Text>
        </TouchableOpacity>
      )}

      <FilterChips
        options={FILTER_OPTIONS}
        selectedKey={filter}
        onSelect={(key) => setFilter(key as NotificationFilter)}
      />

      <SectionList
        sections={sections}
        renderItem={renderNotificationItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="Sem notificacoes"
            message="Nenhuma notificacao encontrada."
          />
        }
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  markAllText: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sectionHeader: {
    paddingVertical: Spacing.sm,
    paddingTop: Spacing.md,
  },
  sectionHeaderText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
  },
  notifCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  notifIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    fontSize: Typography.sm,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: Spacing.sm,
  },
  notifBody: {
    fontSize: Typography.xs,
    marginTop: 2,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
  },
});
