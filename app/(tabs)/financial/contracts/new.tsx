import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  StyleSheet,
  Pressable,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/store/ThemeContext';
import { useAuth } from '../../../../src/store/AuthContext';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../../src/constants/theme';
import { formatCurrency, parseCurrency } from '../../../../src/utils/currency';
import { createContract, createInstallment } from '../../../../src/services/firebase/financialService';
import { getClients } from '../../../../src/services/firebase/clientService';
import { getCasesByClient } from '../../../../src/services/firebase/caseService';
import KeyboardWrapper from '../../../../src/components/layout/KeyboardWrapper';
import Input from '../../../../src/components/ui/Input';
import Button from '../../../../src/components/ui/Button';
import DateTimePicker from '../../../../src/components/ui/DateTimePicker';
import type { ContractType, ContractFormData } from '../../../../src/types/financial';
import type { Client } from '../../../../src/types/client';
import type { LegalCase } from '../../../../src/types/case';

interface SelectorItem {
  id: string;
  label: string;
}

const CONTRACT_TYPES: { label: string; value: ContractType }[] = [
  { label: 'Fixo', value: 'fixed' },
  { label: 'Exito', value: 'success' },
  { label: 'Misto', value: 'mixed' },
  { label: 'Por Hora', value: 'hourly' },
];

