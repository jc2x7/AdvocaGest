import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { getRelativeTime } from '../../utils/dateUtils';
import { Lead, LeadStage, LeadSource, LEAD_STAGES, LEAD_SOURCES } from '../../types/lead';

interface LeadCardProps {
  lead: Lead;
  onPress?: (lead: Lead) => void;
}

function getStageConfig(stage: LeadStage): { label: string; color: string } {
  const found = LEAD_STAGES.find((s) => s.value === stage);
  return found || { label: stage, color: '#64748b' };
}

function getSourceLabel(source: LeadSource): string {
  const found = LEAD_SOURCES.find((s) => s.value === source);
  return found ? found.label : source;
}

function getScoreColor(score: number, colors: ReturnType<typeof import('../../store/ThemeContext').useTheme>['colors']): string {
  if (score >= 80) return colors.success;
  if (score >= 50) return colors.warning;
  return colors.error;
}

export default function LeadCard({ lead, onPress }: LeadCardProps) {
  const { colors } = useTheme();

  const stageConfig = getStageConfig(lead.stage);
  const scoreColor = getScoreColor(lead.score, colors);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderLeftColor: stageConfig.color },
        Shadows.sm,
      ]}
      onPress={() => onPress?.(lead)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {lead.name}
          </Text>
          <View style={[styles.stageBadge, { backgroundColor: stageConfig.color + '20' }]}>
            <View style={[styles.stageDot, { backgroundColor: stageConfig.color }]} />
            <Text style={[styles.stageText, { color: stageConfig.color }]}>
              {stageConfig.label}
            </Text>
          </View>
        </View>

        <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20' }]}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>
            {lead.score}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="call-outline" size={12} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {lead.phone}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="megaphone-outline" size={12} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {getSourceLabel(lead.source)}
          </Text>
        </View>
      </View>

      {lead.area && (
        <View style={styles.metaItem}>
          <Ionicons name="layers-outline" size={12} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {lead.area}
          </Text>
        </View>
      )}

      <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
        {lead.estimatedValue !== undefined && (
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={12} color={colors.success} />
            <Text style={[styles.footerText, { color: colors.success }]}>
              {formatCurrency(lead.estimatedValue)}
            </Text>
          </View>
        )}
        {lead.lastContactDate && (
          <Text style={[styles.footerTime, { color: colors.textTertiary }]}>
            Contato: {getRelativeTime(lead.lastContactDate)}
          </Text>
        )}
        {lead.nextFollowUpDate && (
          <View style={[styles.followUpBadge, { backgroundColor: colors.warningLight }]}>
            <Ionicons name="flag-outline" size={10} color={colors.warning} />
            <Text style={[styles.followUpText, { color: colors.warning }]}>
              Follow-up
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
  name: {
    fontSize: Typography.md,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stageText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  scoreBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Typography.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderTopWidth: 1,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  footerTime: {
    fontSize: Typography.xs,
  },
  followUpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  followUpText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.semibold,
  },
});
