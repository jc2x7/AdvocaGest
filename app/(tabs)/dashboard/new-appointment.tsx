import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../../src/store/ThemeContext';
import { useAuth } from '../../../src/store/AuthContext';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../src/constants/theme';
import KeyboardWrapper from '../../../src/components/layout/KeyboardWrapper';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import { createAppointment } from '../../../src/services/firebase/appointmentService';
import { getCases } from '../../../src/services/firebase/caseService';
import {
  AppointmentType,
  AppointmentFormData,
  RecurrenceType,
} from '../../../src/types/appointment';
import { LegalCase } from '../../../src/types/case';
import { formatDate, formatTime } from '../../../src/utils/dateUtils';

const APPOINTMENT_TYPES: Array<{ value: AppointmentType; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { value: 'hearing', label: 'Audiencia', icon: 'hammer-outline' },
  { value: 'deadline', label: 'Prazo', icon: 'alert-circle-outline' },
  { value: 'meeting', label: 'Reuniao', icon: 'people-outline' },
  { value: 'diligence', label: 'Diligencia', icon: 'document-text-outline' },
  { value: 'reminder', label: 'Lembrete', icon: 'notifications-outline' },
  { value: 'personal', label: 'Pessoal', icon: 'person-outline' },
];

const REMINDER_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 5, label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hora' },
  { value: 1440, label: '1 dia' },
  { value: 2880, label: '2 dias' },
];

const RECURRENCE_OPTIONS: Array<{ value: RecurrenceType; label: string }> = [
  { value: 'none', label: 'Sem recorrencia' },
  { value: 'daily', label: 'Diariamente' },
  { value: 'weekly', label: 'Semanalmente' },
  { value: 'monthly', label: 'Mensalmente' },
];

interface FormErrors {
  title?: string;
  type?: string;
  date?: string;
}