export default function NewContractScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [caseId, setCaseId] = useState('');
  const [caseName, setCaseName] = useState('');
  const [contractType, setContractType] = useState<ContractType>('fixed');
  const [totalValue, setTotalValue] = useState('');
  const [successPercentage, setSuccessPercentage] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState('1');
  const [description, setDescription] = useState('');
  const [signedDate, setSignedDate] = useState(new Date());

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

  const selectClient = useCallback((client: Client) => {
    setClientId(client.id);
    setClientName(client.fullName);
    setCaseId('');
    setCaseName('');
    setClientModalVisible(false);
    setClientSearch('');
  }, []);

  const selectCase = useCallback((legalCase: LegalCase) => {
    setCaseId(legalCase.id);
    setCaseName(legalCase.caseNumber);
    setCaseModalVisible(false);
    setCaseSearch('');
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!clientId) newErrors.client = 'Selecione um cliente';
    if (!totalValue || parseCurrency(totalValue) <= 0) newErrors.totalValue = 'Informe o valor total';
    if ((contractType === 'success' || contractType === 'mixed') && !successPercentage) {
      newErrors.successPercentage = 'Informe o percentual de exito';
    }
    if (contractType === 'hourly' && (!hourlyRate || parseCurrency(hourlyRate) <= 0)) {
      newErrors.hourlyRate = 'Informe o valor da hora';
    }
    const count = parseInt(installmentsCount, 10);
    if (Number.isNaN(count) || count < 1) {
      newErrors.installmentsCount = 'Informe um numero valido de parcelas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [clientId, totalValue, contractType, successPercentage, hourlyRate, installmentsCount]);

  const handleSave = useCallback(async () => {
    if (!user || !validate()) return;

    setSaving(true);
    try {
      const parsedValue = parseCurrency(totalValue);
      const count = parseInt(installmentsCount, 10);

      const formData: ContractFormData = {
        clientId,
        clientName,
        caseId: caseId || undefined,
        caseName: caseName || undefined,
        type: contractType,
        totalValue: parsedValue,
        successPercentage:
          contractType === 'success' || contractType === 'mixed'
            ? parseFloat(successPercentage)
            : undefined,
        hourlyRate:
          contractType === 'hourly' ? parseCurrency(hourlyRate) : undefined,
        installmentsCount: count,
        description: description || undefined,
        signedDate,
      };

      const contractId = await createContract(user.uid, formData);

      const installmentValue = parsedValue / count;
      const baseDate = new Date(signedDate);

      for (let i = 0; i < count; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + i + 1);

        await createInstallment(user.uid, {
          contractId,
          owner_uid: user.uid,
          number: i + 1,
          value: Math.round(installmentValue * 100) / 100,
          dueDate,
          status: 'pending',
        });
      }

      Alert.alert('Sucesso', 'Contrato criado com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar contrato';
      Alert.alert('Erro', message);
    } finally {
      setSaving(false);
    }
  }, [
    user, validate, totalValue, installmentsCount, clientId, clientName,
    caseId, caseName, contractType, successPercentage, hourlyRate,
    description, signedDate, router,
  ]);

  const filteredClients = clients.filter((c) =>
    c.fullName.toLowerCase().includes(clientSearch.toLowerCase()),
  );

  const filteredCases = cases.filter((c) =>
    c.caseNumber.toLowerCase().includes(caseSearch.toLowerCase()),
  );

  const renderSelectorModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    items: SelectorItem[],
    onSelect: (item: SelectorItem) => void,
    searchValue: string,
    onSearchChange: (text: string) => void,
    isLoading: boolean,
  ) => (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar..."
            placeholderTextColor={colors.placeholder}
            value={searchValue}
            onChangeText={onSearchChange}
          />
        </View>

        {isLoading ? (
          <View style={styles.modalLoading}>
            <Text style={[styles.modalLoadingText, { color: colors.textSecondary }]}>
              Carregando...
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.selectorItem, { borderBottomColor: colors.borderLight }]}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.selectorItemText, { color: colors.text }]}>
                  {item.label}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.modalEmpty}>
                <Text style={[styles.modalEmptyText, { color: colors.textSecondary }]}>
                  Nenhum item encontrado
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );

  return (
    <KeyboardWrapper contentContainerStyle={styles.formContent}>
      <View style={styles.form}>
        <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Cliente *</Text>
        <TouchableOpacity
          style={[styles.selector, { borderColor: errors.client ? colors.error : colors.border, backgroundColor: colors.surface }]}
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
        {errors.client && (
          <Text style={[styles.errorText, { color: colors.error }]}>{errors.client}</Text>
        )}

        <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Processo (opcional)</Text>
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

        <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Tipo de Contrato *</Text>
        <View style={styles.typeGrid}>
          {CONTRACT_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[
                styles.typeChip,
                {
                  backgroundColor: contractType === t.value ? colors.primary : colors.surfaceVariant,
                  borderColor: contractType === t.value ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setContractType(t.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.typeChipText,
                  { color: contractType === t.value ? '#ffffff' : colors.textSecondary },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Valor Total *"
          value={totalValue}
          onChangeText={setTotalValue}
          maskType="currency"
          keyboardType="numeric"
          leftIcon="cash-outline"
          error={errors.totalValue}
        />

        {(contractType === 'success' || contractType === 'mixed') && (
          <Input
            label="Percentual de Exito (%) *"
            value={successPercentage}
            onChangeText={setSuccessPercentage}
            keyboardType="numeric"
            leftIcon="trending-up-outline"
            error={errors.successPercentage}
          />
        )}

        {contractType === 'hourly' && (
          <Input
            label="Valor por Hora *"
            value={hourlyRate}
            onChangeText={setHourlyRate}
            maskType="currency"
            keyboardType="numeric"
            leftIcon="time-outline"
            error={errors.hourlyRate}
          />
        )}

        <Input
          label="Numero de Parcelas *"
          value={installmentsCount}
          onChangeText={setInstallmentsCount}
          keyboardType="numeric"
          leftIcon="layers-outline"
          error={errors.installmentsCount}
        />

        <Input
          label="Descricao"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          leftIcon="document-text-outline"
        />

        <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Data de Assinatura</Text>
        <DateTimePicker
          value={signedDate}
          onChange={setSignedDate}
          mode="date"
          label="Data de Assinatura"
        />

        <View style={styles.buttonContainer}>
          <Button
            title="Salvar Contrato"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            size="lg"
            icon={<Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />}
          />
        </View>
      </View>

      {renderSelectorModal(
        clientModalVisible,
        () => { setClientModalVisible(false); setClientSearch(''); },
        'Selecione o Cliente',
        filteredClients.map((c) => ({ id: c.id, label: c.fullName })),
        (item) => {
          const client = clients.find((c) => c.id === item.id);
          if (client) selectClient(client);
        },
        clientSearch,
        setClientSearch,
        loadingClients,
      )}

      {renderSelectorModal(
        caseModalVisible,
        () => { setCaseModalVisible(false); setCaseSearch(''); },
        'Selecione o Processo',
        filteredCases.map((c) => ({ id: c.id, label: c.caseNumber })),
        (item) => {
          const legalCase = cases.find((c) => c.id === item.id);
          if (legalCase) selectCase(legalCase);
        },
        caseSearch,
        setCaseSearch,
        loadingCases,
      )}
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typeChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: Typography.sm,
    fontWeight: '500',
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
  selectorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  selectorItemText: {
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
