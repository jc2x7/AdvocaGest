import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../../src/store/ThemeContext';
import { useAuth } from '../../../../src/store/AuthContext';
import { Spacing, Typography, BorderRadius } from '../../../../src/constants/theme';
import { LEGAL_AREAS, CASE_TYPES } from '../../../../src/constants/legalAreas';
import { COURT_TYPES, JURISDICTIONS } from '../../../../src/constants/courts';
import KeyboardWrapper from '../../../../src/components/layout/KeyboardWrapper';
import Input from '../../../../src/components/ui/Input';
import Button from '../../../../src/components/ui/Button';
import LoadingState from '../../../../src/components/ui/LoadingState';
import ErrorState from '../../../../src/components/ui/ErrorState';
import { getCaseById, updateCase } from '../../../../src/services/firebase/caseService';
import { getClients } from '../../../../src/services/firebase/clientService';
import {
  LegalArea,
  CasePhase,
  CaseRole,
  CaseStatus,
  LegalCase,
} from '../../../../src/types/case';
import { formatCurrency, parseCurrency } from '../../../../src/utils/currency';

interface Client {
  id: string;
  name: string;
}

const CASE_ROLES: Array<{ value: CaseRole; label: string }> = [
  { value: 'author', label: 'Autor' },
  { value: 'defendant', label: 'Reu' },
  { value: 'third_party', label: 'Terceiro' },
  { value: 'assistant', label: 'Assistente' },
];

const CASE_PHASES: Array<{ value: CasePhase; label: string }> = [
  { value: 'conhecimento', label: 'Conhecimento' },
  { value: 'recursal', label: 'Recursal' },
  { value: 'execucao', label: 'Execucao' },
  { value: 'cumprimento_sentenca', label: 'Cumprimento de Sentenca' },
];

const CASE_STATUSES: Array<{ value: CaseStatus; label: string }> = [
  { value: 'active', label: 'Ativo' },
  { value: 'suspended', label: 'Suspenso' },
  { value: 'archived', label: 'Arquivado' },
  { value: 'closed', label: 'Encerrado' },
];

function applyCNJMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 20);
  let result = digits;
  if (digits.length > 7) {
    result = digits.slice(0, 7) + '-' + digits.slice(7);
  }
  if (digits.length > 9) {
    result = result.slice(0, 10) + '.' + digits.slice(9);
  }
  if (digits.length > 13) {
    result = result.slice(0, 15) + '.' + digits.slice(13);
  }
  if (digits.length > 14) {
    result = result.slice(0, 17) + '.' + digits.slice(14);
  }
  if (digits.length > 16) {
    result = result.slice(0, 20) + '.' + digits.slice(16);
  }
  return result;
}

interface FormErrors {
  [key: string]: string | undefined;
}

