import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { getFinancialEntriesByType } from '../../../src/services/firebase/financialService';
import FilterChips from '../../../src/components/ui/FilterChips';
import LoadingState from '../../../src/components/ui/LoadingState';
import EmptyState from '../../../src/components/ui/EmptyState';
import ErrorState from '../../../src/components/ui/ErrorState';
import type { FinancialEntry } from '../../../src/types/financial';
import { EXPENSE_CATEGORIES } from '../../../src/types/financial';

function formatDate(date: Date): string {
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getCategoryIcon(category: string): keyof typeof Ionicons.glyphMap {
  const map: Record<string, keyof typeof Ionicons.glyphMap> = {
    'Aluguel': 'home-outline',
    'Software/Sistemas': 'laptop-outline',
    'Impostos': 'receipt-outline',
    'Custas Processuais': 'document-text-outline',
    'Pericia': 'search-outline',
    'Transporte': 'car-outline',
    'Material de Escritorio': 'pencil-outline',
    'Telefone/Internet': 'wifi-outline',
    'Marketing': 'megaphone-outline',
    'Contabilidade': 'calculator-outline',
    'Seguro': 'shield-checkmark-outline',
    'Manutencao': 'construct-outline',
    'Alimentacao': 'restaurant-outline',
    'Outros': 'ellipsis-horizontal-outline',
  };
  return map[category] ?? 'cash-outline';
}

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<FinancialEntry[]>([]);
  const [filter, setFilter] = useState('all');

  const filterOptions = useMemo(
    () => [
      { key: 'all', label: 'Todas' },
      ...EXPENSE_CATEGORIES.map((cat) => ({ key: cat, label: cat })),
    ],
    [],
  );

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const data = await getFinancialEntriesByType(user.uid, 'expense');
      setExpenses(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar despesas';
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

  const filteredExpenses = expenses.filter((e) => {
    if (filter === 'all') return true;
    return e.category === filter;
  });

  const monthlyTotal = useMemo(() => {
    const now = new Date();
    return filteredExpenses
      .filter((e) => {
        const d = e.date instanceof Date ? e.date : new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + e.value, 0);
  }, [filteredExpenses]);

  const renderExpense = useCallback(
    ({ item }: { item: FinancialEntry }) => (
      <View style={[styles.expenseCard, { backgroundColor: colors.card }, Shadows.sm]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.errorLight }]}>
          <Ionicons name={getCategoryIcon(item.category)} size={20} color={colors.error} />
        </View>
        <View style={styles.expenseContent}>
          <Text style={[styles.expenseDescription, { color: colors.text }]} numberOfLines={1}>
            {item.description}
          </Text>
          <View style={styles.expenseMeta}>
            <Text style={[styles.expenseCategory, { color: colors.textSecondary }]}>
              {item.category}
            </Text>
            <Text style={[styles.expenseDot, { color: colors.textTertiary }]}>  </Text>
            <Text style={[styles.expenseDate, { color: colors.textSecondary }]}>
              {formatDate(item.date)}
            </Text>
          </View>
          {item.clientName && (
            <Text style={[styles.expenseClient, { color: colors.textTertiary }]} numberOfLines={1}>
              {item.clientName}
            </Text>
          )}
        </View>
        <Text style={[styles.expenseValue, { color: colors.error }]}>
          -{formatCurrency(item.value)}
        </Text>
      </View>
    ),
    [colors],
  );

  if (loading) {
    return <LoadingState message="Carregando despesas..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.monthlyHeader, { backgroundColor: colors.card }, Shadows.sm]}>
        <Text style={[styles.monthlyLabel, { color: colors.textSecondary }]}>
          Total do mes
        </Text>
        <Text style={[styles.monthlyValue, { color: colors.error }]}>
          {formatCurrency(monthlyTotal)}
        </Text>
      </View>

      <FilterChips options={filterOptions} selectedKey={filter} onSelect={setFilter} />

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpense}
        contentContainerStyle={filteredExpenses.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="trending-down-outline"
            title="Nenhuma despesa encontrada"
            message="Registre suas despesas para controlar melhor suas financas."
            actionLabel="Nova Despesa"
            onAction={() => router.push('/(tabs)/financial/expenses/new')}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }, Shadows.lg]}
        activeOpacity={0.8}
        onPress={() => router.push('/(tabs)/financial/expenses/new')}
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
  monthlyHeader: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  monthlyLabel: {
    fontSize: Typography.sm,
    marginBottom: Spacing.xs,
  },
  monthlyValue: {
    fontSize: Typography.xxl,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: Spacing.xxl + 40,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  expenseContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  expenseDescription: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  expenseCategory: {
    fontSize: Typography.xs,
  },
  expenseDot: {
    fontSize: Typography.xs,
  },
  expenseDate: {
    fontSize: Typography.xs,
  },
  expenseClient: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  expenseValue: {
    fontSize: Typography.md,
    fontWeight: '700',
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
