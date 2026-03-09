import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/store/ThemeContext';
import { useAuth } from '../../../src/store/AuthContext';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../src/constants/theme';
import { formatCurrency } from '../../../src/utils/currency';
import {
  getContracts,
  getInstallmentsByContract,
  markInstallmentPaid,
} from '../../../src/services/firebase/financialService';
import FilterChips from '../../../src/components/ui/FilterChips';
import LoadingState from '../../../src/components/ui/LoadingState';
import EmptyState from '../../../src/components/ui/EmptyState';
import ErrorState from '../../../src/components/ui/ErrorState';
import BottomSheet from '../../../src/components/ui/BottomSheet';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import type {
  Installment,
  InstallmentStatus,
  PaymentMethod,
  FeeContract,
} from '../../../src/types/financial';
import { PAYMENT_METHODS } from '../../../src/types/financial';

const FILTER_OPTIONS = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'overdue', label: 'Atrasados' },
  { key: 'paid', label: 'Pagos' },
];

interface EnrichedInstallment extends Installment {
  clientName: string;
  contractTotalValue: number;
}

function getStatusLabel(status: InstallmentStatus): string {
  const map: Record<InstallmentStatus, string> = {
    pending: 'Pendente',
    paid: 'Pago',
    overdue: 'Atrasado',
    partial: 'Parcial',
  };
  return map[status];
}

function getStatusColor(status: InstallmentStatus, colors: Record<string, string>): string {
  const map: Record<InstallmentStatus, string> = {
    pending: colors.warning,
    paid: colors.success,
    overdue: colors.error,
    partial: colors.info,
  };
  return map[status];
}

function formatDate(date: Date): string {
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function ReceivablesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installments, setInstallments] = useState<EnrichedInstallment[]>([]);
  const [filter, setFilter] = useState('all');

  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<EnrichedInstallment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [paidValue, setPaidValue] = useState('');
  const [markingPaid, setMarkingPaid] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const contracts = await getContracts(user.uid);
      const allInstallments: EnrichedInstallment[] = [];

      for (const contract of contracts) {
        const contractInstallments = await getInstallmentsByContract(user.uid, contract.id);
        contractInstallments.forEach((inst) => {
          allInstallments.push({
            ...inst,
            clientName: contract.clientName,
            contractTotalValue: contract.totalValue,
          });
        });
      }

      allInstallments.sort((a, b) => {
        const dateA = a.dueDate instanceof Date ? a.dueDate.getTime() : new Date(a.dueDate).getTime();
        const dateB = b.dueDate instanceof Date ? b.dueDate.getTime() : new Date(b.dueDate).getTime();
        return dateA - dateB;
      });

      setInstallments(allInstallments);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar recebiveis';
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

  const filteredInstallments = installments.filter((inst) => {
    if (filter === 'all') return true;
    return inst.status === filter;
  });

  const openPaymentSheet = useCallback((installment: EnrichedInstallment) => {
    setSelectedInstallment(installment);
    setPaidValue(formatCurrency(installment.value));
    setPaymentMethod('pix');
    setSheetVisible(true);
  }, []);

  const handleMarkPaid = useCallback(async () => {
    if (!user || !selectedInstallment) return;

    const parsedValue = parseFloat(
      paidValue.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.'),
    );

    if (Number.isNaN(parsedValue) || parsedValue <= 0) {
      Alert.alert('Erro', 'Informe um valor valido.');
      return;
    }

    setMarkingPaid(true);
    try {
      await markInstallmentPaid(user.uid, selectedInstallment.id, parsedValue, paymentMethod);
      setSheetVisible(false);
      setSelectedInstallment(null);
      loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao marcar parcela como paga';
      Alert.alert('Erro', message);
    } finally {
      setMarkingPaid(false);
    }
  }, [user, selectedInstallment, paidValue, paymentMethod, loadData]);

  const renderInstallment = useCallback(
    ({ item }: { item: EnrichedInstallment }) => {
      const statusColor = getStatusColor(item.status, colors);
      const isPending = item.status === 'pending' || item.status === 'overdue';

      return (
        <View style={[styles.itemCard, { backgroundColor: colors.card }, Shadows.sm]}>
          <View style={styles.itemHeader}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemClient, { color: colors.text }]} numberOfLines={1}>
                {item.clientName}
              </Text>
              <Text style={[styles.itemDate, { color: colors.textSecondary }]}>
                Parcela {item.number} - Venc: {formatDate(item.dueDate)}
              </Text>
            </View>
            <View style={[styles.itemBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.itemBadgeText, { color: statusColor }]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>

          <View style={styles.itemValues}>
            <Text style={[styles.itemValue, { color: colors.text }]}>
              {formatCurrency(item.value)}
            </Text>
            {isPending && (
              <TouchableOpacity
                style={[styles.payAction, { backgroundColor: colors.success }]}
                onPress={() => openPaymentSheet(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark" size={16} color="#ffffff" />
                <Text style={styles.payActionText}>Pagar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    },
    [colors, openPaymentSheet],
  );

  if (loading) {
    return <LoadingState message="Carregando recebiveis..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FilterChips options={FILTER_OPTIONS} selectedKey={filter} onSelect={setFilter} />

      <FlatList
        data={filteredInstallments}
        keyExtractor={(item) => item.id}
        renderItem={renderInstallment}
        contentContainerStyle={filteredInstallments.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="wallet-outline"
            title="Nenhum recebivel encontrado"
            message="Seus recebiveis aparecerao aqui quando voce criar contratos com parcelas."
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        height={380}
      >
        <Text style={[styles.sheetTitle, { color: colors.text }]}>
          Registrar Pagamento
        </Text>
        {selectedInstallment && (
          <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
            {selectedInstallment.clientName} - Parcela {selectedInstallment.number}
          </Text>
        )}

        <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>
          Metodo de Pagamento
        </Text>
        <View style={styles.paymentMethods}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.value}
              style={[
                styles.methodChip,
                {
                  backgroundColor: paymentMethod === method.value ? colors.primary : colors.surfaceVariant,
                  borderColor: paymentMethod === method.value ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setPaymentMethod(method.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.methodChipText,
                  { color: paymentMethod === method.value ? '#ffffff' : colors.textSecondary },
                ]}
              >
                {method.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Valor Pago"
          value={paidValue}
          onChangeText={setPaidValue}
          maskType="currency"
          keyboardType="numeric"
          leftIcon="cash-outline"
        />

        <Button
          title="Confirmar Pagamento"
          onPress={handleMarkPaid}
          loading={markingPaid}
          disabled={markingPaid}
          size="lg"
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  itemCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemClient: {
    fontSize: Typography.md,
    fontWeight: '600',
  },
  itemDate: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  itemBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  itemBadgeText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  itemValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemValue: {
    fontSize: Typography.md,
    fontWeight: '700',
  },
  payAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  payActionText: {
    color: '#ffffff',
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  sheetTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  sheetSubtitle: {
    fontSize: Typography.sm,
    marginBottom: Spacing.md,
  },
  sheetLabel: {
    fontSize: Typography.sm,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  methodChip: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  methodChipText: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
});