export default function EditCaseScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Form fields
  const [caseNumber, setCaseNumber] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [area, setArea] = useState<LegalArea | ''>('');
  const [caseType, setCaseType] = useState('');
  const [court, setCourt] = useState('');
  const [branch, setBranch] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [role, setRole] = useState<CaseRole>('author');
  const [opposingParty, setOpposingParty] = useState('');
  const [opposingLawyer, setOpposingLawyer] = useState('');
  const [judge, setJudge] = useState('');
  const [caseValue, setCaseValue] = useState('');
  const [phase, setPhase] = useState<CasePhase>('conhecimento');
  const [status, setStatus] = useState<CaseStatus>('active');
  const [description, setDescription] = useState('');
  const [strategy, setStrategy] = useState('');

  // Client picker
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user || !id) return;
    try {
      setFetchError(null);
      const data = await getCaseById(user.uid, id);
      if (!data) {
        setFetchError('Processo nao encontrado.');
        return;
      }
      setCaseNumber(data.caseNumber);
      setSelectedClient({ id: data.clientId, name: data.clientName });
      setArea(data.area);
      setCaseType(data.type);
      setCourt(data.court);
      setBranch(data.branch);
      setJurisdiction(data.jurisdiction);
      setRole(data.role);
      setOpposingParty(data.opposingParty);
      setOpposingLawyer(data.opposingLawyer ?? '');
      setJudge(data.judge ?? '');
      setCaseValue(data.caseValue !== undefined ? formatCurrency(data.caseValue) : '');
      setPhase(data.phase);
      setStatus(data.status);
      setDescription(data.description ?? '');
      setStrategy(data.strategy ?? '');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar processo.';
      setFetchError(message);
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

  const loadClients = useCallback(async () => {
    if (!user) return;
    setLoadingClients(true);
    try {
      const data = await getClients(user.uid);
      setClients(data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
    } catch {
      // Silently handle
    }
    setLoadingClients(false);
  }, [user]);

  const openClientPicker = useCallback(async () => {
    await loadClients();
    setShowClientPicker(true);
  }, [loadClients]);

  const handleCaseNumberChange = useCallback((text: string) => {
    setCaseNumber(applyCNJMask(text));
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (!caseNumber.trim()) newErrors.caseNumber = 'Numero do processo e obrigatorio.';
    if (!selectedClient) newErrors.client = 'Selecione um cliente.';
    if (!area) newErrors.area = 'Selecione a area.';
    if (!caseType) newErrors.caseType = 'Selecione o tipo.';
    if (!court.trim()) newErrors.court = 'Tribunal e obrigatorio.';
    if (!branch.trim()) newErrors.branch = 'Vara e obrigatoria.';
    if (!jurisdiction.trim()) newErrors.jurisdiction = 'Jurisdicao e obrigatoria.';
    if (!opposingParty.trim()) newErrors.opposingParty = 'Parte contraria e obrigatoria.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [caseNumber, selectedClient, area, caseType, court, branch, jurisdiction, opposingParty]);

  const handleSubmit = useCallback(async () => {
    if (!validate() || !user || !id || !selectedClient || !area) return;
    setSubmitting(true);
    try {
      const parsedValue = caseValue ? parseCurrency(caseValue) : undefined;
      const updateData: Partial<LegalCase> = {
        caseNumber: caseNumber.trim(),
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        area,
        type: caseType,
        court: court.trim(),
        branch: branch.trim(),
        jurisdiction: jurisdiction.trim(),
        role,
        judge: judge.trim() || undefined,
        opposingParty: opposingParty.trim(),
        opposingLawyer: opposingLawyer.trim() || undefined,
        caseValue: parsedValue,
        phase,
        status,
        description: description.trim() || undefined,
        strategy: strategy.trim() || undefined,
      };
      await updateCase(user.uid, id, updateData);
      Alert.alert('Sucesso', 'Processo atualizado com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar processo.';
      Alert.alert('Erro', message);
    }
    setSubmitting(false);
  }, [validate, user, id, selectedClient, area, caseNumber, caseType, court, branch, jurisdiction, role, judge, opposingParty, opposingLawyer, caseValue, phase, status, description, strategy, router]);

  const availableCaseTypes = area ? (CASE_TYPES[area] ?? []) : [];

  if (loading) {
    return <LoadingState message="Carregando processo..." />;
  }

  if (fetchError) {
    return <ErrorState message={fetchError} onRetry={fetchData} />;
  }

  return (
    <KeyboardWrapper contentContainerStyle={styles.scrollContent}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Status */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Status</Text>
        <View style={styles.optionsGrid}>
          {CASE_STATUSES.map((s) => {
            const isSelected = status === s.value;
            return (
              <TouchableOpacity
                key={s.value}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setStatus(s.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionChipText, { color: isSelected ? '#ffffff' : colors.textSecondary }]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Basic Data */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Dados Basicos</Text>

        <Input
          label="Numero do Processo (CNJ) *"
          value={caseNumber}
          onChangeText={handleCaseNumberChange}
          error={errors.caseNumber}
          leftIcon="document-text-outline"
          keyboardType="numeric"
        />

        <Text style={[styles.fieldLabel, { color: colors.text }]}>Cliente *</Text>
        {errors.client && <Text style={[styles.errorText, { color: colors.error }]}>{errors.client}</Text>}
        <TouchableOpacity
          style={[styles.pickerButton, { backgroundColor: colors.surfaceVariant, borderColor: errors.client ? colors.error : colors.border }]}
          onPress={openClientPicker}
          activeOpacity={0.7}
        >
          <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
          <Text
            style={[styles.pickerButtonText, { color: selectedClient ? colors.text : colors.placeholder }]}
            numberOfLines={1}
          >
            {selectedClient ? selectedClient.name : 'Selecionar cliente'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>

        <Text style={[styles.fieldLabel, { color: colors.text }]}>Area do Direito *</Text>
        {errors.area && <Text style={[styles.errorText, { color: colors.error }]}>{errors.area}</Text>}
        <View style={styles.optionsGrid}>
          {LEGAL_AREAS.map((la) => {
            const isSelected = area === la.value;
            return (
              <TouchableOpacity
                key={la.value}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  setArea(la.value);
                  setCaseType('');
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionChipText, { color: isSelected ? '#ffffff' : colors.textSecondary }]}>
                  {la.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {area && availableCaseTypes.length > 0 && (
          <>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Tipo de Acao *</Text>
            {errors.caseType && <Text style={[styles.errorText, { color: colors.error }]}>{errors.caseType}</Text>}
            <View style={styles.optionsGrid}>
              {availableCaseTypes.map((t) => {
                const isSelected = caseType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setCaseType(t)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionChipText, { color: isSelected ? '#ffffff' : colors.textSecondary }]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Court */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tribunal e Vara</Text>

        <Text style={[styles.fieldLabel, { color: colors.text }]}>Tribunal *</Text>
        {errors.court && <Text style={[styles.errorText, { color: colors.error }]}>{errors.court}</Text>}
        <View style={styles.optionsGrid}>
          {COURT_TYPES.map((ct) => {
            const isSelected = court === ct;
            return (
              <TouchableOpacity
                key={ct}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setCourt(ct)}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionChipText, { color: isSelected ? '#ffffff' : colors.textSecondary }]}>
                  {ct}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          label="Vara/Camara *"
          value={branch}
          onChangeText={setBranch}
          error={errors.branch}
          leftIcon="business-outline"
        />

        <Text style={[styles.fieldLabel, { color: colors.text }]}>Jurisdicao *</Text>
        {errors.jurisdiction && <Text style={[styles.errorText, { color: colors.error }]}>{errors.jurisdiction}</Text>}
        <View style={styles.optionsGrid}>
          {JURISDICTIONS.map((j) => {
            const isSelected = jurisdiction === j;
            return (
              <TouchableOpacity
                key={j}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setJurisdiction(j)}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionChipText, { color: isSelected ? '#ffffff' : colors.textSecondary }]}>
                  {j}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Parties */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Partes</Text>

        <Text style={[styles.fieldLabel, { color: colors.text }]}>Polo</Text>
        <View style={styles.optionsGrid}>
          {CASE_ROLES.map((r) => {
            const isSelected = role === r.value;
            return (
              <TouchableOpacity
                key={r.value}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setRole(r.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionChipText, { color: isSelected ? '#ffffff' : colors.textSecondary }]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          label="Parte Contraria *"
          value={opposingParty}
          onChangeText={setOpposingParty}
          error={errors.opposingParty}
          leftIcon="people-outline"
        />

        <Input
          label="Advogado Contrario"
          value={opposingLawyer}
          onChangeText={setOpposingLawyer}
          leftIcon="person-outline"
        />

        <Input
          label="Juiz"
          value={judge}
          onChangeText={setJudge}
          leftIcon="person-circle-outline"
        />

        {/* Values / Phase */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Valores e Fase</Text>

        <Input
          label="Valor da Causa"
          value={caseValue}
          onChangeText={setCaseValue}
          leftIcon="cash-outline"
          maskType="currency"
          keyboardType="numeric"
        />

        <Text style={[styles.fieldLabel, { color: colors.text }]}>Fase Processual</Text>
        <View style={styles.optionsGrid}>
          {CASE_PHASES.map((p) => {
            const isSelected = phase === p.value;
            return (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setPhase(p.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionChipText, { color: isSelected ? '#ffffff' : colors.textSecondary }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          label="Descricao"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <Input
          label="Estrategia"
          value={strategy}
          onChangeText={setStrategy}
          multiline
          numberOfLines={3}
        />

        {/* Submit */}
        <View style={styles.submitContainer}>
          <Button title="Salvar Alteracoes" onPress={handleSubmit} loading={submitting} size="lg" />
        </View>

        {/* Client Picker Modal */}
        <Modal visible={showClientPicker} animationType="slide" presentationStyle="pageSheet">
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Selecionar Cliente</Text>
              <TouchableOpacity onPress={() => setShowClientPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={clients}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: colors.borderLight }]}
                  onPress={() => {
                    setSelectedClient(item);
                    setShowClientPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.modalItemText, { color: colors.text }]}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.modalEmpty}>
                  <Text style={{ color: colors.textSecondary }}>
                    {loadingClients ? 'Carregando...' : 'Nenhum cliente encontrado.'}
                  </Text>
                </View>
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
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.fontWeight.bold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: Typography.xs,
    marginBottom: Spacing.xs,
    color: '#ef4444',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  optionChip: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  optionChipText: {
    fontSize: Typography.xs,
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
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
});
