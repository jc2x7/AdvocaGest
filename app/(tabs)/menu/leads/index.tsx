import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/store/ThemeContext';
import { useAuth } from '../../../../src/store/AuthContext';
import { Lead, LeadStage, LEAD_STAGES } from '../../../../src/types/lead';
import { subscribeToLeads } from '../../../../src/services/firebase/leadService';
import { formatCurrency } from '../../../../src/utils/currency';
import { getRelativeTime } from '../../../../src/utils/dateUtils';
import SearchBar from '../../../../src/components/ui/SearchBar';
import LoadingState from '../../../../src/components/ui/LoadingState';
import EmptyState from '../../../../src/components/ui/EmptyState';
import ErrorState from '../../../../src/components/ui/ErrorState';
import { BorderRadius, Shadows, Spacing, Typography } from '../../../../src/constants/theme';

type ViewMode = 'kanban' | 'list';

const KANBAN_STAGES: LeadStage[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation'];

function LeadCard({
  lead,
  onPress,
  colors,
}: {
  lead: Lead;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const stageInfo = LEAD_STAGES.find((s) => s.value === lead.stage);

  return (
    <TouchableOpacity
      style={[styles.leadCard, Shadows.sm, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leadCardHeader}>
        <Text style={[styles.leadName, { color: colors.text }]} numberOfLines={1}>
          {lead.name}
        </Text>
        {lead.score > 0 && (
          <View style={[styles.scoreBadge, { backgroundColor: colors.warningLight }]}>
            <Text style={[styles.scoreText, { color: colors.warning }]}>{lead.score}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.leadArea, { color: colors.textSecondary }]} numberOfLines={1}>
        {lead.area}
      </Text>
      {lead.estimatedValue !== undefined && lead.estimatedValue > 0 && (
        <Text style={[styles.leadValue, { color: colors.success }]}>
          {formatCurrency(lead.estimatedValue)}
        </Text>
      )}
      <View style={styles.leadCardFooter}>
        <View style={[styles.leadSourceTag, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.leadSourceText, { color: colors.textTertiary }]}>
            {lead.source}
          </Text>
        </View>
        <Text style={[styles.leadTime, { color: colors.textTertiary }]}>
          {getRelativeTime(lead.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function KanbanColumn({
  stage,
  leads,
  onLeadPress,
  colors,
}: {
  stage: { label: string; value: LeadStage; color: string };
  leads: Lead[];
  onLeadPress: (id: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[styles.kanbanColumn, { backgroundColor: colors.surfaceVariant }]}>
      <View style={styles.kanbanHeader}>
        <View style={[styles.kanbanIndicator, { backgroundColor: stage.color }]} />
        <Text style={[styles.kanbanTitle, { color: colors.text }]}>{stage.label}</Text>
        <View style={[styles.kanbanCount, { backgroundColor: stage.color + '20' }]}>
          <Text style={[styles.kanbanCountText, { color: stage.color }]}>{leads.length}</Text>
        </View>
      </View>
      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LeadCard lead={item} onPress={() => onLeadPress(item.id)} colors={colors} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.kanbanList}
      />
    </View>
  );
}

export default function LeadsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  const loadLeads = useCallback(() => {
    if (!user) return;
    setError(null);
    try {
      const unsubscribe = subscribeToLeads(user.uid, (data) => {
        setLeads(data);
        setLoading(false);
        setRefreshing(false);
      });
      return unsubscribe;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar leads';
      setError(message);
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = loadLeads();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadLeads]);

  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const query = searchQuery.toLowerCase();
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(query) ||
        l.area.toLowerCase().includes(query) ||
        l.phone.includes(query) ||
        (l.email && l.email.toLowerCase().includes(query))
    );
  }, [leads, searchQuery]);

  const kanbanData = useMemo(() => {
    const activeStages = LEAD_STAGES.filter((s) => KANBAN_STAGES.includes(s.value));
    return activeStages.map((stage) => ({
      stage,
      leads: filteredLeads.filter((l) => l.stage === stage.value),
    }));
  }, [filteredLeads]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadLeads();
  }, [loadLeads]);

  const navigateToLead = useCallback(
    (id: string) => {
      router.push(`/(tabs)/menu/leads/${id}`);
    },
    [router]
  );

  const navigateToNew = useCallback(() => {
    router.push('/(tabs)/menu/leads/new');
  }, [router]);

  const navigateToMetrics = useCallback(() => {
    router.push('/(tabs)/menu/leads/metrics');
  }, [router]);

  if (loading) {
    return <LoadingState message="Carregando leads..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadLeads} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>Leads</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={navigateToMetrics}
            style={[styles.iconButton, { backgroundColor: colors.surfaceVariant }]}
          >
            <Ionicons name="bar-chart-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <View style={[styles.viewToggle, { backgroundColor: colors.surfaceVariant }]}>
            <TouchableOpacity
              onPress={() => setViewMode('kanban')}
              style={[
                styles.toggleButton,
                viewMode === 'kanban' && { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons
                name="grid-outline"
                size={16}
                color={viewMode === 'kanban' ? '#ffffff' : colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('list')}
              style={[
                styles.toggleButton,
                viewMode === 'list' && { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons
                name="list-outline"
                size={16}
                color={viewMode === 'list' ? '#ffffff' : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar leads..."
        style={styles.searchBar}
      />

      {filteredLeads.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="Nenhum lead encontrado"
          message={searchQuery ? 'Tente outro termo de busca' : 'Comece adicionando seu primeiro lead'}
          actionLabel="Novo Lead"
          onAction={navigateToNew}
        />
      ) : viewMode === 'kanban' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kanbanContainer}
        >
          {kanbanData.map(({ stage, leads: stageLeads }) => (
            <KanbanColumn
              key={stage.value}
              stage={stage}
              leads={stageLeads}
              onLeadPress={navigateToLead}
              colors={colors}
            />
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={filteredLeads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LeadCard lead={item} onPress={() => navigateToLead(item.id)} colors={colors} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
        />
      )}

      <TouchableOpacity
        style={[styles.fab, Shadows.lg, { backgroundColor: colors.primary }]}
        onPress={navigateToNew}
        activeOpacity={0.8}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  toggleButton: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    margin: Spacing.md,
  },
  kanbanContainer: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: 80,
  },
  kanbanColumn: {
    width: 260,
    marginHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    flex: 1,
    maxHeight: '100%',
  },
  kanbanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  kanbanIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  kanbanTitle: {
    fontSize: Typography.sm,
    fontWeight: '600',
    flex: 1,
  },
  kanbanCount: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  kanbanCountText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  kanbanList: {
    paddingBottom: Spacing.sm,
  },
  leadCard: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.sm,
  },
  leadCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  leadName: {
    fontSize: Typography.sm,
    fontWeight: '600',
    flex: 1,
  },
  scoreBadge: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.xs,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: '700',
  },
  leadArea: {
    fontSize: Typography.xs,
    marginBottom: 4,
  },
  leadValue: {
    fontSize: Typography.xs,
    fontWeight: '600',
    marginBottom: 4,
  },
  leadCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  leadSourceTag: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  leadSourceText: {
    fontSize: 10,
  },
  leadTime: {
    fontSize: 10,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 80,
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
