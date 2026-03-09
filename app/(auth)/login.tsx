import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../../src/store/AuthContext';
import { useTheme } from '../../src/store/ThemeContext';
import { Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { validateEmail } from '../../src/utils/validators';
import KeyboardWrapper from '../../src/components/layout/KeyboardWrapper';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';

interface FormErrors {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const { signIn, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    const checkBiometric = async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricAvailable(compatible && enrolled);
      } catch {
        setBiometricAvailable(false);
      }
    };

    void checkBiometric();
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = { email: '', password: '' };
    let valid = true;

    if (!email.trim()) {
      newErrors.email = 'E-mail e obrigatorio';
      valid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = 'E-mail invalido';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Senha e obrigatoria';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter no minimo 6 caracteres';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      await signIn({ email: email.trim(), password });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao fazer login. Tente novamente.';
      Alert.alert('Erro no login', message);
    } finally {
      setSubmitting(false);
    }
  }, [validate, signIn, email, password]);

  const handleBiometricLogin = useCallback(async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentique-se para acessar o AdvogaPlan',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Biometric succeeded - auth state will be handled by AuthContext listener
      }
    } catch {
      Alert.alert('Erro', 'Falha na autenticacao biometrica.');
    }
  }, []);

  const isLoading = submitting || authLoading;

  return (
    <KeyboardWrapper
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.headerSection}>
        <View
          style={[
            styles.logoContainer,
            { backgroundColor: colors.primary },
          ]}
        >
          <Ionicons name="briefcase" size={40} color="#ffffff" />
        </View>
        <Text style={[styles.appTitle, { color: colors.text }]}>AdvogaPlan</Text>
        <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>
          Gestao inteligente para advogados
        </Text>
      </View>

      <View style={styles.formSection}>
        <Input
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          leftIcon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="next"
        />

        <Input
          label="Senha"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          leftIcon="lock-closed-outline"
          isPassword
          autoCapitalize="none"
          returnKeyType="done"
        />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/forgot-password')}
          style={styles.forgotPasswordButton}
        >
          <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
            Esqueceu a senha?
          </Text>
        </TouchableOpacity>

        <Button
          title="Entrar"
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading}
          size="lg"
          style={styles.loginButton}
        />

        {biometricAvailable && (
          <Button
            title="Entrar com biometria"
            onPress={handleBiometricLogin}
            variant="outline"
            size="lg"
            icon={<Ionicons name="finger-print" size={20} color={colors.primary} />}
            style={styles.biometricButton}
          />
        )}
      </View>

      <View style={styles.footerSection}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Nao tem uma conta?
        </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={[styles.createAccountText, { color: colors.primary }]}>
            Criar conta
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
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appTitle: {
    fontSize: Typography.xxl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  appSubtitle: {
    fontSize: Typography.md,
  },
  formSection: {
    marginBottom: Spacing.lg,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
    marginTop: -Spacing.sm,
  },
  forgotPasswordText: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  loginButton: {
    marginBottom: Spacing.md,
  },
  biometricButton: {
    marginBottom: Spacing.md,
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingBottom: Spacing.xl,
  },
  footerText: {
    fontSize: Typography.sm,
  },
  createAccountText: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
});
