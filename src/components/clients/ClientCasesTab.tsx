import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { LegalCase, CaseStatus, LegalArea } from '../../types/case';

interface ClientCasesTabProps {
  cases: LegalCase[];
  onPressCase?: (legalCase: LegalCase) => void;
}

const STATUS_CONFIG: Record<CaseStatus, { label: string; colorKey: 'success' | 'warning' | 'info' | 'error' }> = {
  active: { label: 'Ativo', colorKey: 'success' },
  suspended: { label: 'Suspenso', colorKey: 'warning' },
  archived: { label: 'Arquivado', colorKey: 'info' },
  closed: { label: 'Encerrado', colorKey: 'error' },
};

const AREA_LABELS: Record<LegalArea, string> = {
  civil: 'Civil',
  trabalhista: 'Trabalhista',
  criminal: 'Criminal',
  previdenciario: 'Previdenciario',
  tributario: 'Tributario',
  familia: 'Familia',
  consumidor: 'Consumidor',
  administrativo: 'Administrativo',
  ambiental: 'Ambiental',
  empresarial: 'Empresarial',
};

export default function ClientCasesTab({ cases, onPressCase }: ClientCasesTabProps) {
  const { colors } = useTheme();

  const getStatusColor = (status: CaseStatus): string => {
    const colorKey = STATUS_CONFIG[status].colorKey;
    const map: Record<string, string> = {
      success: colors.success,
      warning: colors.warning,
      info: colors.info,
      error: colors.error,
    };
    return map[colorKey];
  };

  const renderCase = ({ item }: { item: LegalCase }) => {
    const statusConfig = STATUS_CONFIG[item.status];
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={[styles.caseCard, { backgroundColor: colors.card }, Shadows.sm]}
        onPress={() => onPressCase?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.caseHeader}>
          <Text
            style={[styles.caseNumber, { color: colors.primary }]}
            numberOfLines={1}
          >
            {item.caseNumber}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <Text
          style={[styles.caseType, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.type}
        </Text>

        <View style={styles.caseMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="layers-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {AREA_LABELS[item.area]}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.court}
            </Text>
          </View>
        </View>

        {item.caseValue !== undefined && (
          <Text style={[styles.caseValue, { color: colors.success }]}>
            Valor: {formatCurrency(item.caseValue)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={cases}
      renderItem={renderCase}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase-outline" size={40} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            Nenhum processo encontrado
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  caseCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  caseNumber: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
    flex: 1,
    marginRight: Spacing.sm,
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
  caseType: {
    fontSize: Typography.md,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.sm,
  },
  caseMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metaText: {
    fontSize: Typography.xs,
    flex: 1,
  },
  caseValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
    marginTop: Spacing.xs,
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
