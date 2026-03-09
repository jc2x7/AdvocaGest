import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { FeeContract, Installment, InstallmentStatus } from '../../types/financial';
import { formatDate } from '../../utils/dateUtils';

interface ClientFinancialTabProps {
  contracts: FeeContract[];
  installments: Installment[];
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
}

const INSTALLMENT_STATUS_LABEL: Record<InstallmentStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Vencido',
  partial: 'Parcial',
};

export default function ClientFinancialTab({
  contracts,
  installments,
  totalReceived,
  totalPending,
  totalOverdue,
}: ClientFinancialTabProps) {
  const { colors } = useTheme();

  const getInstallmentColor = (status: InstallmentStatus): string => {
    const map: Record<InstallmentStatus, string> = {
      pending: colors.warning,
      paid: colors.success,
      overdue: colors.error,
      partial: colors.info,
    };
    return map[status];
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.successLight }, Shadows.sm]}>
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
          <Text style={[styles.summaryValue, { color: colors.success }]}>
            {formatCurrency(totalReceived)}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Recebido
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.warningLight }, Shadows.sm]}>
          <Ionicons name="time-outline" size={20} color={colors.warning} />
          <Text style={[styles.summaryValue, { color: colors.warning }]}>
            {formatCurrency(totalPending)}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Pendente
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.errorLight }, Shadows.sm]}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
          <Text style={[styles.summaryValue, { color: colors.error }]}>
            {formatCurrency(totalOverdue)}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Vencido
          </Text>
        </View>
      </View>

      {contracts.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Contratos
          </Text>
          {contracts.map((contract) => (
            <View
              key={contract.id}
              style={[styles.contractItem, { borderBottomColor: colors.borderLight }]}
            >
              <View style={styles.contractHeader}>
                <Text style={[styles.contractName, { color: colors.text }]} numberOfLines={1}>
                  {contract.caseName || 'Contrato Avulso'}
                </Text>
                <Text style={[styles.contractTotal, { color: colors.primary }]}>
                  {formatCurrency(contract.totalValue)}
                </Text>
              </View>
              <View style={styles.contractMeta}>
                <Text style={[styles.contractMetaText, { color: colors.textSecondary }]}>
                  {contract.paidCount}/{contract.installmentsCount} parcelas pagas
                </Text>
                <Text style={[styles.contractMetaText, { color: colors.success }]}>
                  {formatCurrency(contract.paidTotal)} recebido
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[styles.progressBar, { backgroundColor: colors.borderLight }]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: colors.success,
                        width: `${contract.installmentsCount > 0 ? (contract.paidCount / contract.installmentsCount) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {installments.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Parcelas
          </Text>
          {installments.map((installment) => {
            const statusColor = getInstallmentColor(installment.status);

            return (
              <View
                key={installment.id}
                style={[styles.installmentItem, { borderBottomColor: colors.borderLight }]}
              >
                <View style={styles.installmentLeft}>
                  <Text style={[styles.installmentNumber, { color: colors.text }]}>
                    Parcela {installment.number}
                  </Text>
                  <Text style={[styles.installmentDate, { color: colors.textSecondary }]}>
                    Venc.: {formatDate(installment.dueDate)}
                  </Text>
                </View>
                <View style={styles.installmentRight}>
                  <Text style={[styles.installmentValue, { color: colors.text }]}>
                    {formatCurrency(installment.value)}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {INSTALLMENT_STATUS_LABEL[installment.status]}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {contracts.length === 0 && installments.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="cash-outline" size={40} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            Nenhum dado financeiro
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  summaryLabel: {
    fontSize: Typography.xs,
  },
  section: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  contractItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contractName: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
    marginRight: Spacing.sm,
  },
  contractTotal: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  contractMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  contractMetaText: {
    fontSize: Typography.xs,
  },
  progressBarContainer: {
    marginTop: 4,
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
  installmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  installmentLeft: {
    flex: 1,
  },
  installmentNumber: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  installmentDate: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  installmentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  installmentValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.semibold,
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
