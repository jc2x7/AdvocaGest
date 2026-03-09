import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/store/ThemeContext';
import KeyboardWrapper from '../../../../src/components/layout/KeyboardWrapper';
import Input from '../../../../src/components/ui/Input';
import Button from '../../../../src/components/ui/Button';
import DateTimePicker from '../../../../src/components/ui/DateTimePicker';
import { BorderRadius, Shadows, Spacing, Typography } from '../../../../src/constants/theme';

type CommunicationType = 'call' | 'whatsapp' | 'email' | 'in_person' | 'video';
type CommunicationDirection = 'incoming' | 'outgoing';

interface TypeOption {
  key: CommunicationType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  { key: 'call', label: 'Ligacao', icon: 'call', color: '#3b82f6' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', color: '#25d366' },
  { key: 'email', label: 'E-mail', icon: 'mail', color: '#ef4444' },
  { key: 'in_person', label: 'Presencial', icon: 'people', color: '#f59e0b' },
  { key: 'video', label: 'Video', icon: 'videocam', color: '#8b5cf6' },
];

interface MockClient {
  id: string;
  name: string;
}

const MOCK_CLIENTS: MockClient[] = [
  { id: '1', name: 'Joao Silva' },
  { id: '2', name: 'Maria Santos' },
  { id: '3', name: 'Pedro Oliveira' },
  { id: '4', name: 'Ana Costa' },
  { id: '5', name: 'Carlos Lima' },
  { id: '6', name: 'Fernanda Rocha' },
  { id: '7', name: 'Roberto Mendes' },
];

export default function NewCommunicationScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [selectedClient, setSelectedClient] = useState<MockClient | null>(null);
  const [type, setType] = useState<CommunicationType>('call');
  const [direction, setDirection] = useState<CommunicationDirection>('outgoing');
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [followUpDate, setFollowUpDate] = useState<Date | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const showDuration = type === 'call' || type === 'in_person' || type === 'video';

  const handleSave = useCallback(async () => {
    if (!selectedClient) {
      Alert.alert('Erro', 'Selecione um cliente.');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Erro', 'Informe o assunto da comunicacao.');
      return;
    }

    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      Alert.alert('Sucesso', 'Comunicacao registrada com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel salvar a comunicacao.');
    } finally {
      setSaving(false);
    }
  }, [selectedClient, subject, router]);

  return (
    <KeyboardWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Cliente</Text>

        <TouchableOpacity
          style={[styles.pickerTrigger, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={() => setShowClientPicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
          <Text
            style={[
              styles.pickerText,
              { color: selectedClient ? colors.text : colors.placeholder },
            ]}
          >
            {selectedClient?.name ?? 'Selecione um cliente'}
          </Text>
          <Ionicons name="chevron-down-outline" size={16} color={colors.textTertiary} />
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tipo</Text>

        <View style={styles.typeGrid}>
          {TYPE_OPTIONS.map((opt) => {
            const isSelected = type === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.typeOption,
                  {
                    backgroundColor: isSelected ? `${opt.color}15` : colors.surfaceVariant,
                    borderColor: isSelected ? opt.color : colors.border,
                  },
                ]}
                onPress={() => setType(opt.key)}
                activeOpacity={0.7}
              >
                <Ionicons name={opt.icon} size={20} color={isSelected ? opt.color : colors.textSecondary} />
                <Text
                  style={[
                    styles.typeLabel,
                    { color: isSelected ? opt.color : colors.textSecondary },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Direcao</Text>

        <View style={styles.directionRow}>
          <TouchableOpacity
            style={[
              styles.directionOption,
              {
                backgroundColor: direction === 'outgoing' ? `${colors.primary}15` : colors.surfaceVariant,
                borderColor: direction === 'outgoing' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setDirection('outgoing')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-up"
              size={18}
              color={direction === 'outgoing' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.directionLabel,
                { color: direction === 'outgoing' ? colors.primary : colors.textSecondary },
              ]}
            >
              Enviada
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.directionOption,
              {
                backgroundColor: direction === 'incoming' ? `${colors.success}15` : colors.surfaceVariant,
                borderColor: direction === 'incoming' ? colors.success : colors.border,
              },
            ]}
            onPress={() => setDirection('incoming')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-down"
              size={18}
              color={direction === 'incoming' ? colors.success : colors.textSecondary}
            />
            <Text
              style={[
                styles.directionLabel,
                { color: direction === 'incoming' ? colors.success : colors.textSecondary },
              ]}
            >
              Recebida
            </Text>
          </TouchableOpacity>
        </View>

        <Input
          label="Assunto"
          value={subject}
          onChangeText={setSubject}
          leftIcon="text-outline"
        />

        <Input
          label="Observacoes"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          leftIcon="create-outline"
        />

        {showDuration && (
          <Input
            label="Duracao (minutos)"
            value={durationMinutes}
            onChangeText={setDurationMinutes}
            keyboardType="numeric"
            leftIcon="timer-outline"
          />
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Data e hora</Text>

        <DateTimePicker
          value={dateTime}
          onChange={setDateTime}
          mode="datetime"
          label="Data/hora da comunicacao"
        />

        <View style={styles.followUpSection}>
          <TouchableOpacity
            style={styles.followUpToggle}
            onPress={() => {
              setShowFollowUp(!showFollowUp);
              if (!followUpDate) {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                setFollowUpDate(nextWeek);
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showFollowUp ? 'checkbox' : 'square-outline'}
              size={22}
              color={showFollowUp ? colors.primary : colors.textTertiary}
            />
            <Text style={[styles.followUpLabel, { color: colors.text }]}>
              Agendar follow-up
            </Text>
          </TouchableOpacity>

          {showFollowUp && followUpDate && (
            <View style={styles.followUpPicker}>
              <DateTimePicker
                value={followUpDate}
                onChange={setFollowUpDate}
                mode="date"
                label="Data do follow-up"
                minimumDate={new Date()}
              />
            </View>
          )}
        </View>

        <Button
          title="Registrar Comunicacao"
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
        />

        <Modal visible={showClientPicker} transparent animationType="fade" onRequestClose={() => setShowClientPicker(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowClientPicker(false)}>
            <Pressable style={[styles.modalContent, Shadows.lg, { backgroundColor: colors.surface }]} onPress={() => {}}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Selecionar Cliente</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                {MOCK_CLIENTS.map((client) => (
                  <TouchableOpacity
                    key={client.id}
                    style={[
                      styles.clientOption,
                      selectedClient?.id === client.id && { backgroundColor: `${colors.primary}15` },
                    ]}
                    onPress={() => {
                      setSelectedClient(client);
                      setShowClientPicker(false);
                    }}
                  >
                    <Ionicons
                      name="person-circle-outline"
                      size={24}
                      color={selectedClient?.id === client.id ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.clientName,
                        { color: selectedClient?.id === client.id ? colors.primary : colors.text },
                      ]}
                    >
                      {client.name}
                    </Text>
                    {selectedClient?.id === client.id && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
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
    gap: Spacing.sm,
  },
  pickerText: {
    flex: 1,
    fontSize: Typography.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  typeLabel: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  directionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  directionOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  directionLabel: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  followUpSection: {
    marginTop: Spacing.md,
  },
  followUpToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  followUpLabel: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  followUpPicker: {
    marginLeft: Spacing.lg,
  },
  saveButton: {
    marginTop: Spacing.lg,
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
  clientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: 2,
    gap: Spacing.sm,
  },
  clientName: {
    flex: 1,
    fontSize: Typography.md,
  },
});
