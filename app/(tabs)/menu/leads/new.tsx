import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/store/ThemeContext';
import { useAuth } from '../../../../src/store/AuthContext';
import { LeadFormData, LeadSource, LEAD_SOURCES } from '../../../../src/types/lead';
import { createLead } from '../../../../src/services/firebase/leadService';
import { maskPhone, unmask } from '../../../../src/utils/masks';
import KeyboardWrapper from '../../../../src/components/layout/KeyboardWrapper';
import Input from '../../../../src/components/ui/Input';
import Button from '../../../../src/components/ui/Button';
import { LEGAL_AREAS } from '../../../../src/constants/legalAreas';
import { BorderRadius, Shadows, Spacing, Typography } from '../../../../src/constants/theme';

export default function NewLeadScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState<LeadSource>('referral');
  const [sourceDetail, setSourceDetail] = useState('');
  const [area, setArea] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Nome e obrigatorio';
    if (!phone.trim() || unmask(phone).length < 10) newErrors.phone = 'Telefone invalido';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'E-mail invalido';
    if (!area) newErrors.area = 'Area de interesse e obrigatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, phone, email, area]);

  const handleSave = useCallback(async () => {
    if (!validate() || !user) return;
    setSaving(true);
    try {
      const formData: LeadFormData = {
        name: name.trim(),
        phone: unmask(phone),
        source,
        area,
      };
      if (email.trim()) formData.email = email.trim();
      if (sourceDetail.trim()) formData.sourceDetail = sourceDetail.trim();
      if (description.trim()) formData.description = description.trim();
      if (estimatedValue) {
        const cleaned = estimatedValue.replace(/[^\d,]/g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        if (!Number.isNaN(parsed) && parsed > 0) {
          formData.estimatedValue = parsed;
        }
      }

      await createLead(user.uid, formData);
      Alert.alert('Sucesso', 'Lead criado com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar lead';
      Alert.alert('Erro', message);
    } finally {
      setSaving(false);
    }
  }, [validate, user, name, phone, source, sourceDetail, area, description, email, estimatedValue, router]);

  const selectedSourceLabel = LEAD_SOURCES.find((s) => s.value === source)?.label ?? 'Selecionar';
  const selectedAreaLabel = LEGAL_AREAS.find((a) => a.value === area)?.label ?? '';

  return (
    <KeyboardWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Novo Lead</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <Input
            label="Nome *"
            value={name}
            onChangeText={setName}
            error={errors.name}
            leftIcon="person-outline"
            autoCapitalize="words"
          />

          <Input
            label="Telefone *"
            value={phone}
            onChangeText={(text) => setPhone(maskPhone(text))}
            error={errors.phone}
            leftIcon="call-outline"
            keyboardType="phone-pad"
          />

          <Input
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Source Picker */}
          <View style={styles.fieldMargin}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Origem</Text>
            <TouchableOpacity
              onPress={() => setShowSourcePicker(true)}
              style={[styles.pickerButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Ionicons name="megaphone-outline" size={20} color={colors.textSecondary} style={styles.pickerIcon} />
              <Text style={[styles.pickerText, { color: colors.text }]}>{selectedSourceLabel}</Text>
              <Ionicons name="chevron-down-outline" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <Input
            label="Detalhe da origem"
            value={sourceDetail}
            onChangeText={setSourceDetail}
            leftIcon="information-circle-outline"
          />

          {/* Area Picker */}
          <View style={styles.fieldMargin}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Area de interesse *</Text>
            <TouchableOpacity
              onPress={() => setShowAreaPicker(true)}
              style={[
                styles.pickerButton,
                { borderColor: errors.area ? colors.error : colors.border, backgroundColor: colors.surface },
              ]}
            >
              <Ionicons name="briefcase-outline" size={20} color={colors.textSecondary} style={styles.pickerIcon} />
              <Text style={[styles.pickerText, { color: selectedAreaLabel ? colors.text : colors.placeholder }]}>
                {selectedAreaLabel || 'Selecionar area'}
              </Text>
              <Ionicons name="chevron-down-outline" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
            {errors.area && <Text style={[styles.errorText, { color: colors.error }]}>{errors.area}</Text>}
          </View>

          <Input
            label="Descricao"
            value={description}
            onChangeText={setDescription}
            leftIcon="document-text-outline"
            multiline
            numberOfLines={3}
          />

          <Input
            label="Valor estimado"
            value={estimatedValue}
            onChangeText={setEstimatedValue}
            leftIcon="cash-outline"
            keyboardType="numeric"
            maskType="currency"
          />

          <View style={styles.buttons}>
            <Button
              title="Cancelar"
              onPress={() => router.back()}
              variant="outline"
              size="lg"
              style={styles.cancelButton}
            />
            <Button
              title="Salvar"
              onPress={handleSave}
              variant="primary"
              size="lg"
              loading={saving}
              style={styles.saveButton}
            />
          </View>
        </View>
      </View>

      {/* Source Picker Modal */}
      <Modal visible={showSourcePicker} transparent animationType="fade" onRequestClose={() => setShowSourcePicker(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowSourcePicker(false)}>
          <Pressable style={[styles.modal, Shadows.lg, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Origem do Lead</Text>
            <FlatList
              data={LEAD_SOURCES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, source === item.value && { backgroundColor: colors.primaryLight + '20' }]}
                  onPress={() => {
                    setSource(item.value);
                    setShowSourcePicker(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }]}>{item.label}</Text>
                  {source === item.value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Area Picker Modal */}
      <Modal visible={showAreaPicker} transparent animationType="fade" onRequestClose={() => setShowAreaPicker(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowAreaPicker(false)}>
          <Pressable style={[styles.modal, Shadows.lg, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Area de Interesse</Text>
            <FlatList
              data={LEGAL_AREAS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, area === item.value && { backgroundColor: colors.primaryLight + '20' }]}
                  onPress={() => {
                    setArea(item.value);
                    setShowAreaPicker(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }]}>{item.label}</Text>
                  {area === item.value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: '700',
  },
  form: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  fieldMargin: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: Typography.xs,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 56,
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
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modal: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  modalItemText: {
    fontSize: Typography.md,
  },
});
