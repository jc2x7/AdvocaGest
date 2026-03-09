import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../src/store/ThemeContext';
import { useAuth } from '../../../src/store/AuthContext';
import KeyboardWrapper from '../../../src/components/layout/KeyboardWrapper';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import { BorderRadius, Shadows, Spacing, Typography } from '../../../src/constants/theme';

interface NotificationSettings {
  deadlines: boolean;
  hearings: boolean;
  payments: boolean;
  movements: boolean;
  leads: boolean;
}

const TIMEOUT_OPTIONS: { label: string; value: number }[] = [
  { label: '5 minutos', value: 5 },
  { label: '15 minutos', value: 15 },
  { label: '30 minutos', value: 30 },
  { label: '1 hora', value: 60 },
  { label: '4 horas', value: 240 },
  { label: 'Nunca', value: 0 },
];

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { resetPassword, user } = useAuth();

  const [notifications, setNotifications] = useState<NotificationSettings>({
    deadlines: true,
    hearings: true,
    payments: true,
    movements: true,
    leads: true,
  });

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [showTimeoutPicker, setShowTimeoutPicker] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  const toggleNotification = useCallback((key: keyof NotificationSettings) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleBiometricToggle = useCallback(async (value: boolean) => {
    try {
      await AsyncStorage.setItem('@advocagest:biometric_enabled', value ? 'true' : 'false');
      setBiometricEnabled(value);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel alterar a configuracao biometrica.');
    }
  }, []);

  const handleChangePassword = useCallback(async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas nao coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setChangingPassword(true);
    try {
      if (user?.email) {
        await resetPassword(user.email);
      }
      Alert.alert('Sucesso', 'Um e-mail de redefinicao de senha foi enviado.');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      Alert.alert('Erro', 'Nao foi possivel enviar o e-mail de redefinicao.');
    } finally {
      setChangingPassword(false);
    }
  }, [newPassword, confirmPassword, user, resetPassword]);

  const handleExportCsv = useCallback(async () => {
    setExportingCsv(true);
    try {
      // Simulate export delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert('Exportacao', 'Os dados foram exportados com sucesso.');
    } catch {
      Alert.alert('Erro', 'Nao foi possivel exportar os dados.');
    } finally {
      setExportingCsv(false);
    }
  }, []);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Limpar Cache',
      'Tem certeza que deseja limpar o cache do aplicativo? Esta acao nao pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            setClearingCache(true);
            try {
              await AsyncStorage.multiRemove([
                '@advocagest:cache_clients',
                '@advocagest:cache_cases',
                '@advocagest:cache_tasks',
              ]);
              Alert.alert('Sucesso', 'Cache limpo com sucesso.');
            } catch {
              Alert.alert('Erro', 'Nao foi possivel limpar o cache.');
            } finally {
              setClearingCache(false);
            }
          },
        },
      ],
    );
  }, []);

  const getTimeoutLabel = useCallback(() => {
    const option = TIMEOUT_OPTIONS.find((o) => o.value === sessionTimeout);
    return option?.label ?? '30 minutos';
  }, [sessionTimeout]);

  const renderSectionHeader = (title: string, icon: keyof typeof Ionicons.glyphMap) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
    </View>
  );

  const renderToggleRow = (
    label: string,
    value: boolean,
    onValueChange: (val: boolean) => void,
    description?: string,
  ) => (
    <View style={[styles.settingRow, { borderBottomColor: colors.borderLight }]}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
        {description && (
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: `${colors.primary}80` }}
        thumbColor={value ? colors.primary : colors.disabled}
      />
    </View>
  );

  return (
    <KeyboardWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderSectionHeader('Aparencia', 'color-palette-outline')}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          {renderToggleRow(
            'Tema escuro',
            isDark,
            toggleTheme,
            'Alterna entre o tema claro e escuro',
          )}
        </View>

        {renderSectionHeader('Notificacoes', 'notifications-outline')}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          {renderToggleRow('Prazos processuais', notifications.deadlines, () => toggleNotification('deadlines'))}
          {renderToggleRow('Audiencias', notifications.hearings, () => toggleNotification('hearings'))}
          {renderToggleRow('Pagamentos', notifications.payments, () => toggleNotification('payments'))}
          {renderToggleRow('Movimentacoes', notifications.movements, () => toggleNotification('movements'))}
          {renderToggleRow('Novos leads', notifications.leads, () => toggleNotification('leads'))}
        </View>

        {renderSectionHeader('Seguranca', 'shield-outline')}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.borderLight }]}
            onPress={() => setShowPasswordModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Alterar senha</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Enviar e-mail de redefinicao de senha
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          {renderToggleRow(
            'Autenticacao biometrica',
            biometricEnabled,
            handleBiometricToggle,
            'Use impressao digital ou reconhecimento facial',
          )}

          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.borderLight }]}
            onPress={() => setShowTimeoutPicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Tempo limite da sessao</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {getTimeoutLabel()}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {renderSectionHeader('Dados', 'server-outline')}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.borderLight }]}
            onPress={handleExportCsv}
            disabled={exportingCsv}
            activeOpacity={0.7}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Exportar dados (CSV)</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Exportar clientes, processos e financeiro
              </Text>
            </View>
            <Ionicons name="download-outline" size={20} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.borderLight }]}
            onPress={handleClearCache}
            disabled={clearingCache}
            activeOpacity={0.7}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Limpar cache</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Liberar espaco removendo dados temporarios
              </Text>
            </View>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>

        {renderSectionHeader('Sobre', 'information-circle-outline')}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <View style={[styles.settingRow, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Versao do aplicativo</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>1.0.0</Text>
          </View>
          <View style={[styles.settingRow, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Desenvolvido por</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>AdvogaPlan</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />

        <Modal visible={showTimeoutPicker} transparent animationType="fade" onRequestClose={() => setShowTimeoutPicker(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowTimeoutPicker(false)}>
            <Pressable style={[styles.modalContent, Shadows.lg, { backgroundColor: colors.surface }]} onPress={() => {}}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Tempo limite da sessao</Text>
              {TIMEOUT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.timeoutOption,
                    sessionTimeout === option.value && { backgroundColor: `${colors.primary}15` },
                  ]}
                  onPress={() => {
                    setSessionTimeout(option.value);
                    setShowTimeoutPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.timeoutLabel,
                      { color: sessionTimeout === option.value ? colors.primary : colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {sessionTimeout === option.value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={showPasswordModal} transparent animationType="fade" onRequestClose={() => setShowPasswordModal(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowPasswordModal(false)}>
            <Pressable style={[styles.modalContent, Shadows.lg, { backgroundColor: colors.surface }]} onPress={() => {}}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Alterar Senha</Text>
              <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                Um e-mail sera enviado para redefinir sua senha.
              </Text>
              <Input
                label="Senha atual"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                isPassword
                leftIcon="lock-closed-outline"
              />
              <Input
                label="Nova senha"
                value={newPassword}
                onChangeText={setNewPassword}
                isPassword
                leftIcon="lock-closed-outline"
              />
              <Input
                label="Confirmar nova senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
                leftIcon="lock-closed-outline"
              />
              <View style={styles.modalActions}>
                <Button
                  title="Cancelar"
                  variant="outline"
                  onPress={() => setShowPasswordModal(false)}
                  style={styles.modalActionButton}
                />
                <Button
                  title="Redefinir"
                  onPress={handleChangePassword}
                  loading={changingPassword}
                  style={styles.modalActionButton}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </KeyboardWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: '600',
  },
  section: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    minHeight: 52,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  settingValue: {
    fontSize: Typography.sm,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  modalDescription: {
    fontSize: Typography.sm,
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modalActionButton: {
    flex: 1,
  },
  timeoutOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: 2,
  },
  timeoutLabel: {
    fontSize: Typography.md,
  },
});
