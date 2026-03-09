import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/store/ThemeContext';
import { useAuth } from '../../../src/store/AuthContext';
import KeyboardWrapper from '../../../src/components/layout/KeyboardWrapper';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import { BorderRadius, Spacing, Typography } from '../../../src/constants/theme';
import { Address } from '../../../src/types/common';

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export default function OfficeScreen() {
  const { colors } = useTheme();
  const { officeData, updateOfficeData } = useAuth();

  const [name, setName] = useState(officeData?.name ?? '');
  const [cnpj, setCnpj] = useState(officeData?.cnpj ?? '');
  const [phone, setPhone] = useState(officeData?.phone ?? '');
  const [email, setEmail] = useState(officeData?.email ?? '');
  const [website, setWebsite] = useState(officeData?.website ?? '');
  const [logo, setLogo] = useState<string | undefined>(officeData?.logo);

  const [cep, setCep] = useState(officeData?.address?.cep ?? '');
  const [street, setStreet] = useState(officeData?.address?.street ?? '');
  const [number, setNumber] = useState(officeData?.address?.number ?? '');
  const [complement, setComplement] = useState(officeData?.address?.complement ?? '');
  const [neighborhood, setNeighborhood] = useState(officeData?.address?.neighborhood ?? '');
  const [city, setCity] = useState(officeData?.address?.city ?? '');
  const [state, setState] = useState(officeData?.address?.state ?? '');

  const [bankName, setBankName] = useState(officeData?.bankName ?? '');
  const [bankAgency, setBankAgency] = useState(officeData?.bankAgency ?? '');
  const [bankAccount, setBankAccount] = useState(officeData?.bankAccount ?? '');
  const [pixKey, setPixKey] = useState(officeData?.pixKey ?? '');

  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  const fetchCepData = useCallback(async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data: ViaCepResponse = await response.json();

      if (data.erro) {
        Alert.alert('CEP nao encontrado', 'Verifique o CEP informado.');
        return;
      }

      setStreet(data.logradouro || '');
      setNeighborhood(data.bairro || '');
      setCity(data.localidade || '');
      setState(data.uf || '');
      if (data.complemento) {
        setComplement(data.complemento);
      }
    } catch {
      Alert.alert('Erro', 'Nao foi possivel buscar o CEP.');
    } finally {
      setLoadingCep(false);
    }
  }, []);

  const handleCepChange = useCallback((value: string) => {
    setCep(value);
    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      fetchCepData(value);
    }
  }, [fetchCepData]);

  const pickLogo = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permissao necessaria', 'Precisamos de acesso a galeria para selecionar a imagem.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLogo(result.assets[0].uri);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome do escritorio e obrigatorio.');
      return;
    }

    setSaving(true);
    try {
      const address: Address | undefined =
        cep || street || city
          ? {
              cep: cep.replace(/\D/g, ''),
              street,
              number,
              complement: complement || undefined,
              neighborhood,
              city,
              state,
            }
          : undefined;

      await updateOfficeData({
        name: name.trim(),
        cnpj: cnpj || undefined,
        address,
        phone: phone || undefined,
        email: email || undefined,
        website: website || undefined,
        logo,
        bankName: bankName || undefined,
        bankAgency: bankAgency || undefined,
        bankAccount: bankAccount || undefined,
        pixKey: pixKey || undefined,
      });
      Alert.alert('Sucesso', 'Dados do escritorio atualizados com sucesso.');
    } catch {
      Alert.alert('Erro', 'Nao foi possivel atualizar os dados.');
    } finally {
      setSaving(false);
    }
  }, [
    name, cnpj, phone, email, website, logo,
    cep, street, number, complement, neighborhood, city, state,
    bankName, bankAgency, bankAccount, pixKey, updateOfficeData,
  ]);

  return (
    <KeyboardWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.logoSection}>
          <TouchableOpacity
            style={[styles.logoBox, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={pickLogo}
            activeOpacity={0.7}
          >
            {logo ? (
              <Image source={{ uri: logo }} style={styles.logoImage} resizeMode="contain" />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="image-outline" size={40} color={colors.textTertiary} />
                <Text style={[styles.logoHint, { color: colors.textTertiary }]}>Logo do escritorio</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Dados Gerais</Text>

        <Input
          label="Nome do escritorio"
          value={name}
          onChangeText={setName}
          leftIcon="business-outline"
        />

        <Input
          label="CNPJ"
          value={cnpj}
          onChangeText={setCnpj}
          leftIcon="document-outline"
          maskType="cnpj"
          keyboardType="numeric"
        />

        <Input
          label="Telefone"
          value={phone}
          onChangeText={setPhone}
          leftIcon="call-outline"
          maskType="phone"
          keyboardType="phone-pad"
        />

        <Input
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          leftIcon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Website"
          value={website}
          onChangeText={setWebsite}
          leftIcon="globe-outline"
          autoCapitalize="none"
          keyboardType="url"
        />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Endereco</Text>

        <View style={styles.cepRow}>
          <View style={styles.cepInput}>
            <Input
              label="CEP"
              value={cep}
              onChangeText={handleCepChange}
              maskType="cep"
              keyboardType="numeric"
              leftIcon="navigate-outline"
            />
          </View>
          {loadingCep && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.cepLoader}
            />
          )}
        </View>

        <Input label="Rua" value={street} onChangeText={setStreet} />
        <View style={styles.row}>
          <View style={styles.smallField}>
            <Input label="Numero" value={number} onChangeText={setNumber} keyboardType="numeric" />
          </View>
          <View style={styles.largeField}>
            <Input label="Complemento" value={complement} onChangeText={setComplement} />
          </View>
        </View>
        <Input label="Bairro" value={neighborhood} onChangeText={setNeighborhood} />
        <View style={styles.row}>
          <View style={styles.largeField}>
            <Input label="Cidade" value={city} onChangeText={setCity} />
          </View>
          <View style={styles.smallField}>
            <Input label="UF" value={state} onChangeText={setState} autoCapitalize="characters" maxLength={2} />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Dados Bancarios</Text>

        <Input
          label="Nome do banco"
          value={bankName}
          onChangeText={setBankName}
          leftIcon="wallet-outline"
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Input label="Agencia" value={bankAgency} onChangeText={setBankAgency} keyboardType="numeric" />
          </View>
          <View style={styles.halfField}>
            <Input label="Conta" value={bankAccount} onChangeText={setBankAccount} keyboardType="numeric" />
          </View>
        </View>

        <Input
          label="Chave PIX"
          value={pixKey}
          onChangeText={setPixKey}
          leftIcon="qr-code-outline"
          autoCapitalize="none"
        />

        <Button
          title="Salvar Dados"
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
        />
      </View>
    </KeyboardWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoHint: {
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  cepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cepInput: {
    flex: 1,
  },
  cepLoader: {
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
  halfField: {
    flex: 1,
  },
  saveButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
