import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/store/ThemeContext';
import { useAuth } from '../../../src/store/AuthContext';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../src/constants/theme';
import { LEGAL_AREA_MAP } from '../../../src/constants/legalAreas';
import { formatDate } from '../../../src/utils/dateUtils';
import SearchBar from '../../../src/components/ui/SearchBar';
import FilterChips from '../../../src/components/ui/FilterChips';
import Badge from '../../../src/components/ui/Badge';
import LoadingState from '../../../src/components/ui/LoadingState';
import ErrorState from '../../../src/components/ui/ErrorState';
import EmptyState from '../../../src/components/ui/EmptyState';
import { getCases, searchCases } from '../../../src/services/firebase/caseService';
import { LegalCase, CaseStatus, LegalArea } from '../../../src/types/case';

const STATUS_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Ativos' },
  { key: 'suspended', label: 'Suspensos' },
  { key: 'archived', label: 'Arquivados' },
  { key: 'closed', label: 'Encerrados' },
];

const AREA_FILTERS = [
  { key: 'all_areas', label: 'Todas as areas' },
  { key: 'civil', label: 'Civil' },
  { key: 'trabalhista', label: 'Trabalhista' },
  { key: 'criminal', label: 'Criminal' },
  { key: 'previdenciario', label: 'Previdenciario' },
  { key: 'tributario', label: 'Tributario' },
  { key: 'familia', label: 'Familia' },
  { key: 'consumidor', label: 'Consumidor' },
];

const STATUS_BADGE_MAP: Record<CaseStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  active: { label: 'Ativo', variant: 'success' },
  suspended: { label: 'Suspenso', variant: 'warning' },
  archived: { label: 'Arquivado', variant: 'neutral' },
  closed: { label: 'Encerrado', variant: 'info' },
};

export default function CasesListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all_areas');

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const data = await getCases(user.uid);
      setCases(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar processos.';
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

  const filteredCases = useMemo(() => {
    let result = cases;

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Area filter
    if (areaFilter !== 'all_areas') {
      result = result.filter((c) => c.area === areaFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.caseNumber.toLowerCase().includes(q) ||
          c.clientName.toLowerCase().includes(q) ||
          c.opposingParty.toLowerCase().includes(q),
      );
    }

    return result;
  }, [cases, statusFilter, areaFilter, searchQuery]);

  const renderCaseCard = useCallback(
    ({ item }: { item: LegalCase }) => {
      const statusBadge = STATUS_BADGE_MAP[item.status];
      const areaLabel = LEGAL_AREA_MAP[item.area] ?? item.area;

      return (
        <TouchableOpacity
          style={[styles.caseCard, { backgroundColor: colors.card }, Shadows.sm]}
          onPress={() => router.push(`/(tabs)/cases/${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.caseCardHeader}>
            <View style={styles.caseCardHeaderLeft}>
              <Text style={[styles.caseNumber, { color: colors.primary }]} numberOfLines={1}>
                {item.caseNumber}
              </Text>
              <Badge label={statusBadge.label} variant={statusBadge.variant} />
            </View>
          </View>

          <Text style={[styles.clientName, { color: colors.text }]} numberOfLines={1}>
            {item.clientName}
          </Text>

          <View style={styles.caseCardMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="briefcase-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                {areaLabel}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="business-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.court}
              </Text>
            </View>
          </View>

          {item.opposingParty ? (
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                vs. {item.opposingParty}
              </Text>
            </View>
          ) : null}

          <View style={styles.caseCardFooter}>
            <Text style={[styles.dateText, { color: colors.textTertiary }]}>
              Atualizado em {formatDate(item.updatedAt)}
            </Text>
            {item.nextDeadline && (
              <View style={styles.deadlineIndicator}>
                <Ionicons name="alert-circle" size={14} color={colors.warning} />
                <Text style={[styles.deadlineText, { color: colors.warning }]}>
                  Prazo: {formatDate(item.nextDeadline)}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [colors, router],
  );

  if (loading) {
    return <LoadingState message="Carregando processos..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar processo, cliente, parte contraria..."
        />
      </View>

      {/* Status Filter */}
      <FilterChips
        options={STATUS_FILTERS}
        selectedKey={statusFilter}
        onSelect={setStatusFilter}
      />

      {/* Area Filter */}
      <FilterChips
        options={AREA_FILTERS}
        selectedKey={areaFilter}
        onSelect={setAreaFilter}
        style={{ paddingTop: 0 }}
      />

      {/* Cases List */}
      <FlatList
        data={filteredCases}
        renderItem={renderCaseCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="briefcase-outline"
            title="Nenhum processo encontrado"
            message={searchQuery ? 'Tente ajustar sua busca ou filtros.' : 'Adicione seu primeiro processo para comecar.'}
            actionLabel={searchQuery ? undefined : 'Novo Processo'}
            onAction={searchQuery ? undefined : () => router.push('/(tabs)/cases/new')}
          />
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }, Shadows.lg]}
        onPress={() => router.push('/(tabs)/cases/new')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl + Spacing.xl,
  },
  caseCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  caseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  caseCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  caseNumber: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.bold,
    flex: 1,
  },
  clientName: {
    fontSize: Typography.md,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  caseCardMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  metaText: {
    fontSize: Typography.xs,
  },
  caseCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
  },
  dateText: {
    fontSize: Typography.xs,
  },
  deadlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deadlineText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
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
});
