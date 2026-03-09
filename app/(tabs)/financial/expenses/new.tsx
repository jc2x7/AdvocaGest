import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  Switch,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/store/ThemeContext';
import { useAuth } from '../../../../src/store/AuthContext';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../../src/constants/theme';
import { parseCurrency } from '../../../../src/utils/currency';
import { createFinancialEntry } from '../../../../src/services/firebase/financialService';
import { getClients } from '../../../../src/services/firebase/clientService';
import { getCasesByClient } from '../../../../src/services/firebase/caseService';
import KeyboardWrapper from '../../../../src/components/layout/KeyboardWrapper';
import Input from '../../../../src/components/ui/Input';
import Button from '../../../../src/components/ui/Button';
import DateTimePicker from '../../../../src/components/ui/DateTimePicker';
import type { PaymentMethod, RecurrenceFrequency } from '../../../../src/types/financial';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../../../src/types/financial';
import type { Client } from '../../../../src/types/client';
import type { LegalCase } from '../../../../src/types/case';

const FREQUENCY_OPTIONS: { label: string; value: RecurrenceFrequency }[] = [
  { label: 'Mensal', value: 'monthly' },
  { label: 'Anual', value: 'annual' },
];

export default function NewExpenseScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [caseId, setCaseId] = useState('');
  const [caseName, setCaseName] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>('monthly');

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [caseModalVisible, setCaseModalVisible] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [caseSearch, setCaseSearch] = useState('');
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingCases, setLoadingCases] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const openClientModal = useCallback(async () => {
    if (!user) return;
    setLoadingClients(true);
    setClientModalVisible(true);
    try {
      const data = await getClients(user.uid);
      setClients(data);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel carregar os clientes.');
    } finally {
      setLoadingClients(false);
    }
  }, [user]);

  const openCaseModal = useCallback(async () => {
    if (!user || !clientId) {
      Alert.alert('Atencao', 'Selecione um cliente primeiro.');
      return;
    }
    setLoadingCases(true);
    setCaseModalVisible(true);
    try {
      const data = await getCasesByClient(user.uid, clientId);
      setCases(data);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel carregar os processos.');
    } finally {
      setLoadingCases(false);
    }
  }, [user, clientId]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!category) newErrors.category = 'Selecione uma categoria';
    if (!description.trim()) newErrors.description = 'Informe uma descricao';
    if (!value || parseCurrency(value) <= 0) newErrors.value = 'Informe o valor';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [category, description, value]);

  const handleSave = useCallback(async () => {
    if (!user || !validate()) return;

    setSaving(true);
    try {
      await createFinancialEntry(user.uid, {
        type: 'expense',
        category,
        description: description.trim(),
        value: parseCurrency(value),
        date,
        clientId: clientId || undefined,
        clientName: clientName || undefined,
        caseId: caseId || undefined,
        caseName: caseName || undefined,
        paymentMethod,
        isRecurring,
        recurrenceFrequency: isRecurring ? recurrenceFrequency : undefined,
      });

      Alert.alert('Sucesso', 'Despesa registrada com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar despesa';
      Alert.alert('Erro', message);
    } finally {
      setSaving(false);
    }
  }, [
    user, validate, category, description, value, date,
    clientId, clientName, caseId, caseName, paymentMethod,
    isRecurring, recurrenceFrequency, router,
  ]);

  const filteredClients = clients.filter((c) =>
    c.fullName.toLowerCase().includes(clientSearch.toLowerCase()),
  );

  const filteredCases = cases.filter((c) =>
    c.caseNumber.toLowerCase().includes(caseSearch.toLowerCase()),
  );

  return (
    <KeyboardWrapper contentContainerStyle={styles.formContent}>
      <View style={styles.form}>
        <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Categoria *</Text>
        <TouchableOpacity
          style={[
            styles.selector,
            {
              borderColor: errors.category ? colors.error : colors.border,
              backgroundColor: colors.surface,
            },
          ]}
          onPress={() => setCategoryModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="pricetag-outline" size={20} color={colors.textSecondary} />
          <Text
            style={[
              styles.selectorText,
              { color: category ? colors.text : colors.placeholder },
            ]}
          >
            {category || 'Selecione uma categoria'}
          </Text>
          <Ionicons name="chevron-down-outline" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
        {errors.category && (
          <Text style={[styles.errorText, { color: colors.error }]}>{errors.category}</Text>
        )}

        <Input
          label="Descricao *"
          value={description}
          onChangeText={setDescription}
          leftIcon="document-text-outline"
          error={errors.description}
        />

        <Input
          label="Valor *"
          value={value}
          onChangeText={setValue}
          maskType="currency"
          keyboardType="numeric"
          leftIcon="cash-outline"
          error={errors.value}
        />

        <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Data</Text>
        <DateTimePicker value={date} onChange={setDate} mode="date" label="Data da Despesa" />

        <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: Spacing.md }]}>
          Metodo de Pagamento
        </Text>
        <View style={styles.paymentGrid}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.value}
              style={[
                styles.methodChip,
                {
                  backgroundColor: paymentMethod === method.value ? colors.primary : colors.surfaceVariant,
                  borderColor: paymentMethod === method.value ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setPaymentMethod(method.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.methodChipText,
                  { color: paymentMethod === method.value ? '#ffffff' : colors.textSecondary },
                ]}
              >
                {method.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
          Vincular a Cliente (opcional)
        </Text>
        <TouchableOpacity
          style={[styles.selector, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={openClientModal}
          activeOpacity={0.7}
        >
          <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
          <Text
            style={[
              styles.selectorText,
              { color: clientName ? colors.text : colors.placeholder },
            ]}
            numberOfLines={1}
          >
            {clientName || 'Selecione um cliente'}
          </Text>
          <Ionicons name="chevron-down-outline" size={16} color={colors.textTertiary} />
        </TouchableOpacity>

        {clientId ? (
          <>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
              Vincular a Processo (opcional)
            </Text>
            <TouchableOpacity
              style={[styles.selector, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={openCaseModal}
              activeOpacity={0.7}
            >
              <Ionicons name="briefcase-outline" size={20} color={colors.textSecondary} />
              <Text
                style={[
                  styles.selectorText,
                  { color: caseName ? colors.text : colors.placeholder },
                ]}
                numberOfLines={1}
              >
                {caseName || 'Selecione um processo'}
              </Text>
              <Ionicons name="chevron-down-outline" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </>
        ) : null}

        <View style={[styles.recurringRow, { borderTopColor: colors.border }]}>
          <View style={styles.recurringInfo}>
            <Text style={[styles.recurringLabel, { color: colors.text }]}>Despesa Recorrente</Text>
            <Text style={[styles.recurringHint, { color: colors.textSecondary }]}>
              Sera registrada automaticamente
            </Text>
          </View>
          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={isRecurring ? colors.primary : colors.surfaceVariant}
          />
        </View>

        {isRecurring && (
          <View style={styles.frequencyGrid}>
            {FREQUENCY_OPTIONS.map((freq) => (
              <TouchableOpacity
                key={freq.value}
                style={[
                  styles.methodChip,
                  {
                    backgroundColor: recurrenceFrequency === freq.value ? colors.primary : colors.surfaceVariant,
                    borderColor: recurrenceFrequency === freq.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setRecurrenceFrequency(freq.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.methodChipText,
                    { color: recurrenceFrequency === freq.value ? '#ffffff' : colors.textSecondary },
                  ]}
                >
                  {freq.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title="Registrar Despesa"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            size="lg"
            icon={<Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />}
          />
        </View>
      </View>

      {/* Category Modal */}
      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Selecione a Categoria</Text>
            <TouchableOpacity
              onPress={() => setCategoryModalVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={[...EXPENSE_CATEGORIES]}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryItem,
                  { borderBottomColor: colors.borderLight },
                  category === item && { backgroundColor: colors.surfaceVariant },
                ]}
                onPress={() => {
                  setCategory(item);
                  setCategoryModalVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryItemText, { color: colors.text }]}>{item}</Text>
                {category === item && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Client Modal */}
      <Modal
        visible={clientModalVisible}
        animationType="slide"
        onRequestClose={() => { setClientModalVisible(false); setClientSearch(''); }}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Selecione o Cliente</Text>
            <TouchableOpacity
              onPress={() => { setClientModalVisible(false); setClientSearch(''); }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
            <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar..."
              placeholderTextColor={colors.placeholder}
              value={clientSearch}
              onChangeText={setClientSearch}
            />
          </View>
          {loadingClients ? (
            <View style={styles.modalLoading}>
              <Text style={[styles.modalLoadingText, { color: colors.textSecondary }]}>
                Carregando...
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredClients}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.categoryItem, { borderBottomColor: colors.borderLight }]}
                  onPress={() => {
                    setClientId(item.id);
                    setClientName(item.fullName);
                    setCaseId('');
                    setCaseName('');
                    setClientModalVisible(false);
                    setClientSearch('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryItemText, { color: colors.text }]}>
                    {item.fullName}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.modalEmpty}>
                  <Text style={[styles.modalEmptyText, { color: colors.textSecondary }]}>
                    Nenhum cliente encontrado
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>

      {/* Case Modal */}
      <Modal
        visible={caseModalVisible}
        animationType="slide"
        onRequestClose={() => { setCaseModalVisible(false); setCaseSearch(''); }}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Selecione o Processo</Text>
            <TouchableOpacity
              onPress={() => { setCaseModalVisible(false); setCaseSearch(''); }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
            <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar..."
              placeholderTextColor={colors.placeholder}
              value={caseSearch}
              onChangeText={setCaseSearch}
            />
          </View>
          {loadingCases ? (
            <View style={styles.modalLoading}>
              <Text style={[styles.modalLoadingText, { color: colors.textSecondary }]}>
                Carregando...
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredCases}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.categoryItem, { borderBottomColor: colors.borderLight }]}
                  onPress={() => {
                    setCaseId(item.id);
                    setCaseName(item.caseNumber);
                    setCaseModalVisible(false);
                    setCaseSearch('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryItemText, { color: colors.text }]}>
                    {item.caseNumber}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.modalEmpty}>
                  <Text style={[styles.modalEmptyText, { color: colors.textSecondary }]}>
                    Nenhum processo encontrado
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>
    </KeyboardWrapper>
  );
}

const styles = StyleSheet.create({
  formContent: {
    paddingBottom: Spacing.xxl,
  },
  form: {
    padding: Spacing.md,
  },
  formLabel: {
    fontSize: Typography.sm,
    fontWeight: '500',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    minHeight: 56,
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  selectorText: {
    flex: 1,
    fontSize: Typography.md,
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  methodChip: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  methodChipText: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  recurringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
  },
  recurringInfo: {
    flex: 1,
  },
  recurringLabel: {
    fontSize: Typography.md,
    fontWeight: '500',
  },
  recurringHint: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  frequencyGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  buttonContainer: {
    marginTop: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
    marginBottom: Spacing.xs,
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
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.md,
    paddingVertical: Spacing.xs,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  categoryItemText: {
    fontSize: Typography.md,
    flex: 1,
  },
  modalLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoadingText: {
    fontSize: Typography.sm,
  },
  modalEmpty: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: Typography.sm,
  },
});
