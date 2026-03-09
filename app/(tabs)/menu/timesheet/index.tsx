import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  SectionList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/store/ThemeContext';
import { useAuth } from '../../../../src/store/AuthContext';
import { TimeEntry, TimerState, TimeEntryFormData } from '../../../../src/types/timesheet';
import { LegalCase } from '../../../../src/types/case';
import { Client } from '../../../../src/types/client';
import {
  subscribeToTimeEntries,
  createTimeEntry,
  stopTimeEntry,
  deleteTimeEntry,
} from '../../../../src/services/firebase/timesheetService';
import { getCases } from '../../../../src/services/firebase/caseService';
import { getClients } from '../../../../src/services/firebase/clientService';
import { formatDate, formatTime } from '../../../../src/utils/dateUtils';
import LoadingState from '../../../../src/components/ui/LoadingState';
import EmptyState from '../../../../src/components/ui/EmptyState';
import ErrorState from '../../../../src/components/ui/ErrorState';
import Card from '../../../../src/components/ui/Card';
import Button from '../../../../src/components/ui/Button';
import ConfirmDialog from '../../../../src/components/ui/ConfirmDialog';
import { BorderRadius, Shadows, Spacing, Typography } from '../../../../src/constants/theme';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatHoursMinutes(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}min`;
  return `${h}h ${m}min`;
}

export default function TimesheetScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timer state
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    elapsed: 0,
    description: '',
    billable: true,
  });
  const [timerDescription, setTimerDescription] = useState('');
  const [timerCaseId, setTimerCaseId] = useState('');
  const [timerCaseName, setTimerCaseName] = useState('');
  const [timerClientId, setTimerClientId] = useState('');
  const [timerClientName, setTimerClientName] = useState('');
  const [timerBillable, setTimerBillable] = useState(true);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cases, setCases] = useState<LegalCase[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showCasePicker, setShowCasePicker] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getCases(user.uid).then(setCases).catch(() => {});
    getClients(user.uid).then(setClients).catch(() => {});
  }, [user]);

  const loadEntries = useCallback(() => {
    if (!user) return;
    setError(null);
    try {
      const unsubscribe = subscribeToTimeEntries(user.uid, (data) => {
        setEntries(data);
        setLoading(false);
      });
      return unsubscribe;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar lancamentos';
      setError(message);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = loadEntries();
    return () => {
      if (unsubscribe) unsubscribe();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadEntries]);

  // Timer tick
  useEffect(() => {
    if (timer.isRunning && timer.startTime) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - timer.startTime!.getTime()) / 1000);
        setTimer((prev) => ({ ...prev, elapsed }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timer.isRunning, timer.startTime]);

  const handleStartTimer = useCallback(async () => {
    if (!user) return;
    if (!timerDescription.trim()) {
      Alert.alert('Atencao', 'Descreva a atividade antes de iniciar');
      return;
    }
    const startTime = new Date();
    try {
      const formData: TimeEntryFormData = {
        description: timerDescription.trim(),
        startTime,
        duration: 0,
        billable: timerBillable,
      };
      if (timerCaseId) {
        formData.caseId = timerCaseId;
        formData.caseName = timerCaseName;
      }
      if (timerClientId) {
        formData.clientId = timerClientId;
        formData.clientName = timerClientName;
      }
      const entryId = await createTimeEntry(user.uid, formData);
      setActiveEntryId(entryId);
      setTimer({
        isRunning: true,
        startTime,
        elapsed: 0,
        description: timerDescription,
        billable: timerBillable,
        caseId: timerCaseId || undefined,
        caseName: timerCaseName || undefined,
        clientId: timerClientId || undefined,
        clientName: timerClientName || undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao iniciar timer';
      Alert.alert('Erro', message);
    }
  }, [user, timerDescription, timerBillable, timerCaseId, timerCaseName, timerClientId, timerClientName]);

  const handlePauseTimer = useCallback(() => {
    setTimer((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  }, []);

  const handleStopTimer = useCallback(async () => {
    if (!user || !activeEntryId) return;
    const endTime = new Date();
    const duration = timer.elapsed;
    try {
      await stopTimeEntry(user.uid, activeEntryId, endTime, duration);
      setTimer({
        isRunning: false,
        startTime: null,
        elapsed: 0,
        description: '',
        billable: true,
      });
      setActiveEntryId(null);
      setTimerDescription('');
      setTimerCaseId('');
      setTimerCaseName('');
      setTimerClientId('');
      setTimerClientName('');
      setTimerBillable(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao parar timer';
      Alert.alert('Erro', message);
    }
  }, [user, activeEntryId, timer.elapsed]);

  const handleDeleteEntry = useCallback(async () => {
    if (!user || !deleteEntryId) return;
    try {
      await deleteTimeEntry(user.uid, deleteEntryId);
      setDeleteEntryId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir lancamento';
      Alert.alert('Erro', message);
    }
  }, [user, deleteEntryId]);

  const sections = useMemo(() => {
    const grouped = new Map<string, TimeEntry[]>();
    entries.forEach((entry) => {
      const dateKey = format(entry.startTime, 'yyyy-MM-dd');
      const existing = grouped.get(dateKey) ?? [];
      existing.push(entry);
      grouped.set(dateKey, existing);
    });
    return Array.from(grouped.entries()).map(([dateKey, data]) => ({
      title: format(new Date(dateKey), "EEEE, dd 'de' MMMM", { locale: ptBR }),
      data,
    }));
  }, [entries]);

  if (loading) {
    return <LoadingState message="Carregando lancamentos..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadEntries} />;
  }

  const isTimerActive = timer.startTime !== null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>Timesheet</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/menu/timesheet/report')}
          style={[styles.iconButton, { backgroundColor: colors.surfaceVariant }]}
        >
          <Ionicons name="bar-chart-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Timer Widget */}
      <Card style={styles.timerCard}>
        <Text style={[styles.timerDisplay, { color: colors.text }]}>
          {formatDuration(timer.elapsed)}
        </Text>

        {!isTimerActive && (
          <>
            <TextInput
              value={timerDescription}
              onChangeText={setTimerDescription}
              placeholder="O que voce esta fazendo?"
              placeholderTextColor={colors.placeholder}
              style={[styles.timerInput, { color: colors.text, borderColor: colors.border }]}
            />
            <View style={styles.timerSelectors}>
              <TouchableOpacity
                onPress={() => setShowCasePicker(true)}
                style={[styles.selectorChip, { backgroundColor: colors.surfaceVariant }]}
              >
                <Ionicons name="briefcase-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.selectorText, { color: timerCaseName ? colors.text : colors.textTertiary }]} numberOfLines={1}>
                  {timerCaseName || 'Processo'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowClientPicker(true)}
                style={[styles.selectorChip, { backgroundColor: colors.surfaceVariant }]}
              >
                <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.selectorText, { color: timerClientName ? colors.text : colors.textTertiary }]} numberOfLines={1}>
                  {timerClientName || 'Cliente'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTimerBillable(!timerBillable)}
                style={[styles.selectorChip, { backgroundColor: timerBillable ? colors.successLight : colors.surfaceVariant }]}
              >
                <Ionicons name="cash-outline" size={14} color={timerBillable ? colors.success : colors.textTertiary} />
                <Text style={[styles.selectorText, { color: timerBillable ? colors.success : colors.textTertiary }]}>
                  {timerBillable ? 'Faturavel' : 'Nao faturavel'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.timerButtons}>
          {!isTimerActive ? (
            <TouchableOpacity
              onPress={handleStartTimer}
              style={[styles.timerButton, { backgroundColor: colors.success }]}
            >
              <Ionicons name="play" size={24} color="#ffffff" />
              <Text style={styles.timerButtonText}>Iniciar</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                onPress={handlePauseTimer}
                style={[styles.timerButton, { backgroundColor: colors.warning }]}
              >
                <Ionicons name={timer.isRunning ? 'pause' : 'play'} size={20} color="#ffffff" />
                <Text style={styles.timerButtonText}>{timer.isRunning ? 'Pausar' : 'Retomar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleStopTimer}
                style={[styles.timerButton, { backgroundColor: colors.error }]}
              >
                <Ionicons name="stop" size={20} color="#ffffff" />
                <Text style={styles.timerButtonText}>Parar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Card>

      {/* Entries List */}
      {entries.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="Nenhum lancamento"
          message="Inicie o timer ou adicione um lancamento manual"
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, { color: colors.textSecondary, backgroundColor: colors.background }]}>
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <View
              style={[
                styles.entryCard,
                Shadows.sm,
                { backgroundColor: colors.card, borderColor: colors.borderLight },
              ]}
            >
              <View style={styles.entryRow}>
                <View style={styles.entryInfo}>
                  <Text style={[styles.entryDesc, { color: colors.text }]} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <View style={styles.entryMeta}>
                    {item.caseName && (
                      <Text style={[styles.entryMetaText, { color: colors.textTertiary }]} numberOfLines={1}>
                        {item.caseName}
                      </Text>
                    )}
                    {item.clientName && (
                      <Text style={[styles.entryMetaText, { color: colors.textTertiary }]} numberOfLines={1}>
                        {item.clientName}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.entryRight}>
                  <Text style={[styles.entryDuration, { color: colors.primary }]}>
                    {formatHoursMinutes(item.duration)}
                  </Text>
                  <View style={styles.entryIcons}>
                    {item.billable && (
                      <Ionicons name="cash-outline" size={14} color={colors.success} />
                    )}
                    <TouchableOpacity onPress={() => setDeleteEntryId(item.id)}>
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.entryTime, { color: colors.textTertiary }]}>
                    {formatTime(item.startTime)}
                    {item.endTime ? ` - ${formatTime(item.endTime)}` : ''}
                  </Text>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Case Picker Modal */}
      <Modal visible={showCasePicker} transparent animationType="fade" onRequestClose={() => setShowCasePicker(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowCasePicker(false)}>
          <Pressable style={[styles.modal, Shadows.lg, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Selecionar Processo</Text>
            <FlatList
              data={cases}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setTimerCaseId(item.id);
                    setTimerCaseName(`${item.caseNumber} - ${item.clientName}`);
                    setShowCasePicker(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }]}>{item.caseNumber}</Text>
                  <Text style={[styles.modalSubText, { color: colors.textSecondary }]}>{item.clientName}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={[styles.emptyListText, { color: colors.textTertiary }]}>Nenhum processo</Text>}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Client Picker Modal */}
      <Modal visible={showClientPicker} transparent animationType="fade" onRequestClose={() => setShowClientPicker(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowClientPicker(false)}>
          <Pressable style={[styles.modal, Shadows.lg, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Selecionar Cliente</Text>
            <FlatList
              data={clients}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setTimerClientId(item.id);
                    setTimerClientName(item.fullName);
                    setShowClientPicker(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }]}>{item.fullName}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={[styles.emptyListText, { color: colors.textTertiary }]}>Nenhum cliente</Text>}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmDialog
        visible={deleteEntryId !== null}
        title="Excluir Lancamento"
        message="Deseja excluir este lancamento de tempo?"
        onConfirm={handleDeleteEntry}
        onCancel={() => setDeleteEntryId(null)}
        destructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: { fontSize: Typography.xl, fontWeight: '700' },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.md },
  timerDisplay: { fontSize: 40, fontWeight: '300', textAlign: 'center', fontVariant: ['tabular-nums'] },
  timerInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sm,
    marginTop: Spacing.md,
  },
  timerSelectors: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  selectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  selectorText: { fontSize: Typography.xs, maxWidth: 100 },
  timerButtons: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginTop: Spacing.md },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  timerButtonText: { color: '#ffffff', fontSize: Typography.sm, fontWeight: '600' },
  sectionHeader: {
    fontSize: Typography.sm,
    fontWeight: '600',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    textTransform: 'capitalize',
  },
  entryCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.sm + 2,
  },
  entryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  entryInfo: { flex: 1, marginRight: Spacing.sm },
  entryDesc: { fontSize: Typography.sm, fontWeight: '500' },
  entryMeta: { marginTop: 2 },
  entryMetaText: { fontSize: 11 },
  entryRight: { alignItems: 'flex-end' },
  entryDuration: { fontSize: Typography.sm, fontWeight: '700' },
  entryIcons: { flexDirection: 'row', gap: Spacing.sm, marginTop: 2 },
  entryTime: { fontSize: 10, marginTop: 2 },
  listContent: { paddingBottom: Spacing.xxl },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modal: { width: '100%', borderRadius: BorderRadius.lg, padding: Spacing.md, maxHeight: 400 },
  modalTitle: { fontSize: Typography.lg, fontWeight: '700', marginBottom: Spacing.md },
  modalItem: { paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.sm },
  modalItemText: { fontSize: Typography.md },
  modalSubText: { fontSize: Typography.xs, marginTop: 2 },
  emptyListText: { fontSize: Typography.sm, textAlign: 'center', paddingVertical: Spacing.md },
});
