import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/store/ThemeContext';
import { useAuth } from '../../../../src/store/AuthContext';
import {
  TaskFormData,
  TaskPriority,
  ChecklistItem,
  TASK_PRIORITIES,
} from '../../../../src/types/task';
import { LegalCase } from '../../../../src/types/case';
import { Client } from '../../../../src/types/client';
import { createTask } from '../../../../src/services/firebase/taskService';
import { getCases } from '../../../../src/services/firebase/caseService';
import { getClients } from '../../../../src/services/firebase/clientService';
import KeyboardWrapper from '../../../../src/components/layout/KeyboardWrapper';
import Input from '../../../../src/components/ui/Input';
import Button from '../../../../src/components/ui/Button';
import DateTimePicker from '../../../../src/components/ui/DateTimePicker';
import { BorderRadius, Shadows, Spacing, Typography } from '../../../../src/constants/theme';

export default function NewTaskScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [caseId, setCaseId] = useState('');
  const [caseName, setCaseName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDueDate, setShowDueDate] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [cases, setCases] = useState<LegalCase[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showCasePicker, setShowCasePicker] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);

  useEffect(() => {
    if (!user) return;
    getCases(user.uid).then(setCases).catch(() => {});
    getClients(user.uid).then(setClients).catch(() => {});
  }, [user]);

  const handleAddChecklistItem = useCallback(() => {
    if (!newChecklistItem.trim()) return;
    const item: ChecklistItem = {
      id: Date.now().toString(),
      text: newChecklistItem.trim(),
      done: false,
    };
    setChecklist((prev) => [...prev, item]);
    setNewChecklistItem('');
  }, [newChecklistItem]);

  const handleRemoveChecklistItem = useCallback((itemId: string) => {
    setChecklist((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Titulo e obrigatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title]);

  const handleSave = useCallback(async () => {
    if (!validate() || !user) return;
    setSaving(true);
    try {
      const formData: TaskFormData = {
        title: title.trim(),
        priority,
      };
      if (description.trim()) formData.description = description.trim();
      if (caseId) {
        formData.caseId = caseId;
        formData.caseName = caseName;
      }
      if (clientId) {
        formData.clientId = clientId;
        formData.clientName = clientName;
      }
      if (dueDate) formData.dueDate = dueDate;
      if (checklist.length > 0) formData.checklist = checklist;
      if (estimatedHours) {
        const parsed = parseFloat(estimatedHours.replace(',', '.'));
        if (!Number.isNaN(parsed) && parsed > 0) {
          formData.estimatedHours = parsed;
        }
      }
      if (tagsText.trim()) {
        formData.tags = tagsText
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      }

      await createTask(user.uid, formData);
      Alert.alert('Sucesso', 'Tarefa criada com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar tarefa';
      Alert.alert('Erro', message);
    } finally {
      setSaving(false);
    }
  }, [validate, user, title, description, priority, caseId, caseName, clientId, clientName, dueDate, checklist, estimatedHours, tagsText, router]);

  const selectedPriorityInfo = TASK_PRIORITIES.find((p) => p.value === priority);

  return (
    <KeyboardWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Nova Tarefa</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <Input
            label="Titulo *"
            value={title}
            onChangeText={setTitle}
            error={errors.title}
            leftIcon="checkbox-outline"
          />

          <Input
            label="Descricao"
            value={description}
            onChangeText={setDescription}
            leftIcon="document-text-outline"
            multiline
            numberOfLines={3}
          />

          {/* Priority Picker */}
          <View style={styles.fieldMargin}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Prioridade</Text>
            <TouchableOpacity
              onPress={() => setShowPriorityPicker(true)}
              style={[styles.pickerButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <View style={[styles.priorityDot, { backgroundColor: selectedPriorityInfo?.color }]} />
              <Text style={[styles.pickerText, { color: colors.text }]}>
                {selectedPriorityInfo?.label}
              </Text>
              <Ionicons name="chevron-down-outline" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Case Selector */}
          <View style={styles.fieldMargin}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Processo (opcional)</Text>
            <TouchableOpacity
              onPress={() => setShowCasePicker(true)}
              style={[styles.pickerButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Ionicons name="briefcase-outline" size={20} color={colors.textSecondary} style={styles.pickerIcon} />
              <Text style={[styles.pickerText, { color: caseName ? colors.text : colors.placeholder }]}>
                {caseName || 'Selecionar processo'}
              </Text>
              {caseId ? (
                <TouchableOpacity onPress={() => { setCaseId(''); setCaseName(''); }}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-down-outline" size={16} color={colors.textTertiary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Client Selector */}
          <View style={styles.fieldMargin}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Cliente (opcional)</Text>
            <TouchableOpacity
              onPress={() => setShowClientPicker(true)}
              style={[styles.pickerButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.pickerIcon} />
              <Text style={[styles.pickerText, { color: clientName ? colors.text : colors.placeholder }]}>
                {clientName || 'Selecionar cliente'}
              </Text>
              {clientId ? (
                <TouchableOpacity onPress={() => { setClientId(''); setClientName(''); }}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-down-outline" size={16} color={colors.textTertiary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Due Date */}
          <View style={styles.fieldMargin}>
            <View style={styles.dueDateRow}>
              <TouchableOpacity
                onPress={() => setShowDueDate(!showDueDate)}
                style={styles.dueDateToggle}
              >
                <Ionicons
                  name={showDueDate ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 0, marginLeft: Spacing.sm }]}>
                  Definir prazo
                </Text>
              </TouchableOpacity>
            </View>
            {showDueDate && (
              <DateTimePicker
                value={dueDate ?? new Date()}
                onChange={(d) => setDueDate(d)}
                mode="datetime"
                label="Prazo"
              />
            )}
          </View>

          {/* Dynamic Checklist */}
          <View style={styles.fieldMargin}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Checklist</Text>
            {checklist.map((item) => (
              <View key={item.id} style={styles.checklistRow}>
                <Ionicons name="ellipse-outline" size={16} color={colors.textTertiary} />
                <Text style={[styles.checklistText, { color: colors.text }]}>{item.text}</Text>
                <TouchableOpacity onPress={() => handleRemoveChecklistItem(item.id)}>
                  <Ionicons name="close" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.addChecklistRow}>
              <TextInput
                value={newChecklistItem}
                onChangeText={setNewChecklistItem}
                placeholder="Novo item..."
                placeholderTextColor={colors.placeholder}
                style={[styles.checklistInput, { color: colors.text, borderColor: colors.border }]}
                onSubmitEditing={handleAddChecklistItem}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={handleAddChecklistItem}
                style={[styles.addChecklistButton, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="add" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          <Input
            label="Horas estimadas"
            value={estimatedHours}
            onChangeText={setEstimatedHours}
            leftIcon="time-outline"
            keyboardType="numeric"
          />

          <Input
            label="Tags (separadas por virgula)"
            value={tagsText}
            onChangeText={setTagsText}
            leftIcon="pricetag-outline"
          />

          <View style={styles.buttons}>
            <Button
              title="Cancelar"
              onPress={() => router.back()}
              variant="outline"
              size="lg"
              style={styles.flex1}
            />
            <Button
              title="Salvar"
              onPress={handleSave}
              variant="primary"
              size="lg"
              loading={saving}
              style={styles.flex1}
            />
          </View>
        </View>
      </View>

      {/* Priority Picker Modal */}
      <Modal visible={showPriorityPicker} transparent animationType="fade" onRequestClose={() => setShowPriorityPicker(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowPriorityPicker(false)}>
          <Pressable style={[styles.modal, Shadows.lg, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Prioridade</Text>
            {TASK_PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[styles.modalItem, priority === p.value && { backgroundColor: p.color + '20' }]}
                onPress={() => { setPriority(p.value); setShowPriorityPicker(false); }}
              >
                <View style={styles.modalItemRow}>
                  <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                  <Text style={[styles.modalItemText, { color: colors.text }]}>{p.label}</Text>
                </View>
                {priority === p.value && <Ionicons name="checkmark" size={20} color={p.color} />}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

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
                  onPress={() => { setCaseId(item.id); setCaseName(`${item.caseNumber} - ${item.clientName}`); setShowCasePicker(false); }}
                >
                  <View>
                    <Text style={[styles.modalItemText, { color: colors.text }]}>{item.caseNumber}</Text>
                    <Text style={[styles.modalSubText, { color: colors.textSecondary }]}>{item.clientName}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Nenhum processo encontrado</Text>
              }
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
                  onPress={() => { setClientId(item.id); setClientName(item.fullName); setShowClientPicker(false); }}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }]}>{item.fullName}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Nenhum cliente encontrado</Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  headerTitle: { fontSize: Typography.lg, fontWeight: '700' },
  form: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
  fieldMargin: { marginBottom: Spacing.md },
  fieldLabel: { fontSize: Typography.xs, marginBottom: Spacing.xs, marginLeft: Spacing.xs },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 56,
  },
  pickerIcon: { marginRight: Spacing.sm },
  pickerText: { flex: 1, fontSize: Typography.md },
  priorityDot: { width: 12, height: 12, borderRadius: 6, marginRight: Spacing.sm },
  dueDateRow: { marginBottom: Spacing.sm },
  dueDateToggle: { flexDirection: 'row', alignItems: 'center' },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm,
  },
  checklistText: { flex: 1, fontSize: Typography.sm },
  addChecklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  checklistInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sm,
  },
  addChecklistButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  flex1: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modal: { width: '100%', borderRadius: BorderRadius.lg, padding: Spacing.md, maxHeight: 400 },
  modalTitle: { fontSize: Typography.lg, fontWeight: '700', marginBottom: Spacing.md },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  modalItemRow: { flexDirection: 'row', alignItems: 'center' },
  modalItemText: { fontSize: Typography.md },
  modalSubText: { fontSize: Typography.xs, marginTop: 2 },
  emptyText: { fontSize: Typography.sm, textAlign: 'center', paddingVertical: Spacing.md },
});
