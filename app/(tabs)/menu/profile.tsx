import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/store/ThemeContext';
import { useAuth } from '../../../src/store/AuthContext';
import KeyboardWrapper from '../../../src/components/layout/KeyboardWrapper';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import Avatar from '../../../src/components/ui/Avatar';
import { BorderRadius, Shadows, Spacing, Typography } from '../../../src/constants/theme';

const AREAS_OF_PRACTICE = [
  'Direito Civil',
  'Direito Penal',
  'Direito Trabalhista',
  'Direito Tributario',
  'Direito Empresarial',
  'Direito de Familia',
  'Direito do Consumidor',
  'Direito Administrativo',
  'Direito Ambiental',
  'Direito Imobiliario',
  'Direito Digital',
  'Direito Previdenciario',
  'Direito Internacional',
  'Direito Eleitoral',
  'Propriedade Intelectual',
];

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [oabNumber, setOabNumber] = useState(user?.oabNumber ?? '');
  const [oabState, setOabState] = useState(user?.oabState ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [areasOfPractice, setAreasOfPractice] = useState<string[]>(user?.areasOfPractice ?? []);
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(user?.profilePhoto);
  const [signatureImage, setSignatureImage] = useState<string | undefined>(user?.signatureImage);
  const [saving, setSaving] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showAreasPicker, setShowAreasPicker] = useState(false);

  const pickImage = useCallback(async (type: 'profile' | 'signature') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permissao necessaria', 'Precisamos de acesso a galeria para selecionar a imagem.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'profile' ? [1, 1] : [3, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'profile') {
        setProfilePhoto(result.assets[0].uri);
      } else {
        setSignatureImage(result.assets[0].uri);
      }
    }
  }, []);

  const toggleArea = useCallback((area: string) => {
    setAreasOfPractice((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome e obrigatorio.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        oabNumber,
        oabState,
        bio: bio.trim() || undefined,
        areasOfPractice,
        profilePhoto,
        signatureImage,
      });
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso.');
    } catch {
      Alert.alert('Erro', 'Nao foi possivel atualizar o perfil.');
    } finally {
      setSaving(false);
    }
  }, [name, oabNumber, oabState, bio, areasOfPractice, profilePhoto, signatureImage, updateProfile]);

  return (
    <KeyboardWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.photoSection}>
          <TouchableOpacity
            style={styles.photoWrapper}
            onPress={() => pickImage('profile')}
            activeOpacity={0.7}
          >
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
            ) : (
              <Avatar name={name || 'U'} size="lg" />
            )}
            <View style={[styles.cameraIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={16} color="#ffffff" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.photoHint, { color: colors.textSecondary }]}>
            Toque para alterar a foto
          </Text>
        </View>

        <Input
          label="Nome completo"
          value={name}
          onChangeText={setName}
          leftIcon="person-outline"
        />

        <Input
          label="Numero OAB"
          value={oabNumber}
          onChangeText={setOabNumber}
          leftIcon="card-outline"
          maskType="oab"
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[
            styles.pickerTrigger,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
          onPress={() => setShowStatePicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
          <View style={styles.pickerContent}>
            <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>
              Estado (Seccional OAB)
            </Text>
            <Text style={[styles.pickerValue, { color: oabState ? colors.text : colors.placeholder }]}>
              {oabState || 'Selecione o estado'}
            </Text>
          </View>
          <Ionicons name="chevron-down-outline" size={16} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.pickerTrigger,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
          onPress={() => setShowAreasPicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="briefcase-outline" size={20} color={colors.textSecondary} />
          <View style={styles.pickerContent}>
            <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>
              Areas de atuacao
            </Text>
            <Text
              style={[styles.pickerValue, { color: areasOfPractice.length > 0 ? colors.text : colors.placeholder }]}
              numberOfLines={1}
            >
              {areasOfPractice.length > 0
                ? `${areasOfPractice.length} area(s) selecionada(s)`
                : 'Selecione as areas'}
            </Text>
          </View>
          <Ionicons name="chevron-down-outline" size={16} color={colors.textTertiary} />
        </TouchableOpacity>

        {areasOfPractice.length > 0 && (
          <View style={styles.selectedAreas}>
            {areasOfPractice.map((area) => (
              <View
                key={area}
                style={[styles.areaChip, { backgroundColor: `${colors.primary}15` }]}
              >
                <Text style={[styles.areaChipText, { color: colors.primary }]}>{area}</Text>
                <TouchableOpacity onPress={() => toggleArea(area)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Input
          label="Bio / Descricao profissional"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          leftIcon="document-text-outline"
        />

        <View style={styles.signatureSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Assinatura</Text>
          <TouchableOpacity
            style={[
              styles.signatureBox,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
            onPress={() => pickImage('signature')}
            activeOpacity={0.7}
          >
            {signatureImage ? (
              <Image source={{ uri: signatureImage }} style={styles.signaturePreview} resizeMode="contain" />
            ) : (
              <View style={styles.signaturePlaceholder}>
                <Ionicons name="pencil-outline" size={32} color={colors.textTertiary} />
                <Text style={[styles.signatureHint, { color: colors.textTertiary }]}>
                  Toque para adicionar imagem da assinatura
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Button
          title="Salvar Perfil"
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
        />

        <Modal visible={showStatePicker} transparent animationType="fade" onRequestClose={() => setShowStatePicker(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowStatePicker(false)}>
            <Pressable style={[styles.modalContent, Shadows.lg, { backgroundColor: colors.surface }]} onPress={() => {}}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Selecione o Estado</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                {BRAZILIAN_STATES.map((state) => (
                  <TouchableOpacity
                    key={state}
                    style={[
                      styles.modalOption,
                      oabState === state && { backgroundColor: `${colors.primary}15` },
                    ]}
                    onPress={() => {
                      setOabState(state);
                      setShowStatePicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        { color: oabState === state ? colors.primary : colors.text },
                      ]}
                    >
                      {state}
                    </Text>
                    {oabState === state && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={showAreasPicker} transparent animationType="fade" onRequestClose={() => setShowAreasPicker(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowAreasPicker(false)}>
            <Pressable style={[styles.modalContent, Shadows.lg, { backgroundColor: colors.surface }]} onPress={() => {}}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Areas de Atuacao</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                {AREAS_OF_PRACTICE.map((area) => {
                  const selected = areasOfPractice.includes(area);
                  return (
                    <TouchableOpacity
                      key={area}
                      style={[
                        styles.modalOption,
                        selected && { backgroundColor: `${colors.primary}15` },
                      ]}
                      onPress={() => toggleArea(area)}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          { color: selected ? colors.primary : colors.text },
                        ]}
                      >
                        {area}
                      </Text>
                      <Ionicons
                        name={selected ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={selected ? colors.primary : colors.textTertiary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <Button title="Confirmar" onPress={() => setShowAreasPicker(false)} style={styles.modalButton} />
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
  photoSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  photoWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: {
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    minHeight: 56,
    marginBottom: Spacing.md,
  },
  pickerContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  pickerLabel: {
    fontSize: Typography.xs,
    marginBottom: 2,
  },
  pickerValue: {
    fontSize: Typography.md,
  },
  selectedAreas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  areaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  areaChipText: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  signatureSection: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  signatureBox: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    borderStyle: 'dashed',
    minHeight: 100,
    overflow: 'hidden',
  },
  signaturePreview: {
    width: '100%',
    height: 100,
  },
  signaturePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  signatureHint: {
    fontSize: Typography.sm,
    marginTop: Spacing.sm,
  },
  saveButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
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
    maxHeight: '70%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: 2,
  },
  modalOptionText: {
    fontSize: Typography.md,
  },
  modalButton: {
    marginTop: Spacing.md,
  },
});
