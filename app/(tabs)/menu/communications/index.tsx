import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SectionList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/store/ThemeContext';
import SearchBar from '../../../../src/components/ui/SearchBar';
import FilterChips from '../../../../src/components/ui/FilterChips';
import EmptyState from '../../../../src/components/ui/EmptyState';
import { BorderRadius, Shadows, Spacing, Typography } from '../../../../src/constants/theme';

type CommunicationType = 'call' | 'whatsapp' | 'email' | 'in_person' | 'video';
type CommunicationDirection = 'incoming' | 'outgoing';

interface CommunicationItem {
  id: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  clientName: string;
  subject: string;
  notes?: string;
  duration?: number;
  date: Date;
  followUpDate?: Date;
}

interface CommunicationSection {
  title: string;
  data: CommunicationItem[];
}

const TYPE_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'call', label: 'Ligacao' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'email', label: 'E-mail' },
  { key: 'in_person', label: 'Presencial' },
  { key: 'video', label: 'Video' },
];

const MOCK_COMMUNICATIONS: CommunicationItem[] = [
  { id: '1', type: 'call', direction: 'outgoing', clientName: 'Joao Silva', subject: 'Atualizacao processual', duration: 15, date: new Date(2026, 2, 9, 14, 30) },
  { id: '2', type: 'whatsapp', direction: 'incoming', clientName: 'Maria Santos', subject: 'Duvida sobre prazo', date: new Date(2026, 2, 9, 10, 0) },
  { id: '3', type: 'email', direction: 'outgoing', clientName: 'Pedro Oliveira', subject: 'Envio de documentos', date: new Date(2026, 2, 8, 16, 45) },
  { id: '4', type: 'in_person', direction: 'incoming', clientName: 'Ana Costa', subject: 'Reuniao inicial', duration: 60, date: new Date(2026, 2, 8, 9, 0) },
  { id: '5', type: 'video', direction: 'outgoing', clientName: 'Carlos Lima', subject: 'Audiencia de conciliacao', duration: 45, date: new Date(2026, 2, 7, 14, 0) },
  { id: '6', type: 'call', direction: 'incoming', clientName: 'Joao Silva', subject: 'Retorno sobre proposta', duration: 10, date: new Date(2026, 2, 7, 11, 30) },
  { id: '7', type: 'whatsapp', direction: 'outgoing', clientName: 'Fernanda Rocha', subject: 'Lembrete de audiencia', date: new Date(2026, 2, 6, 8, 0) },
  { id: '8', type: 'email', direction: 'incoming', clientName: 'Roberto Mendes', subject: 'Documentacao complementar', date: new Date(2026, 2, 5, 17, 0) },
];

function getTypeIcon(type: CommunicationType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'call': return 'call';
    case 'whatsapp': return 'logo-whatsapp';
    case 'email': return 'mail';
    case 'in_person': return 'people';
    case 'video': return 'videocam';
  }
}

function getTypeColor(type: CommunicationType): string {
  switch (type) {
    case 'call': return '#3b82f6';
    case 'whatsapp': return '#25d366';
    case 'email': return '#ef4444';
    case 'in_person': return '#f59e0b';
    case 'video': return '#8b5cf6';
  }
}

function formatDateLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function CommunicationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const filteredCommunications = useMemo(() => {
    return MOCK_COMMUNICATIONS.filter((comm) => {
      const matchesType = selectedType === 'all' || comm.type === selectedType;
      const matchesSearch =
        comm.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comm.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [searchQuery, selectedType]);

  const sections = useMemo<CommunicationSection[]>(() => {
    const grouped: Record<string, CommunicationItem[]> = {};
    for (const comm of filteredCommunications) {
      const dateKey = comm.date.toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(comm);
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([dateStr, items]) => ({
        title: formatDateLabel(new Date(dateStr)),
        data: items.sort((a, b) => b.date.getTime() - a.date.getTime()),
      }));
  }, [filteredCommunications]);

  const renderCommunication = useCallback(({ item }: { item: CommunicationItem }) => {
    const typeColor = getTypeColor(item.type);
    const typeIcon = getTypeIcon(item.type);

    return (
      <View style={[styles.commCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
        <View style={styles.timeline}>
          <View style={[styles.timelineDot, { backgroundColor: typeColor }]}>
            <Ionicons name={typeIcon} size={16} color="#ffffff" />
          </View>
          <View style={[styles.timelineLine, { backgroundColor: colors.borderLight }]} />
        </View>
        <View style={styles.commContent}>
          <View style={styles.commHeader}>
            <Text style={[styles.commTime, { color: colors.textTertiary }]}>
              {formatTime(item.date)}
            </Text>
            <View style={styles.directionBadge}>
              <Ionicons
                name={item.direction === 'incoming' ? 'arrow-down' : 'arrow-up'}
                size={12}
                color={item.direction === 'incoming' ? colors.success : colors.info}
              />
              <Text
                style={[
                  styles.directionText,
                  { color: item.direction === 'incoming' ? colors.success : colors.info },
                ]}
              >
                {item.direction === 'incoming' ? 'Recebida' : 'Enviada'}
              </Text>
            </View>
          </View>
          <Text style={[styles.commClient, { color: colors.text }]}>{item.clientName}</Text>
          <Text style={[styles.commSubject, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.subject}
          </Text>
          {item.duration !== undefined && (
            <Text style={[styles.commDuration, { color: colors.textTertiary }]}>
              Duracao: {formatDuration(item.duration)}
            </Text>
          )}
        </View>
      </View>
    );
  }, [colors]);

  const renderSectionHeader = useCallback(({ section }: { section: CommunicationSection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
    </View>
  ), [colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por cliente ou assunto..."
        />
      </View>

      <FilterChips
        options={TYPE_FILTERS}
        selectedKey={selectedType}
        onSelect={setSelectedType}
      />

      <View style={styles.headerRow}>
        <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
          {filteredCommunications.length} comunicacao(oes)
        </Text>
        <TouchableOpacity
          style={[styles.templatesButton, { backgroundColor: `${colors.primary}15` }]}
          onPress={() => router.push('/(tabs)/menu/communications/templates' as `/${string}`)}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbox-ellipses-outline" size={16} color={colors.primary} />
          <Text style={[styles.templatesText, { color: colors.primary }]}>Modelos</Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        renderItem={renderCommunication}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="Nenhuma comunicacao encontrada"
            message="Registre comunicacoes ou ajuste os filtros."
          />
        }
      />

      <TouchableOpacity
        style={[styles.fab, Shadows.lg, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(tabs)/menu/communications/new' as `/${string}`)}
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
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  resultCount: {
    fontSize: Typography.sm,
  },
  templatesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  templatesText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingVertical: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  commCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  timeline: {
    width: 44,
    alignItems: 'center',
    paddingTop: Spacing.md,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: Spacing.xs,
  },
  commContent: {
    flex: 1,
    padding: Spacing.md,
    paddingLeft: 0,
  },
  commHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  commTime: {
    fontSize: Typography.xs,
  },
  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  directionText: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  commClient: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  commSubject: {
    fontSize: Typography.sm,
    marginTop: 2,
  },
  commDuration: {
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
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
