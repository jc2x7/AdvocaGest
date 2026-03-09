import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/store/ThemeContext';
import { useAuth } from '../../../src/store/AuthContext';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../src/constants/theme';
import { formatCurrency } from '../../../src/utils/currency';
import { getContracts } from '../../../src/services/firebase/financialService';
import FilterChips from '../../../src/components/ui/FilterChips';
import LoadingState from '../../../src/components/ui/LoadingState';
import EmptyState from '../../../src/components/ui/EmptyState';
import ErrorState from '../../../src/components/ui/ErrorState';
import type { FeeContract, ContractStatus, ContractType } from '../../../src/types/financial';

const FILTER_OPTIONS = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Ativos' },
  { key: 'completed', label: 'Concluidos' },
  { key: 'cancelled', label: 'Cancelados' },
];

function getTypeLabel(type: ContractType): string {
  const map: Record<ContractType, string> = {
    fixed: 'Fixo',
    success: 'Exito',
    mixed: 'Misto',
    hourly: 'Hora',
  };
  return map[type];
}

function getStatusColor(status: ContractStatus, colors: Record<string, string>): string {
  const map: Record<ContractStatus, string> = {
    active: colors.success,
    completed: colors.info,
    cancelled: colors.error,
  };
  return map[status];
}

function getStatusLabel(status: ContractStatus): string {
  const map: Record<ContractStatus, string> = {
    active: 'Ativo',
    completed: 'Concluido',
    cancelled: 'Cancelado',
  };
  return map[status];
}

export default function ContractsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contracts, setContracts] = useState<FeeContract[]>([]);
  const [filter, setFilter] = useState('all');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const data = await getContracts(user.uid);
      setContracts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar contratos';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const filteredContracts = contracts.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const renderContract = useCallback(
    ({ item }: { item: FeeContract }) => {
      const statusColor = getStatusColor(item.status, colors);
      const progress = item.totalValue > 0 ? item.paidTotal / item.totalValue : 0;

      return (
        <TouchableOpacity
          style={[styles.contractCard, { backgroundColor: colors.card }, Shadows.sm]}
          activeOpacity={0.7}
          onPress={() => router.push(`/(tabs)/financial/contracts/${item.id}`)}
        >
          <View style={styles.contractHeader}>
            <View style={styles.contractInfo}>
              <Text style={[styles.clientName, { color: colors.text }]} numberOfLines={1}>
                {item.clientName}
              </Text>
              {item.caseName && (
                <Text style={[styles.caseName, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.caseName}
                </Text>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>

          <View style={styles.contractDetails}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Tipo</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {getTypeLabel(item.type)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Valor Total</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatCurrency(item.totalValue)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Pago</Text>
              <Text style={[styles.detailValue, { color: colors.success }]}>
                {formatCurrency(item.paidTotal)}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: colors.borderLight }]}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(progress * 100, 100)}%`,
                    backgroundColor: colors.success,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {item.paidCount}/{item.installmentsCount} parcelas
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [colors, router],
  );

  if (loading) {
    return <LoadingState message="Carregando contratos..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FilterChips options={FILTER_OPTIONS} selectedKey={filter} onSelect={setFilter} />

      <FlatList
        data={filteredContracts}
        keyExtractor={(item) => item.id}
        renderItem={renderContract}
        contentContainerStyle={filteredContracts.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="Nenhum contrato encontrado"
            message="Crie um novo contrato de honorarios para comecar a acompanhar seus recebimentos."
            actionLabel="Novo Contrato"
            onAction={() => router.push('/(tabs)/financial/contracts/new')}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }, Shadows.lg]}
        activeOpacity={0.8}
        onPress={() => router.push('/(tabs)/financial/contracts/new')}
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
  listContent: {
    paddingBottom: Spacing.xxl + 40,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  contractCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  contractInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  clientName: {
    fontSize: Typography.md,
    fontWeight: '600',
  },
  caseName: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  contractDetails: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: Typography.sm,
  },
  detailValue: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  progressContainer: {
    gap: Spacing.xs,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: Typography.xs,
    textAlign: 'right',
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
