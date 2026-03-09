import React, { useState, useCallback, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/store/ThemeContext';
import { useAuth } from '../../../src/store/AuthContext';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../src/constants/theme';
import { LEGAL_AREAS, CASE_TYPES } from '../../../src/constants/legalAreas';
import { COURT_TYPES, JURISDICTIONS } from '../../../src/constants/courts';
import KeyboardWrapper from '../../../src/components/layout/KeyboardWrapper';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import { createCase } from '../../../src/services/firebase/caseService';
import { getClients } from '../../../src/services/firebase/clientService';
import {
  LegalArea,
  CasePhase,
  CaseRole,
  CaseFormData,
} from '../../../src/types/case';

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

const TOTAL_STEPS = 4;

function applyCNJMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 20);
  // Format: NNNNNNN-DD.AAAA.J.TT.OOOO
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

interface StepErrors {
  [key: string]: string | undefined;
}

export default function NewCaseScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<StepErrors>({});

  // Step 1: Basic data
  const [caseNumber, setCaseNumber] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [area, setArea] = useState<LegalArea | ''>('');
  const [caseType, setCaseType] = useState('');

  // Step 2: Court
  const [court, setCourt] = useState('');
  const [branch, setBranch] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');

  // Step 3: Parties
  const [role, setRole] = useState<CaseRole>('author');
  const [opposingParty, setOpposingParty] = useState('');
  const [opposingLawyer, setOpposingLawyer] = useState('');
  const [judge, setJudge] = useState('');

  // Step 4: Values/Phase
  const [caseValue, setCaseValue] = useState('');
  const [phase, setPhase] = useState<CasePhase>('conhecimento');
  const [description, setDescription] = useState('');
  const [strategy, setStrategy] = useState('');

  // Client picker
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  const loadClients = useCallback(async () => {
    if (!user) return;
    setLoadingClients(true);
    try {
      const data = await getClients(user.uid);
      setClients(
        data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })),
      );
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

  const validateStep = useCallback((): boolean => {
    const newErrors: StepErrors = {};
    switch (currentStep) {
      case 0:
        if (!caseNumber.trim()) newErrors.caseNumber = 'Numero do processo e obrigatorio.';
        if (!selectedClient) newErrors.client = 'Selecione um cliente.';
        if (!area) newErrors.area = 'Selecione a area.';
        if (!caseType) newErrors.caseType = 'Selecione o tipo.';
        break;
      case 1:
        if (!court.trim()) newErrors.court = 'Tribunal e obrigatorio.';
        if (!branch.trim()) newErrors.branch = 'Vara e obrigatoria.';
        if (!jurisdiction.trim()) newErrors.jurisdiction = 'Jurisdicao e obrigatoria.';
        break;
      case 2:
        if (!opposingParty.trim()) newErrors.opposingParty = 'Parte contraria e obrigatoria.';
        break;
      case 3:
        // No required fields in step 4
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, caseNumber, selectedClient, area, caseType, court, branch, jurisdiction, opposingParty]);

  const goNext = useCallback(() => {
    if (!validateStep()) return;
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [validateStep, currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setErrors({});
    }
  }, [currentStep]);

  const parseCurrencyValue = useCallback((text: string): number | undefined => {
    if (!text) return undefined;
    const digits = text.replace(/\D/g, '');
    if (!digits) return undefined;
    return parseInt(digits, 10) / 100;
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateStep() || !user || !selectedClient || !area) return;
    setSubmitting(true);
    try {
      const formData: CaseFormData = {
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
        caseValue: parseCurrencyValue(caseValue),
        phase,
        description: description.trim() || undefined,
        strategy: strategy.trim() || undefined,
      };
      await createCase(user.uid, formData);
      Alert.alert('Sucesso', 'Processo criado com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar processo.';
      Alert.alert('Erro', message);
    }
    setSubmitting(false);
  }, [validateStep, user, selectedClient, area, caseNumber, caseType, court, branch, jurisdiction, role, judge, opposingParty, opposingLawyer, caseValue, phase, description, strategy, parseCurrencyValue, router]);

  const availableCaseTypes = area ? (CASE_TYPES[area] ?? []) : [];

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressStep,
            {
              backgroundColor: i <= currentStep ? colors.primary : colors.border,
              flex: 1,
            },
          ]}
        />
      ))}
    </View>
  );

  const stepTitles = ['Dados Basicos', 'Tribunal e Vara', 'Partes', 'Valores e Fase'];

  const renderStep0 = () => (
    <>
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
    </>
  );

  const renderStep1 = () => (
    <>
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
    </>
  );

  const renderStep2 = () => (
    <>
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
    </>
  );

  const renderStep3 = () => (
    <>
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
    </>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderStep0();
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      default: return null;
    }
  };

  return (
    <KeyboardWrapper contentContainerStyle={styles.scrollContent}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Progress */}
        {renderProgressBar()}
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          Passo {currentStep + 1} de {TOTAL_STEPS}: {stepTitles[currentStep]}
        </Text>

        {/* Current Step Content */}
        {renderCurrentStep()}

        {/* Navigation Buttons */}
        <View style={styles.navButtons}>
          {currentStep > 0 && (
            <Button
              title="Voltar"
              onPress={goBack}
              variant="outline"
              size="lg"
              style={styles.navButton}
            />
          )}
          {currentStep < TOTAL_STEPS - 1 ? (
            <Button
              title="Proximo"
              onPress={goNext}
              size="lg"
              style={[styles.navButton, currentStep === 0 && styles.navButtonFull]}
            />
          ) : (
            <Button
              title="Criar Processo"
              onPress={handleSubmit}
              loading={submitting}
              size="lg"
              style={styles.navButton}
            />
          )}
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
  progressContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  progressStep: {
    height: 4,
    borderRadius: 2,
  },
  stepTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.lg,
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
  navButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  navButton: {
    flex: 1,
  },
  navButtonFull: {
    flex: 1,
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
