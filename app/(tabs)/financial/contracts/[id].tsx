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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/store/ThemeContext';
import { useAuth } from '../../../../src/store/AuthContext';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../../src/constants/theme';
import { formatCurrency } from '../../../../src/utils/currency';
import {
  getContractById,
  getInstallmentsByContract,
  markInstallmentPaid,
} from '../../../../src/services/firebase/financialService';
import LoadingState from '../../../../src/components/ui/LoadingState';
import ErrorState from '../../../../src/components/ui/ErrorState';
import BottomSheet from '../../../../src/components/ui/BottomSheet';
import Input from '../../../../src/components/ui/Input';
import Button from '../../../../src/components/ui/Button';
import DateTimePicker from '../../../../src/components/ui/DateTimePicker';
import type {
  FeeContract,
  Installment,
  InstallmentStatus,
  PaymentMethod,
  PAYMENT_METHODS,
} from '../../../../src/types/financial';
import { PAYMENT_METHODS as METHODS } from '../../../../src/types/financial';

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

function getContractTypeLabel(type: string): string {
  const map: Record<string, string> = {
    fixed: 'Fixo',
    success: 'Exito',
    mixed: 'Misto',
    hourly: 'Por Hora',
  };
  return map[type] ?? type;
}

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contract, setContract] = useState<FeeContract | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [paidValue, setPaidValue] = useState('');
  const [paidDate, setPaidDate] = useState(new Date());
  const [markingPaid, setMarkingPaid] = useState(false);

  const loadData = useCallback(async () => {
    if (!user || !id) return;
    try {
      setError(null);
      const [contractData, installmentsData] = await Promise.all([
        getContractById(user.uid, id),
        getInstallmentsByContract(user.uid, id),
      ]);

      if (!contractData) {
        setError('Contrato nao encontrado.');
        return;
      }

      setContract(contractData);
      setInstallments(installmentsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar contrato';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const openPaymentSheet = useCallback((installment: Installment) => {
    setSelectedInstallment(installment);
    setPaidValue(formatCurrency(installment.value));
    setPaidDate(new Date());
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

  const renderInstallmentItem = useCallback(
    ({ item }: { item: Installment }) => {
      const statusColor = getStatusColor(item.status, colors);
      const isPending = item.status === 'pending' || item.status === 'overdue';

      return (
        <View style={[styles.installmentCard, { backgroundColor: colors.card }, Shadows.sm]}>
          <View style={styles.installmentHeader}>
            <View style={styles.installmentInfo}>
              <Text style={[styles.installmentNumber, { color: colors.text }]}>
                Parcela {item.number}
              </Text>
              <Text style={[styles.installmentDate, { color: colors.textSecondary }]}>
                Vencimento: {formatDate(item.dueDate)}
              </Text>
            </View>
            <View style={[styles.installmentBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.installmentBadgeText, { color: statusColor }]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>

          <View style={styles.installmentValues}>
            <View>
              <Text style={[styles.installmentLabel, { color: colors.textSecondary }]}>Valor</Text>
              <Text style={[styles.installmentValue, { color: colors.text }]}>
                {formatCurrency(item.value)}
              </Text>
            </View>
            {item.paidValue !== undefined && item.paidValue > 0 && (
              <View>
                <Text style={[styles.installmentLabel, { color: colors.textSecondary }]}>Pago</Text>
                <Text style={[styles.installmentValue, { color: colors.success }]}>
                  {formatCurrency(item.paidValue)}
                </Text>
              </View>
            )}
            {item.paidDate && (
              <View>
                <Text style={[styles.installmentLabel, { color: colors.textSecondary }]}>Data Pgto</Text>
                <Text style={[styles.installmentValue, { color: colors.text }]}>
                  {formatDate(item.paidDate)}
                </Text>
              </View>
            )}
          </View>

          {isPending && (
            <TouchableOpacity
              style={[styles.payButton, { backgroundColor: colors.success }]}
              onPress={() => openPaymentSheet(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
              <Text style={styles.payButtonText}>Marcar como pago</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [colors, openPaymentSheet],
  );

  if (loading) {
    return <LoadingState message="Carregando contrato..." />;
  }

  if (error || !contract) {
    return (
      <ErrorState
        message={error ?? 'Contrato nao encontrado'}
        onRetry={loadData}
      />
    );
  }

  const progress = contract.totalValue > 0 ? contract.paidTotal / contract.totalValue : 0;
  const progressPercentage = Math.min(Math.round(progress * 100), 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={installments}
        keyExtractor={(item) => item.id}
        renderItem={renderInstallmentItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <View style={[styles.summaryCard, { backgroundColor: colors.card }, Shadows.sm]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Cliente</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{contract.clientName}</Text>
              </View>
              {contract.caseName && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Processo</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>{contract.caseName}</Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tipo</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {getContractTypeLabel(contract.type)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Valor Total</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatCurrency(contract.totalValue)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Pago</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  {formatCurrency(contract.paidTotal)}
                </Text>
              </View>
              {contract.signedDate && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Assinatura</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {formatDate(contract.signedDate)}
                  </Text>
                </View>
              )}
              {contract.description && (
                <View style={[styles.summaryRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Descricao</Text>
                  <Text style={[styles.descriptionText, { color: colors.text }]}>
                    {contract.description}
                  </Text>
                </View>
              )}

              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressTitle, { color: colors.text }]}>
                    Progresso de Pagamento
                  </Text>
                  <Text style={[styles.progressPercentage, { color: colors.primary }]}>
                    {progressPercentage}%
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.borderLight }]}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${progressPercentage}%`,
                        backgroundColor: colors.success,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressDetail, { color: colors.textSecondary }]}>
                  {contract.paidCount} de {contract.installmentsCount} parcelas pagas
                </Text>
              </View>
            </View>

            <Text style={[styles.installmentsTitle, { color: colors.text }]}>
              Parcelas
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyInstallments}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhuma parcela encontrada
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        height={420}
      >
        <Text style={[styles.sheetTitle, { color: colors.text }]}>
          Registrar Pagamento
        </Text>
        {selectedInstallment && (
          <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
            Parcela {selectedInstallment.number} - {formatCurrency(selectedInstallment.value)}
          </Text>
        )}

        <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>
          Metodo de Pagamento
        </Text>
        <View style={styles.paymentMethods}>
          {METHODS.map((method) => (
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

        <View style={styles.sheetDateContainer}>
          <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>
            Data do Pagamento
          </Text>
          <DateTimePicker value={paidDate} onChange={setPaidDate} mode="date" />
        </View>

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
  headerContainer: {
    paddingTop: Spacing.sm,
  },
  summaryCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  summaryLabel: {
    fontSize: Typography.sm,
  },
  summaryValue: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: Typography.sm,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  progressSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressTitle: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: Typography.md,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressDetail: {
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  installmentsTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  installmentCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  installmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  installmentInfo: {
    flex: 1,
  },
  installmentNumber: {
    fontSize: Typography.md,
    fontWeight: '600',
  },
  installmentDate: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  installmentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  installmentBadgeText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  installmentValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  installmentLabel: {
    fontSize: Typography.xs,
  },
  installmentValue: {
    fontSize: Typography.sm,
    fontWeight: '600',
    marginTop: 2,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  emptyInstallments: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sm,
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
  sheetDateContainer: {
    marginBottom: Spacing.md,
  },
});
