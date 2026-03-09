import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../src/store/ThemeContext';
import { useAuth } from '../../../src/store/AuthContext';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../src/constants/theme';
import { LEGAL_AREA_MAP } from '../../../src/constants/legalAreas';
import { formatDate, getDaysUntil } from '../../../src/utils/dateUtils';
import { formatCurrency } from '../../../src/utils/currency';
import Badge from '../../../src/components/ui/Badge';
import LoadingState from '../../../src/components/ui/LoadingState';
import ErrorState from '../../../src/components/ui/ErrorState';
import EmptyState from '../../../src/components/ui/EmptyState';
import Card from '../../../src/components/ui/Card';
import { getCaseById } from '../../../src/services/firebase/caseService';
import { LegalCase, CaseStatus } from '../../../src/types/case';

type TabKey = 'resumo' | 'movimentacoes' | 'prazos' | 'documentos' | 'partes' | 'financeiro' | 'estrategia';

const TABS: Array<{ key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'resumo', label: 'Resumo', icon: 'document-text-outline' },
  { key: 'movimentacoes', label: 'Movimentacoes', icon: 'swap-vertical-outline' },
  { key: 'prazos', label: 'Prazos', icon: 'alert-circle-outline' },
  { key: 'documentos', label: 'Documentos', icon: 'folder-outline' },
  { key: 'partes', label: 'Partes', icon: 'people-outline' },
  { key: 'financeiro', label: 'Financeiro', icon: 'cash-outline' },
  { key: 'estrategia', label: 'Estrategia', icon: 'bulb-outline' },
];

const STATUS_BADGE_MAP: Record<CaseStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  active: { label: 'Ativo', variant: 'success' },
  suspended: { label: 'Suspenso', variant: 'warning' },
  archived: { label: 'Arquivado', variant: 'neutral' },
  closed: { label: 'Encerrado', variant: 'info' },
};

const ROLE_LABELS: Record<string, string> = {
  author: 'Autor',
  defendant: 'Reu',
  third_party: 'Terceiro',
  assistant: 'Assistente',
};

const PHASE_LABELS: Record<string, string> = {
  conhecimento: 'Conhecimento',
  recursal: 'Recursal',
  execucao: 'Execucao',
  cumprimento_sentenca: 'Cumprimento de Sentenca',
};

