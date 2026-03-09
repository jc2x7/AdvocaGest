import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { formatDate, getDaysUntil } from '../../utils/dateUtils';
import { Installment, InstallmentStatus } from '../../types/financial';

interface InstallmentItemProps {
  installment: Installment;
  onPay?: (installment: Installment) => void;
  onPress?: (installment: Installment) => void;
}

const STATUS_CONFIG: Record<InstallmentStatus, { label: string; colorKey: 'warning' | 'success' | 'error' | 'info' }> = {
  pending: { label: 'Pendente', colorKey: 'warning' },
  paid: { label: 'Pago', colorKey: 'success' },
  overdue: { label: 'Vencido', colorKey: 'error' },
  partial: { label: 'Parcial', colorKey: 'info' },
};

export default function InstallmentItem({
  installment,
  onPay,
  onPress,
}: InstallmentItemProps) {
  const { colors } = useTheme();

  const statusConfig = STATUS_CONFIG[installment.status];
  const getStatusColor = (): string => {
    const map: Record<string, string> = {
      warning: colors.warning,
      success: colors.success,
      error: colors.error,
      info: colors.info,
    };
    return map[statusConfig.colorKey];
  };
  const statusColor = getStatusColor();

  const isPaid = installment.status === 'paid';
  const daysUntil = getDaysUntil(installment.dueDate);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card, borderLeftColor: statusColor },
        Shadows.sm,
      ]}
      onPress={() => onPress?.(installment)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.number, { color: colors.text }]}>
              Parcela {installment.number}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
          <Text style={[styles.value, { color: colors.text }]}>
            {formatCurrency(installment.value)}
          </Text>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              Venc.: {formatDate(installment.dueDate)}
            </Text>
          </View>

          {isPaid && installment.paidDate && (
            <View style={styles.metaItem}>
              <Ionicons name="checkmark-outline" size={12} color={colors.success} />
              <Text style={[styles.metaText, { color: colors.success }]}>
                Pago em {formatDate(installment.paidDate)}
              </Text>
            </View>
          )}

          {!isPaid && daysUntil < 0 && (
            <Text style={[styles.overdueText, { color: colors.error }]}>
              {Math.abs(daysUntil)} dia{Math.abs(daysUntil) !== 1 ? 's' : ''} em atraso
            </Text>
          )}

          {!isPaid && daysUntil >= 0 && daysUntil <= 7 && (
            <Text style={[styles.dueText, { color: colors.warning }]}>
              {daysUntil === 0 ? 'Vence hoje' : `Vence em ${daysUntil} dia${daysUntil !== 1 ? 's' : ''}`}
            </Text>
          )}
        </View>

        {installment.paidValue !== undefined && installment.status === 'partial' && (
          <Text style={[styles.partialText, { color: colors.info }]}>
            Pago parcialmente: {formatCurrency(installment.paidValue)}
          </Text>
        )}
      </View>

      {!isPaid && onPay && (
        <TouchableOpacity
          style={[styles.payButton, { backgroundColor: colors.success }]}
          onPress={() => onPay(installment)}
          activeOpacity={0.7}
        >
          <Ionicons name="cash-outline" size={16} color="#ffffff" />
          <Text style={styles.payButtonText}>Pagar</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  number: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.semibold,
  },
  value: {
    fontSize: Typography.md,
    fontWeight: Typography.fontWeight.bold,
  },
  meta: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Typography.xs,
  },
  overdueText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  dueText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  partialText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
    marginTop: 4,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
});
