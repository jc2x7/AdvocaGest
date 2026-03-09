import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/store/ThemeContext';
import { useAuth } from '../../../../src/store/AuthContext';
import KeyboardWrapper from '../../../../src/components/layout/KeyboardWrapper';
import Input from '../../../../src/components/ui/Input';
import Button from '../../../../src/components/ui/Button';
import LoadingState from '../../../../src/components/ui/LoadingState';
import ErrorState from '../../../../src/components/ui/ErrorState';
import { getClientById, updateClient } from '../../../../src/services/firebase/clientService';
import { Client, ClientType, ClientFormData } from '../../../../src/types/client';
import { Address } from '../../../../src/types/common';
import { validateCPF, validateCNPJ, validateEmail, validatePhone, validateRequired } from '../../../../src/utils/validators';
import { unmask, maskCPF, maskCNPJ, maskPhone, maskCEP } from '../../../../src/utils/masks';
import { fetchAddressByCep } from '../../../../src/utils/viaCep';
import { Spacing, Typography, BorderRadius } from '../../../../src/constants/theme';

interface FormErrors {
  fullName?: string;
  cpf?: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  companyName?: string;
}

export default function EditClientScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [clientType, setClientType] = useState<ClientType>('PF');

  // PF fields
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [profession, setProfession] = useState('');

  // PJ fields
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  // Common fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');

  // Address
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const populateForm = useCallback((client: Client) => {
    setClientType(client.type);
    setFullName(client.fullName);
    setCpf(client.cpf ? maskCPF(client.cpf) : '');
    setRg(client.rg ?? '');
    setBirthDate(client.birthDate ?? '');
    setGender(client.gender ?? '');
    setMaritalStatus(client.maritalStatus ?? '');
    setProfession(client.profession ?? '');
    setCompanyName(client.companyName ?? '');
    setCnpj(client.cnpj ? maskCNPJ(client.cnpj) : '');
    setTradeName(client.tradeName ?? '');
    setContactPerson(client.contactPerson ?? '');
    setEmail(client.email ?? '');
    setPhone(maskPhone(client.phone));
    setPhone2(client.phone2 ? maskPhone(client.phone2) : '');
    setNotes(client.notes ?? '');
    setTags(client.tags ? client.tags.join(', ') : '');

    if (client.address) {
      setCep(client.address.cep ? maskCEP(client.address.cep) : '');
      setStreet(client.address.street ?? '');
      setNumber(client.address.number ?? '');
      setComplement(client.address.complement ?? '');
      setNeighborhood(client.address.neighborhood ?? '');
      setCity(client.address.city ?? '');
      setState(client.address.state ?? '');
    }
  }, []);

  const loadClient = useCallback(async () => {
    if (!user || !id) return;
    try {
      setLoadError(null);
      const data = await getClientById(user.uid, id);
      if (!data) {
        setLoadError('Cliente nao encontrado');
        return;
      }
      populateForm(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao carregar cliente';
      setLoadError(message);
    } finally {
      setInitialLoading(false);
    }
  }, [user, id, populateForm]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  const handleCepBlur = useCallback(async () => {
    const rawCep = unmask(cep);
    if (rawCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const address = await fetchAddressByCep(rawCep);
      if (address) {
        setStreet(address.logradouro);
        setNeighborhood(address.bairro);
        setCity(address.localidade);
        setState(address.uf);
      }
    } finally {
      setLoadingCep(false);
    }
  }, [cep]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (clientType === 'PF') {
      const nameResult = validateRequired(fullName, 'Nome');
      if (!nameResult.valid) {
        newErrors.fullName = nameResult.message;
      }

      if (cpf.length > 0 && !validateCPF(cpf)) {
        newErrors.cpf = 'CPF invalido';
      }
    } else {
      const companyResult = validateRequired(companyName, 'Razao Social');
      if (!companyResult.valid) {
        newErrors.companyName = companyResult.message;
      }

      const cnpjRequired = validateRequired(cnpj, 'CNPJ');
      if (!cnpjRequired.valid) {
        newErrors.cnpj = cnpjRequired.message;
      } else if (!validateCNPJ(cnpj)) {
        newErrors.cnpj = 'CNPJ invalido';
      }

      const contactResult = validateRequired(contactPerson, 'Contato');
      if (!contactResult.valid) {
        newErrors.contactPerson = contactResult.message;
      }
    }

    const phoneResult = validateRequired(phone, 'Telefone');
    if (!phoneResult.valid) {
      newErrors.phone = phoneResult.message;
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Telefone invalido';
    }

    if (email.length > 0 && !validateEmail(email)) {
      newErrors.email = 'E-mail invalido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [clientType, fullName, cpf, companyName, cnpj, contactPerson, phone, email]);

  const buildAddress = useCallback((): Address | undefined => {
    if (!cep && !street && !city) return undefined;
    return {
      cep: unmask(cep),
      street,
      number,
      complement: complement || undefined,
      neighborhood,
      city,
      state,
    };
  }, [cep, street, number, complement, neighborhood, city, state]);

  const handleSave = useCallback(async () => {
    if (!user || !id) return;
    if (!validateForm()) return;

    setSaving(true);
    try {
      const parsedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const formData: Partial<ClientFormData> = {
        type: clientType,
        fullName: clientType === 'PF' ? fullName.trim() : companyName.trim(),
        cpf: clientType === 'PF' && cpf ? unmask(cpf) : undefined,
        rg: clientType === 'PF' && rg ? rg.trim() : undefined,
        birthDate: clientType === 'PF' && birthDate ? birthDate : undefined,
        gender: clientType === 'PF' && gender ? gender : undefined,
        maritalStatus: clientType === 'PF' && maritalStatus ? maritalStatus : undefined,
        profession: clientType === 'PF' && profession ? profession.trim() : undefined,
        companyName: clientType === 'PJ' ? companyName.trim() : undefined,
        cnpj: clientType === 'PJ' && cnpj ? unmask(cnpj) : undefined,
        tradeName: clientType === 'PJ' && tradeName ? tradeName.trim() : undefined,
        contactPerson: clientType === 'PJ' ? contactPerson.trim() : undefined,
        email: email ? email.trim().toLowerCase() : undefined,
        phone: unmask(phone),
        phone2: phone2 ? unmask(phone2) : undefined,
        address: buildAddress(),
        notes: notes ? notes.trim() : undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      };

      await updateClient(user.uid, id, formData);
      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao atualizar cliente';
      Alert.alert('Erro', message);
    } finally {
      setSaving(false);
    }
  }, [
    user, id, validateForm, clientType, fullName, cpf, rg, birthDate, gender,
    maritalStatus, profession, companyName, cnpj, tradeName, contactPerson,
    email, phone, phone2, notes, tags, buildAddress, router,
  ]);

  const clearFieldError = useCallback((field: keyof FormErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  if (initialLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <LoadingState message="Carregando dados do cliente..." />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ErrorState message={loadError} onRetry={loadClient} />
      </View>
    );
  }

  return (
    <KeyboardWrapper
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.content}>
        {/* Toggle PF / PJ */}
        <View
          style={[
            styles.typeToggle,
            { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.typeOption,
              clientType === 'PF' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setClientType('PF')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person-outline"
              size={18}
              color={clientType === 'PF' ? '#ffffff' : colors.textSecondary}
            />
            <Text
              style={[
                styles.typeLabel,
                { color: clientType === 'PF' ? '#ffffff' : colors.textSecondary },
              ]}
            >
              Pessoa Fisica
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeOption,
              clientType === 'PJ' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setClientType('PJ')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="business-outline"
              size={18}
              color={clientType === 'PJ' ? '#ffffff' : colors.textSecondary}
            />
            <Text
              style={[
                styles.typeLabel,
                { color: clientType === 'PJ' ? '#ffffff' : colors.textSecondary },
              ]}
            >
              Pessoa Juridica
            </Text>
          </TouchableOpacity>
        </View>

        {/* PF Fields */}
        {clientType === 'PF' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Dados Pessoais
            </Text>
            <Input
              label="Nome Completo *"
              value={fullName}
              onChangeText={(v) => { setFullName(v); clearFieldError('fullName'); }}
              error={errors.fullName}
              leftIcon="person-outline"
              autoCapitalize="words"
            />
            <Input
              label="CPF"
              value={cpf}
              onChangeText={(v) => { setCpf(v); clearFieldError('cpf'); }}
              error={errors.cpf}
              maskType="cpf"
              keyboardType="numeric"
              leftIcon="card-outline"
            />
            <Input
              label="RG"
              value={rg}
              onChangeText={setRg}
              keyboardType="default"
              leftIcon="document-outline"
            />
            <Input
              label="Data de Nascimento"
              value={birthDate}
              onChangeText={setBirthDate}
              maskType="date"
              keyboardType="numeric"
              leftIcon="calendar-outline"
            />
            <Input
              label="Genero"
              value={gender}
              onChangeText={setGender}
              leftIcon="male-female-outline"
            />
            <Input
              label="Estado Civil"
              value={maritalStatus}
              onChangeText={setMaritalStatus}
              leftIcon="heart-outline"
            />
            <Input
              label="Profissao"
              value={profession}
              onChangeText={setProfession}
              leftIcon="briefcase-outline"
            />
          </>
        )}

        {/* PJ Fields */}
        {clientType === 'PJ' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Dados da Empresa
            </Text>
            <Input
              label="Razao Social *"
              value={companyName}
              onChangeText={(v) => { setCompanyName(v); clearFieldError('companyName'); }}
              error={errors.companyName}
              leftIcon="business-outline"
              autoCapitalize="words"
            />
            <Input
              label="CNPJ *"
              value={cnpj}
              onChangeText={(v) => { setCnpj(v); clearFieldError('cnpj'); }}
              error={errors.cnpj}
              maskType="cnpj"
              keyboardType="numeric"
              leftIcon="card-outline"
            />
            <Input
              label="Nome Fantasia"
              value={tradeName}
              onChangeText={setTradeName}
              leftIcon="pricetag-outline"
              autoCapitalize="words"
            />
            <Input
              label="Pessoa de Contato *"
              value={contactPerson}
              onChangeText={(v) => { setContactPerson(v); clearFieldError('contactPerson'); }}
              error={errors.contactPerson}
              leftIcon="person-outline"
              autoCapitalize="words"
            />
          </>
        )}

        {/* Contact Fields */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Contato
        </Text>
        <Input
          label="E-mail"
          value={email}
          onChangeText={(v) => { setEmail(v); clearFieldError('email'); }}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon="mail-outline"
        />
        <Input
          label="Telefone *"
          value={phone}
          onChangeText={(v) => { setPhone(v); clearFieldError('phone'); }}
          error={errors.phone}
          maskType="phone"
          keyboardType="phone-pad"
          leftIcon="call-outline"
        />
        <Input
          label="Telefone 2"
          value={phone2}
          onChangeText={setPhone2}
          maskType="phone"
          keyboardType="phone-pad"
          leftIcon="call-outline"
        />

        {/* Address Fields */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Endereco
        </Text>
        <View style={styles.cepRow}>
          <View style={styles.cepInput}>
            <Input
              label="CEP"
              value={cep}
              onChangeText={setCep}
              onBlur={handleCepBlur}
              maskType="cep"
              keyboardType="numeric"
              leftIcon="location-outline"
            />
          </View>
          {loadingCep && (
            <Text style={[styles.cepLoading, { color: colors.textSecondary }]}>
              Buscando...
            </Text>
          )}
        </View>
        <Input
          label="Logradouro"
          value={street}
          onChangeText={setStreet}
          autoCapitalize="words"
        />
        <View style={styles.row}>
          <View style={styles.smallField}>
            <Input
              label="Numero"
              value={number}
              onChangeText={setNumber}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.largeField}>
            <Input
              label="Complemento"
              value={complement}
              onChangeText={setComplement}
            />
          </View>
        </View>
        <Input
          label="Bairro"
          value={neighborhood}
          onChangeText={setNeighborhood}
          autoCapitalize="words"
        />
        <View style={styles.row}>
          <View style={styles.largeField}>
            <Input
              label="Cidade"
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.smallField}>
            <Input
              label="UF"
              value={state}
              onChangeText={setState}
              autoCapitalize="characters"
              maxLength={2}
            />
          </View>
        </View>

        {/* Notes & Tags */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Informacoes Adicionais
        </Text>
        <Input
          label="Observacoes"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          leftIcon="document-text-outline"
        />
        <Input
          label="Tags (separadas por virgula)"
          value={tags}
          onChangeText={setTags}
          leftIcon="pricetags-outline"
          autoCapitalize="none"
        />

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Salvar Alteracoes"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            size="lg"
            icon={<Ionicons name="checkmark" size={20} color="#ffffff" />}
            style={styles.saveButton}
          />
        </View>
      </View>
    </KeyboardWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  content: {
    padding: Spacing.md,
  },
  typeToggle: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 4,
    gap: Spacing.sm,
  },
  typeLabel: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cepInput: {
    flex: 1,
  },
  cepLoading: {
    fontSize: Typography.xs,
    marginLeft: Spacing.sm,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  smallField: {
    flex: 1,
  },
  largeField: {
    flex: 2,
  },
  buttonContainer: {
    marginTop: Spacing.lg,
  },
  saveButton: {
    width: '100%',
  },
});