export default function CaseDetailScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legalCase, setLegalCase] = useState<LegalCase | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('resumo');

  const fetchData = useCallback(async () => {
    if (!user || !id) return;
    try {
      setError(null);
      const data = await getCaseById(user.uid, id);
      if (!data) {
        setError('Processo nao encontrado.');
        return;
      }
      setLegalCase(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar processo.';
      setError(message);
    }
  }, [user, id]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    void load();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const renderInfoRow = useCallback(
    (label: string, value: string | undefined, icon?: keyof typeof Ionicons.glyphMap) => {
      if (!value) return null;
      return (
        <View style={styles.infoRow}>
          {icon && <Ionicons name={icon} size={16} color={colors.textTertiary} style={styles.infoIcon} />}
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
          </View>
        </View>
      );
    },
    [colors],
  );

  const renderResumo = useCallback(() => {
    if (!legalCase) return null;
    const areaLabel = LEGAL_AREA_MAP[legalCase.area] ?? legalCase.area;
    const roleLabel = ROLE_LABELS[legalCase.role] ?? legalCase.role;
    const phaseLabel = PHASE_LABELS[legalCase.phase] ?? legalCase.phase;

    return (
      <View style={styles.tabContent}>
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Informacoes Gerais</Text>
          {renderInfoRow('Numero do Processo', legalCase.caseNumber, 'document-text-outline')}
          {renderInfoRow('Cliente', legalCase.clientName, 'person-outline')}
          {renderInfoRow('Area', areaLabel, 'briefcase-outline')}
          {renderInfoRow('Tipo', legalCase.type, 'list-outline')}
          {renderInfoRow('Polo', roleLabel, 'flag-outline')}
          {renderInfoRow('Fase', phaseLabel, 'layers-outline')}
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tribunal</Text>
          {renderInfoRow('Tribunal', legalCase.court, 'business-outline')}
          {renderInfoRow('Vara/Camara', legalCase.branch, 'home-outline')}
          {renderInfoRow('Jurisdicao', legalCase.jurisdiction, 'globe-outline')}
          {renderInfoRow('Juiz', legalCase.judge, 'person-circle-outline')}
        </Card>

        {legalCase.caseValue !== undefined && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Financeiro</Text>
            {renderInfoRow('Valor da Causa', formatCurrency(legalCase.caseValue), 'cash-outline')}
            {renderInfoRow('Receita', formatCurrency(legalCase.revenue), 'trending-up-outline')}
            {renderInfoRow('Despesas', formatCurrency(legalCase.expenses), 'trending-down-outline')}
          </Card>
        )}

        {legalCase.description && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Descricao</Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {legalCase.description}
            </Text>
          </Card>
        )}

        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Datas</Text>
          {renderInfoRow('Criado em', formatDate(legalCase.createdAt), 'calendar-outline')}
          {renderInfoRow('Atualizado em', formatDate(legalCase.updatedAt), 'time-outline')}
          {legalCase.nextDeadline && renderInfoRow('Proximo Prazo', formatDate(legalCase.nextDeadline), 'alert-circle-outline')}
        </Card>
      </View>
    );
  }, [legalCase, colors, renderInfoRow]);

  const renderMovimentacoes = useCallback(() => {
    if (!legalCase?.lastMovement) {
      return (
        <EmptyState
          icon="swap-vertical-outline"
          title="Sem movimentacoes"
          message="Nenhuma movimentacao registrada neste processo."
        />
      );
    }
    return (
      <View style={styles.tabContent}>
        <Card style={styles.sectionCard}>
          <View style={styles.movementItem}>
            <View style={[styles.movementDot, { backgroundColor: colors.primary }]} />
            <View style={styles.movementContent}>
              <Text style={[styles.movementText, { color: colors.text }]}>{legalCase.lastMovement}</Text>
              {legalCase.lastMovementDate && (
                <Text style={[styles.movementDate, { color: colors.textSecondary }]}>
                  {formatDate(legalCase.lastMovementDate)}
                </Text>
              )}
            </View>
          </View>
        </Card>
      </View>
    );
  }, [legalCase, colors]);

  const renderPrazos = useCallback(() => {
    if (!legalCase?.nextDeadline) {
      return (
        <EmptyState
          icon="alert-circle-outline"
          title="Sem prazos"
          message="Nenhum prazo registrado neste processo."
        />
      );
    }
    const daysUntil = getDaysUntil(legalCase.nextDeadline);
    const deadlineColor = daysUntil < 0 ? colors.error : daysUntil < 3 ? '#f97316' : daysUntil < 7 ? colors.warning : colors.success;

    return (
      <View style={styles.tabContent}>
        <Card style={styles.sectionCard}>
          <View style={[styles.deadlineCard, { borderLeftColor: deadlineColor }]}>
            <Ionicons name="alert-circle" size={24} color={deadlineColor} />
            <View style={styles.deadlineInfo}>
              <Text style={[styles.deadlineTitle, { color: colors.text }]}>Proximo Prazo</Text>
              <Text style={[styles.deadlineDate, { color: colors.textSecondary }]}>
                {formatDate(legalCase.nextDeadline)}
              </Text>
              <Text style={[styles.deadlineCountdown, { color: deadlineColor }]}>
                {daysUntil < 0
                  ? `${Math.abs(daysUntil)} dia(s) atrasado`
                  : daysUntil === 0
                  ? 'Vence hoje'
                  : `${daysUntil} dia(s) restantes`}
              </Text>
            </View>
          </View>
        </Card>
      </View>
    );
  }, [legalCase, colors]);

  const renderDocumentos = useCallback(() => (
    <EmptyState
      icon="folder-outline"
      title="Sem documentos"
      message="Nenhum documento vinculado a este processo."
      actionLabel="Adicionar Documento"
    />
  ), []);

  const renderPartes = useCallback(() => {
    if (!legalCase) return null;
    const roleLabel = ROLE_LABELS[legalCase.role] ?? legalCase.role;

    return (
      <View style={styles.tabContent}>
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Partes do Processo</Text>
          {renderInfoRow('Cliente (' + roleLabel + ')', legalCase.clientName, 'person-outline')}
          {renderInfoRow('Parte Contraria', legalCase.opposingParty, 'people-outline')}
          {renderInfoRow('Advogado Contrario', legalCase.opposingLawyer, 'person-outline')}
          {renderInfoRow('Juiz', legalCase.judge, 'person-circle-outline')}
        </Card>
      </View>
    );
  }, [legalCase, colors, renderInfoRow]);

  const renderFinanceiro = useCallback(() => {
    if (!legalCase) return null;
    return (
      <View style={styles.tabContent}>
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Resumo Financeiro</Text>
          {renderInfoRow('Valor da Causa', legalCase.caseValue !== undefined ? formatCurrency(legalCase.caseValue) : 'Nao informado', 'cash-outline')}
          {renderInfoRow('Receita', formatCurrency(legalCase.revenue), 'trending-up-outline')}
          {renderInfoRow('Despesas', formatCurrency(legalCase.expenses), 'trending-down-outline')}
          {renderInfoRow('Saldo', formatCurrency(legalCase.revenue - legalCase.expenses), 'wallet-outline')}
        </Card>
      </View>
    );
  }, [legalCase, colors, renderInfoRow]);

  const renderEstrategia = useCallback(() => {
    if (!legalCase?.strategy) {
      return (
        <EmptyState
          icon="bulb-outline"
          title="Sem estrategia"
          message="Nenhuma estrategia definida para este processo."
        />
      );
    }
    return (
      <View style={styles.tabContent}>
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Estrategia</Text>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            {legalCase.strategy}
          </Text>
        </Card>
      </View>
    );
  }, [legalCase, colors]);

  const renderActiveTab = useCallback(() => {
    switch (activeTab) {
      case 'resumo': return renderResumo();
      case 'movimentacoes': return renderMovimentacoes();
      case 'prazos': return renderPrazos();
      case 'documentos': return renderDocumentos();
      case 'partes': return renderPartes();
      case 'financeiro': return renderFinanceiro();
      case 'estrategia': return renderEstrategia();
      default: return null;
    }
  }, [activeTab, renderResumo, renderMovimentacoes, renderPrazos, renderDocumentos, renderPartes, renderFinanceiro, renderEstrategia]);

  if (loading) {
    return <LoadingState message="Carregando processo..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  if (!legalCase) {
    return <EmptyState icon="briefcase-outline" title="Processo nao encontrado" />;
  }

  const statusBadge = STATUS_BADGE_MAP[legalCase.status];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }, Shadows.sm]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={[styles.caseNumber, { color: colors.primary }]} numberOfLines={1}>
              {legalCase.caseNumber}
            </Text>
            <TouchableOpacity
              onPress={() => router.push(`/(tabs)/cases/edit/${legalCase.id}`)}
              style={[styles.editButton, { backgroundColor: colors.surfaceVariant }]}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.clientName, { color: colors.text }]} numberOfLines={1}>
            {legalCase.clientName}
          </Text>
          <Badge label={statusBadge.label} variant={statusBadge.variant} />
        </View>
      </View>

      {/* Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { borderBottomColor: colors.border }]}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={isActive ? colors.primary : colors.textTertiary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? colors.primary : colors.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tab Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {renderActiveTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.md,
  },
  headerContent: {
    gap: Spacing.xs,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caseNumber: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.bold,
    flex: 1,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientName: {
    fontSize: Typography.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  tabBar: {
    borderBottomWidth: 1,
  },
  tabBarContent: {
    paddingHorizontal: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  tabLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  tabContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  sectionCard: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  infoIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.xs,
    marginBottom: 1,
  },
  infoValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  descriptionText: {
    fontSize: Typography.sm,
    lineHeight: 22,
  },
  movementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  movementDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: Spacing.sm,
  },
  movementContent: {
    flex: 1,
  },
  movementText: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  movementDate: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  deadlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    paddingLeft: Spacing.sm,
    gap: Spacing.sm,
  },
  deadlineInfo: {
    flex: 1,
  },
  deadlineTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  deadlineDate: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  deadlineCountdown: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.semibold,
    marginTop: 2,
  },
});
