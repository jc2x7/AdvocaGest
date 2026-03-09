import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dateUtils';
import { FeeContract, ContractType, ContractStatus } from '../../types/financial';

interface ContractCardProps {
  contract: FeeContract;
  onPress?: (contract: FeeContract) => void;
}

const TYPE_LABELS: Record<ContractType, string> = {
  fixed: 'Valor Fixo',
  success: 'Exito',
  mixed: 'Misto',
  hourly: 'Hora Tecnica',
};

const STATUS_CONFIG: Record<ContractStatus, { label: string; colorKey: 'success' | 'info' | 'error' }> = {
  active: { label: 'Ativo', colorKey: 'success' },
  completed: { label: 'Concluido', colorKey: 'info' },
  cancelled: { label: 'Cancelado', colorKey: 'error' },
};

export default function ContractCard({ contract, onPress }: ContractCardProps) {
  const { colors } = useTheme();

  const statusConfig = STATUS_CONFIG[contract.status];
  const getStatusColor = (): string => {
    const map: Record<string, string> = {
      success: colors.success,
      info: colors.info,
      error: colors.error,
    };
    return map[statusConfig.colorKey];
  };
  const statusColor = getStatusColor();

  const progress =
    contract.installmentsCount > 0
      ? (contract.paidCount / contract.installmentsCount) * 100
      : 0;

  const remaining = contract.totalValue - contract.paidTotal;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }, Shadows.sm]}
      onPress={() => onPress?.(contract)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.clientName, { color: colors.text }]} numberOfLines={1}>
            {contract.clientName}
          </Text>
          {contract.caseName && (
            <Text style={[styles.caseName, { color: colors.textSecondary }]} numberOfLines={1}>
              {contract.caseName}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      <View style={styles.typeRow}>
        <View style={[styles.typeBadge, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.typeText, { color: colors.primary }]}>
            {TYPE_LABELS[contract.type]}
          </Text>
        </View>
        <Text style={[styles.totalValue, { color: colors.text }]}>
          {formatCurrency(contract.totalValue)}
        </Text>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
            {contract.paidCount}/{contract.installmentsCount} parcelas pagas
          </Text>
          <Text style={[styles.progressPercent, { color: colors.primary }]}>
            {progress.toFixed(0)}%
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.success, width: `${progress}%` },
            ]}
          />
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
        <View style={styles.footerItem}>
          <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
          <Text style={[styles.footerText, { color: colors.success }]}>
            {formatCurrency(contract.paidTotal)}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="time-outline" size={14} color={colors.warning} />
          <Text style={[styles.footerText, { color: colors.warning }]}>
            {formatCurrency(remaining)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  clientName: {
    fontSize: Typography.md,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 2,
  },
  caseName: {
    fontSize: Typography.xs,
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
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  totalValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  progressSection: {
    marginBottom: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    fontSize: Typography.xs,
  },
  progressPercent: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});
