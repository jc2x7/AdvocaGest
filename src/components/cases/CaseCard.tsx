import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { LegalCase, CaseStatus, CasePhase, LegalArea } from '../../types/case';
import { getRelativeTime } from '../../utils/dateUtils';

interface CaseCardProps {
  legalCase: LegalCase;
  onPress?: (legalCase: LegalCase) => void;
}

const STATUS_CONFIG: Record<CaseStatus, { label: string; colorKey: 'success' | 'warning' | 'info' | 'error' }> = {
  active: { label: 'Ativo', colorKey: 'success' },
  suspended: { label: 'Suspenso', colorKey: 'warning' },
  archived: { label: 'Arquivado', colorKey: 'info' },
  closed: { label: 'Encerrado', colorKey: 'error' },
};

const PHASE_LABELS: Record<CasePhase, string> = {
  conhecimento: 'Conhecimento',
  recursal: 'Recursal',
  execucao: 'Execucao',
  cumprimento_sentenca: 'Cumprimento de Sentenca',
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

export default function CaseCard({ legalCase, onPress }: CaseCardProps) {
  const { colors } = useTheme();

  const statusConfig = STATUS_CONFIG[legalCase.status];
  const getStatusColor = (): string => {
    const map: Record<string, string> = {
      success: colors.success,
      warning: colors.warning,
      info: colors.info,
      error: colors.error,
    };
    return map[statusConfig.colorKey];
  };
  const statusColor = getStatusColor();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderLeftColor: statusColor },
        Shadows.sm,
      ]}
      onPress={() => onPress?.(legalCase)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text
          style={[styles.caseNumber, { color: colors.primary }]}
          numberOfLines={1}
        >
          {legalCase.caseNumber}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      <Text
        style={[styles.clientName, { color: colors.text }]}
        numberOfLines={1}
      >
        {legalCase.clientName}
      </Text>

      <View style={styles.tagsRow}>
        <View style={[styles.tag, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.tagText, { color: colors.textSecondary }]}>
            {AREA_LABELS[legalCase.area]}
          </Text>
        </View>
        <View style={[styles.tag, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.tagText, { color: colors.textSecondary }]}>
            {PHASE_LABELS[legalCase.phase]}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="business-outline" size={12} color={colors.textTertiary} />
          <Text
            style={[styles.footerText, { color: colors.textTertiary }]}
            numberOfLines={1}
          >
            {legalCase.court}
          </Text>
        </View>
        {legalCase.lastMovementDate && (
          <View style={styles.footerItem}>
            <Ionicons name="swap-vertical-outline" size={12} color={colors.textTertiary} />
            <Text style={[styles.footerText, { color: colors.textTertiary }]}>
              {getRelativeTime(legalCase.lastMovementDate)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  caseNumber: {
    fontSize: Typography.xs,
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
  clientName: {
    fontSize: Typography.md,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  footerText: {
    fontSize: Typography.xs,
  },
});