export default function NewAppointmentScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<AppointmentType | ''>('');
  const [date, setDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [clientName, setClientName] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState<number[]>([30]);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Case picker modal
  const [showCasePicker, setShowCasePicker] = useState(false);
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);

  const loadCases = useCallback(async () => {
    if (!user) return;
    setLoadingCases(true);
    try {
      const data = await getCases(user.uid);
      setCases(data);
    } catch {
      // Silently handle
    }
    setLoadingCases(false);
  }, [user]);

  const openCasePicker = useCallback(async () => {
    await loadCases();
    setShowCasePicker(true);
  }, [loadCases]);

  const selectCase = useCallback((legalCase: LegalCase) => {
    setSelectedCase(legalCase);
    setClientName(legalCase.clientName);
    setShowCasePicker(false);
  }, []);

  const toggleReminder = useCallback((minutes: number) => {
    setReminderMinutes((prev) =>
      prev.includes(minutes) ? prev.filter((m) => m !== minutes) : [...prev, minutes],
    );
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (!title.trim()) newErrors.title = 'Titulo e obrigatorio.';
    if (!type) newErrors.type = 'Selecione o tipo.';
    if (!date) newErrors.date = 'Data e obrigatoria.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, type, date]);

  const handleSubmit = useCallback(async () => {
    if (!validate() || !user || !type) return;
    setSubmitting(true);
    try {
      const formData: AppointmentFormData = {
        title: title.trim(),
        type,
        date,
        endDate,
        allDay,
        location: location.trim() || undefined,
        caseId: selectedCase?.id,
        caseName: selectedCase ? `${selectedCase.caseNumber}` : undefined,
        clientId: selectedCase?.clientId,
        clientName: clientName.trim() || undefined,
        reminderMinutes,
        recurrence,
      };
      await createAppointment(user.uid, formData);
      Alert.alert('Sucesso', 'Compromisso criado com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar compromisso.';
      Alert.alert('Erro', message);
    }
    setSubmitting(false);
  }, [validate, user, type, title, date, endDate, allDay, location, selectedCase, clientName, reminderMinutes, recurrence, router]);

  const handleDateChange = useCallback((_event: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) setDate(selected);
  }, []);

  const handleTimeChange = useCallback((_event: DateTimePickerEvent, selected?: Date) => {
    setShowTimePicker(false);
    if (selected) {
      const newDate = new Date(date);
      newDate.setHours(selected.getHours(), selected.getMinutes());
      setDate(newDate);
    }
  }, [date]);

  const handleEndDateChange = useCallback((_event: DateTimePickerEvent, selected?: Date) => {
    setShowEndDatePicker(false);
    if (selected) setEndDate(selected);
  }, []);

  const handleEndTimeChange = useCallback((_event: DateTimePickerEvent, selected?: Date) => {
    setShowEndTimePicker(false);
    if (selected && endDate) {
      const newEnd = new Date(endDate);
      newEnd.setHours(selected.getHours(), selected.getMinutes());
      setEndDate(newEnd);
    }
  }, [endDate]);

  return (
    <KeyboardWrapper contentContainerStyle={styles.scrollContent}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Title */}
        <Input
          label="Titulo *"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
          leftIcon="text-outline"
        />

        {/* Type */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Tipo *</Text>
        {errors.type && <Text style={[styles.errorText, { color: colors.error }]}>{errors.type}</Text>}
        <View style={styles.typeGrid}>
          {APPOINTMENT_TYPES.map((item) => {
            const isSelected = type === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setType(item.value)}
                activeOpacity={0.7}
              >
                <Ionicons name={item.icon} size={16} color={isSelected ? '#ffffff' : colors.textSecondary} />
                <Text style={[styles.typeChipText, { color: isSelected ? '#ffffff' : colors.textSecondary }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* All Day */}
        <View style={[styles.switchRow, { borderColor: colors.border }]}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>Dia inteiro</Text>
          <Switch
            value={allDay}
            onValueChange={setAllDay}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={allDay ? colors.primary : colors.surfaceVariant}
          />
        </View>

        {/* Date/Time */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Data e Hora *</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.dateButtonText, { color: colors.text }]}>{formatDate(date)}</Text>
          </TouchableOpacity>
          {!allDay && (
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.dateButtonText, { color: colors.text }]}>{formatTime(date)}</Text>
            </TouchableOpacity>
          )}
        </View>
        {errors.date && <Text style={[styles.errorText, { color: colors.error }]}>{errors.date}</Text>}

        {/* End Date/Time */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Data/Hora Final (opcional)</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
            onPress={() => {
              if (!endDate) setEndDate(new Date(date.getTime() + 60 * 60 * 1000));
              setShowEndDatePicker(true);
            }}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.dateButtonText, { color: colors.text }]}>
              {endDate ? formatDate(endDate) : 'Selecionar'}
            </Text>
          </TouchableOpacity>
          {!allDay && endDate && (
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.dateButtonText, { color: colors.text }]}>{formatTime(endDate)}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Location */}
        <Input
          label="Local"
          value={location}
          onChangeText={setLocation}
          leftIcon="location-outline"
        />

        {/* Link Case */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Vincular Processo</Text>
        <TouchableOpacity
          style={[styles.pickerButton, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
          onPress={openCasePicker}
          activeOpacity={0.7}
        >
          <Ionicons name="briefcase-outline" size={18} color={colors.textSecondary} />
          <Text
            style={[styles.pickerButtonText, { color: selectedCase ? colors.text : colors.placeholder }]}
            numberOfLines={1}
          >
            {selectedCase ? `${selectedCase.caseNumber} - ${selectedCase.clientName}` : 'Selecionar processo'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>

        {/* Client */}
        <Input
          label="Cliente"
          value={clientName}
          onChangeText={setClientName}
          leftIcon="person-outline"
        />

        {/* Reminders */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Lembretes</Text>
        <View style={styles.remindersGrid}>
          {REMINDER_OPTIONS.map((opt) => {
            const isSelected = reminderMinutes.includes(opt.value);
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.reminderChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => toggleReminder(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.reminderChipText, { color: isSelected ? '#ffffff' : colors.textSecondary }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recurrence */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Recorrencia</Text>
        <View style={styles.recurrenceRow}>
          {RECURRENCE_OPTIONS.map((opt) => {
            const isSelected = recurrence === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.recurrenceChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setRecurrence(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.recurrenceChipText, { color: isSelected ? '#ffffff' : colors.textSecondary }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Submit */}
        <View style={styles.submitContainer}>
          <Button title="Salvar Compromisso" onPress={handleSubmit} loading={submitting} size="lg" />
        </View>

        {/* Date Pickers */}
        {showDatePicker && (
          <DateTimePicker value={date} mode="date" display="default" onChange={handleDateChange} />
        )}
        {showTimePicker && (
          <DateTimePicker value={date} mode="time" display="default" onChange={handleTimeChange} />
        )}
        {showEndDatePicker && (
          <DateTimePicker value={endDate ?? date} mode="date" display="default" onChange={handleEndDateChange} />
        )}
        {showEndTimePicker && endDate && (
          <DateTimePicker value={endDate} mode="time" display="default" onChange={handleEndTimeChange} />
        )}

        {/* Case Picker Modal */}
        <Modal visible={showCasePicker} animationType="slide" presentationStyle="pageSheet">
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Selecionar Processo</Text>
              <TouchableOpacity onPress={() => setShowCasePicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={cases}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.caseItem, { borderBottomColor: colors.borderLight }]}
                  onPress={() => selectCase(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.caseItemNumber, { color: colors.text }]}>{item.caseNumber}</Text>
                  <Text style={[styles.caseItemClient, { color: colors.textSecondary }]}>
                    {item.clientName}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                loadingCases ? (
                  <View style={styles.modalEmpty}>
                    <Text style={{ color: colors.textSecondary }}>Carregando...</Text>
                  </View>
                ) : (
                  <View style={styles.modalEmpty}>
                    <Text style={{ color: colors.textSecondary }}>Nenhum processo encontrado.</Text>
                  </View>
                )
              }
            />
          </View>
        </Modal>
      </View>
    </KeyboardWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  sectionLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: Typography.xs,
    marginBottom: Spacing.xs,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  typeChipText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
    borderBottomWidth: 1,
  },
  switchLabel: {
    fontSize: Typography.md,
    fontWeight: Typography.fontWeight.medium,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: Typography.sm,
  },
  remindersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  reminderChip: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  reminderChipText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  recurrenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  recurrenceChip: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  recurrenceChipText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  submitContainer: {
    marginTop: Spacing.xl,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  modalList: {
    padding: Spacing.md,
  },
  caseItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  caseItemNumber: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  caseItemClient: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
});
