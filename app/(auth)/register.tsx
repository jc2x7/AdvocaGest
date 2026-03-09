import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/store/AuthContext';
import { useTheme } from '../../src/store/ThemeContext';
import { Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { validateEmail, validatePhone } from '../../src/utils/validators';
import { BRAZILIAN_STATES, STATE_NAMES, BrazilianState } from '../../src/constants/courts';
import KeyboardWrapper from '../../src/components/layout/KeyboardWrapper';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';

interface FormData {
  nome: string;
  oab: string;
  estadoOAB: string;
  email: string;
  telefone: string;
  senha: string;
  confirmarSenha: string;
}

interface FormErrors {
  nome: string;
  oab: string;
  estadoOAB: string;
  email: string;
  telefone: string;
  senha: string;
  confirmarSenha: string;
}

const EMPTY_ERRORS: FormErrors = {
  nome: '',
  oab: '',
  estadoOAB: '',
  email: '',
  telefone: '',
  senha: '',
  confirmarSenha: '',
};

export default function RegisterScreen() {
  const { signUp, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    nome: '',
    oab: '',
    estadoOAB: '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
  });
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);
  const [submitting, setSubmitting] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);

  const updateField = useCallback(
    (field: keyof FormData) => (value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: '' }));
    },
    [],
  );

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = { ...EMPTY_ERRORS };
    let valid = true;

    if (!form.nome.trim()) {
      newErrors.nome = 'Nome e obrigatorio';
      valid = false;
    } else if (form.nome.trim().length < 3) {
      newErrors.nome = 'Nome deve ter no minimo 3 caracteres';
      valid = false;
    }

    const oabDigits = form.oab.replace(/\D/g, '');
    if (!oabDigits) {
      newErrors.oab = 'Numero da OAB e obrigatorio';
      valid = false;
    } else if (oabDigits.length < 4 || oabDigits.length > 6) {
      newErrors.oab = 'Numero da OAB invalido';
      valid = false;
    }

    if (!form.estadoOAB) {
      newErrors.estadoOAB = 'Estado da OAB e obrigatorio';
      valid = false;
    }

    if (!form.email.trim()) {
      newErrors.email = 'E-mail e obrigatorio';
      valid = false;
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'E-mail invalido';
      valid = false;
    }

    if (!form.telefone.trim()) {
      newErrors.telefone = 'Telefone e obrigatorio';
      valid = false;
    } else if (!validatePhone(form.telefone)) {
      newErrors.telefone = 'Telefone invalido';
      valid = false;
    }

    if (!form.senha) {
      newErrors.senha = 'Senha e obrigatoria';
      valid = false;
    } else if (form.senha.length < 6) {
      newErrors.senha = 'Senha deve ter no minimo 6 caracteres';
      valid = false;
    }

    if (!form.confirmarSenha) {
      newErrors.confirmarSenha = 'Confirmacao de senha e obrigatoria';
      valid = false;
    } else if (form.senha !== form.confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas nao coincidem';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }, [form]);

  const handleRegister = useCallback(async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      await signUp({
        name: form.nome.trim(),
        email: form.email.trim(),
        phone: form.telefone,
        oabNumber: form.oab,
        oabState: form.estadoOAB,
        password: form.senha,
        confirmPassword: form.confirmarSenha,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao criar conta. Tente novamente.';
      Alert.alert('Erro no cadastro', message);
    } finally {
      setSubmitting(false);
    }
  }, [validate, signUp, form]);

  const selectState = useCallback(
    (state: BrazilianState) => {
      setForm((prev) => ({ ...prev, estadoOAB: state }));
      setErrors((prev) => ({ ...prev, estadoOAB: '' }));
      setShowStatePicker(false);
    },
    [],
  );

  const isLoading = submitting || authLoading;

  return (
    <KeyboardWrapper contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerSection}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Criar conta</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Preencha seus dados para comecar
        </Text>
      </View>

      <View style={styles.formSection}>
        <Input
          label="Nome completo *"
          value={form.nome}
          onChangeText={updateField('nome')}
          error={errors.nome}
          leftIcon="person-outline"
          autoCapitalize="words"
          returnKeyType="next"
        />

        <Input
          label="Numero OAB *"
          value={form.oab}
          onChangeText={updateField('oab')}
          error={errors.oab}
          leftIcon="card-outline"
          maskType="oab"
          keyboardType="numeric"
          returnKeyType="next"
        />

        <TouchableOpacity
          onPress={() => setShowStatePicker(!showStatePicker)}
          style={[
            styles.pickerButton,
            {
              borderColor: errors.estadoOAB ? colors.error : colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        >
          <Ionicons
            name="location-outline"
            size={20}
            color={form.estadoOAB ? colors.primary : colors.textSecondary}
            style={styles.pickerIcon}
          />
          <Text
            style={[
              styles.pickerText,
              {
                color: form.estadoOAB ? colors.text : colors.placeholder,
              },
            ]}
          >
            {form.estadoOAB
              ? `${form.estadoOAB} - ${STATE_NAMES[form.estadoOAB as BrazilianState]}`
              : 'Estado da OAB *'}
          </Text>
          <Ionicons
            name={showStatePicker ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        {errors.estadoOAB ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {errors.estadoOAB}
          </Text>
        ) : null}

        {showStatePicker && (
          <View
            style={[
              styles.stateList,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {BRAZILIAN_STATES.map((state) => (
              <TouchableOpacity
                key={state}
                onPress={() => selectState(state)}
                style={[
                  styles.stateItem,
                  { borderBottomColor: colors.borderLight },
                  form.estadoOAB === state && {
                    backgroundColor: colors.surfaceVariant,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stateItemText,
                    { color: colors.text },
                    form.estadoOAB === state && {
                      color: colors.primary,
                      fontWeight: Typography.fontWeight.semibold,
                    },
                  ]}
                >
                  {state} - {STATE_NAMES[state]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Input
          label="E-mail *"
          value={form.email}
          onChangeText={updateField('email')}
          error={errors.email}
          leftIcon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="next"
        />

        <Input
          label="Telefone *"
          value={form.telefone}
          onChangeText={updateField('telefone')}
          error={errors.telefone}
          leftIcon="call-outline"
          maskType="phone"
          keyboardType="phone-pad"
          returnKeyType="next"
        />

        <Input
          label="Senha *"
          value={form.senha}
          onChangeText={updateField('senha')}
          error={errors.senha}
          leftIcon="lock-closed-outline"
          isPassword
          autoCapitalize="none"
          returnKeyType="next"
        />

        <Input
          label="Confirmar senha *"
          value={form.confirmarSenha}
          onChangeText={updateField('confirmarSenha')}
          error={errors.confirmarSenha}
          leftIcon="lock-closed-outline"
          isPassword
          autoCapitalize="none"
          returnKeyType="done"
        />

        <Button
          title="Criar conta"
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading}
          size="lg"
          style={styles.registerButton}
        />
      </View>

      <View style={styles.footerSection}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Ja tem uma conta?
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.loginLinkText, { color: colors.primary }]}>
            Fazer login
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  backButton: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.xxl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.md,
  },
  formSection: {
    marginBottom: Spacing.lg,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 56,
    marginBottom: Spacing.md,
  },
  pickerIcon: {
    marginRight: Spacing.sm,
  },
  pickerText: {
    flex: 1,
    fontSize: Typography.md,
  },
  errorText: {
    fontSize: Typography.xs,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  stateList: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    maxHeight: 200,
  },
  stateItem: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stateItemText: {
    fontSize: Typography.sm,
  },
  registerButton: {
    marginTop: Spacing.sm,
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingBottom: Spacing.lg,
  },
  footerText: {
    fontSize: Typography.sm,
  },
  loginLinkText: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
});
