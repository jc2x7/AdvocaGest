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
import { validateEmail } from '../../src/utils/validators';
import KeyboardWrapper from '../../src/components/layout/KeyboardWrapper';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';

type ScreenState = 'form' | 'loading' | 'success' | 'error';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [screenState, setScreenState] = useState<ScreenState>('form');
  const [errorMessage, setErrorMessage] = useState('');

  const validate = useCallback((): boolean => {
    if (!email.trim()) {
      setEmailError('E-mail e obrigatorio');
      return false;
    }
    if (!validateEmail(email)) {
      setEmailError('E-mail invalido');
      return false;
    }
    setEmailError('');
    return true;
  }, [email]);

  const handleSendReset = useCallback(async () => {
    if (!validate()) return;

    setScreenState('loading');
    try {
      await resetPassword(email.trim());
      setScreenState('success');
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Erro ao enviar e-mail de recuperacao. Tente novamente.';
      setErrorMessage(message);
      setScreenState('error');
    }
  }, [validate, resetPassword, email]);

  const handleRetry = useCallback(() => {
    setScreenState('form');
    setErrorMessage('');
  }, []);

  if (screenState === 'success') {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.successLight },
          ]}
        >
          <Ionicons name="checkmark-circle" size={48} color={colors.success} />
        </View>
        <Text style={[styles.successTitle, { color: colors.text }]}>
          E-mail enviado!
        </Text>
        <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
          Enviamos um link de recuperacao para{'\n'}
          {email.trim()}
        </Text>
        <Text style={[styles.successHint, { color: colors.textTertiary }]}>
          Verifique sua caixa de entrada e a pasta de spam.
        </Text>
        <Button
          title="Voltar ao login"
          onPress={() => router.back()}
          size="lg"
          style={styles.actionButton}
        />
      </View>
    );
  }

  if (screenState === 'error') {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.errorLight },
          ]}
        >
          <Ionicons name="alert-circle" size={48} color={colors.error} />
        </View>
        <Text style={[styles.successTitle, { color: colors.text }]}>
          Erro ao enviar
        </Text>
        <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
          {errorMessage}
        </Text>
        <Button
          title="Tentar novamente"
          onPress={handleRetry}
          size="lg"
          style={styles.actionButton}
        />
        <Button
          title="Voltar ao login"
          onPress={() => router.back()}
          variant="ghost"
          size="lg"
        />
      </View>
    );
  }

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

        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.infoLight },
          ]}
        >
          <Ionicons name="key-outline" size={32} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Recuperar senha
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </Text>
      </View>

      <View style={styles.formSection}>
        <Input
          label="E-mail"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setEmailError('');
          }}
          error={emailError}
          leftIcon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="done"
        />

        <Button
          title="Enviar link de recuperacao"
          onPress={handleSendReset}
          loading={screenState === 'loading'}
          disabled={screenState === 'loading'}
          size="lg"
          style={styles.submitButton}
        />
      </View>

      <View style={styles.footerSection}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Lembrou da senha?
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
    justifyContent: 'center',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  headerSection: {
    marginBottom: Spacing.xl,
  },
  backButton: {
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.xxl,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  formSection: {
    marginBottom: Spacing.lg,
  },
  submitButton: {
    marginTop: Spacing.sm,
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
  loginLinkText: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  successTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  successMessage: {
    fontSize: Typography.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  successHint: {
    fontSize: Typography.sm,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  actionButton: {
    marginBottom: Spacing.md,
    minWidth: 250,
  },
});
