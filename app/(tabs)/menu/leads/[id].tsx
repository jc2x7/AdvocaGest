import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/store/ThemeContext';
import { useAuth } from '../../../../src/store/AuthContext';
import { Lead, LeadStage, LEAD_STAGES } from '../../../../src/types/lead';
import {
  getLeadById,
  updateLeadStage,
  updateLead,
  deleteLead,
} from '../../../../src/services/firebase/leadService';
import { createClient } from '../../../../src/services/firebase/clientService';
import { ClientFormData } from '../../../../src/types/client';
import { formatCurrency } from '../../../../src/utils/currency';
import { formatDate, getRelativeTime } from '../../../../src/utils/dateUtils';
import { maskPhone } from '../../../../src/utils/masks';
import LoadingState from '../../../../src/components/ui/LoadingState';
import ErrorState from '../../../../src/components/ui/ErrorState';
import Button from '../../../../src/components/ui/Button';
import Card from '../../../../src/components/ui/Card';
import Badge from '../../../../src/components/ui/Badge';
import ConfirmDialog from '../../../../src/components/ui/ConfirmDialog';
import { BorderRadius, Shadows, Spacing, Typography } from '../../../../src/constants/theme';

const ACTIVE_STAGES: LeadStage[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation'];

const LOSS_REASONS = [
  'Preco alto',
  'Contratou outro advogado',
  'Desistiu da acao',
  'Nao respondeu',
  'Fora do perfil',
  'Outro',
];

export default function LeadDetailScreen() {
  const { colors } = useTheme();
  const { user, officeData } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [converting, setConverting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);

  const fetchLead = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getLeadById(user.uid, id);
      if (!data) {
        setError('Lead nao encontrado');
        return;
      }
      setLead(data);
      setNotes(data.notes ?? '');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar lead';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const currentStageIndex = lead ? ACTIVE_STAGES.indexOf(lead.stage) : -1;
  const stageInfo = lead ? LEAD_STAGES.find((s) => s.value === lead.stage) : null;

  const handleAdvanceStage = useCallback(async () => {
    if (!user || !lead || currentStageIndex < 0 || currentStageIndex >= ACTIVE_STAGES.length - 1) return;
    try {
      const nextStage = ACTIVE_STAGES[currentStageIndex + 1];
      await updateLeadStage(user.uid, lead.id, nextStage);
      await fetchLead();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao avancar estagio';
      Alert.alert('Erro', message);
    }
  }, [user, lead, currentStageIndex, fetchLead]);

  const handleRetreatStage = useCallback(async () => {
    if (!user || !lead || currentStageIndex <= 0) return;
    try {
      const prevStage = ACTIVE_STAGES[currentStageIndex - 1];
      await updateLeadStage(user.uid, lead.id, prevStage);
      await fetchLead();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao retroceder estagio';
      Alert.alert('Erro', message);
    }
  }, [user, lead, currentStageIndex, fetchLead]);

  const handleMarkLost = useCallback(async () => {
    if (!user || !lead) return;
    const reason = lostReason === 'Outro' ? customReason : lostReason;
    if (!reason.trim()) {
      Alert.alert('Atencao', 'Informe o motivo da perda');
      return;
    }
    try {
      await updateLeadStage(user.uid, lead.id, 'lost', { lostReason: reason });
      setShowLostModal(false);
      await fetchLead();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao marcar como perdido';
      Alert.alert('Erro', message);
    }
  }, [user, lead, lostReason, customReason, fetchLead]);

  const handleConvertToClient = useCallback(async () => {
    if (!user || !lead) return;
    setConverting(true);
    try {
      const clientData: ClientFormData = {
        type: 'PF',
        status: 'active',
        fullName: lead.name,
        phone: lead.phone,
        email: lead.email,
        areasOfInterest: lead.area ? [lead.area] : [],
        notes: `Convertido de lead. ${lead.description ?? ''}`,
      };
      const clientId = await createClient(user.uid, clientData);
      await updateLeadStage(user.uid, lead.id, 'won', { convertedClientId: clientId });
      Alert.alert('Sucesso', 'Lead convertido em cliente!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao converter lead';
      Alert.alert('Erro', message);
    } finally {
      setConverting(false);
    }
  }, [user, lead, router]);

  const handleCall = useCallback(() => {
    if (!lead) return;
    Linking.openURL(`tel:${lead.phone}`);
  }, [lead]);

  const handleWhatsApp = useCallback(() => {
    if (!lead) return;
    const phone = lead.phone.replace(/\D/g, '');
    const fullPhone = phone.length <= 11 ? `55${phone}` : phone;
    Linking.openURL(`https://wa.me/${fullPhone}`);
  }, [lead]);

  const handleEmail = useCallback(() => {
    if (!lead?.email) return;
    Linking.openURL(`mailto:${lead.email}`);
  }, [lead]);

  const handleGenerateProposal = useCallback(() => {
    Alert.alert('Proposta', 'Funcionalidade de geracao de proposta em desenvolvimento');
  }, []);

  const handleSaveNotes = useCallback(async () => {
    if (!user || !lead) return;
    try {
      await updateLead(user.uid, lead.id, { notes });
      setShowNotesModal(false);
      await fetchLead();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar notas';
      Alert.alert('Erro', message);
    }
  }, [user, lead, notes, fetchLead]);

  const handleDelete = useCallback(async () => {
    if (!user || !lead) return;
    try {
      await deleteLead(user.uid, lead.id);
      setShowDeleteConfirm(false);
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir lead';
      Alert.alert('Erro', message);
    }
  }, [user, lead, router]);

  if (loading) {
    return <LoadingState message="Carregando lead..." />;
  }

  if (error || !lead) {
    return <ErrorState message={error ?? 'Lead nao encontrado'} onRetry={fetchLead} />;
  }

  const isActive = lead.stage !== 'won' && lead.stage !== 'lost';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {lead.name}
        </Text>
        <TouchableOpacity onPress={() => setShowDeleteConfirm(true)}>
          <Ionicons name="trash-outline" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stage Indicator */}
        <Card style={styles.cardMargin}>
          <View style={styles.stageRow}>
            {ACTIVE_STAGES.map((stage, idx) => {
              const info = LEAD_STAGES.find((s) => s.value === stage);
              const isCurrentOrPast = currentStageIndex >= idx;
              return (
                <View key={stage} style={styles.stageItem}>
                  <View
                    style={[
                      styles.stageDot,
                      {
                        backgroundColor: isCurrentOrPast ? (info?.color ?? colors.primary) : colors.border,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.stageLabel,
                      { color: isCurrentOrPast ? colors.text : colors.textTertiary },
                    ]}
                  >
                    {info?.label}
                  </Text>
                  {idx < ACTIVE_STAGES.length - 1 && (
                    <View
                      style={[
                        styles.stageLine,
                        { backgroundColor: currentStageIndex > idx ? (info?.color ?? colors.primary) : colors.border },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
          {isActive && (
            <View style={styles.stageActions}>
              <TouchableOpacity
                onPress={handleRetreatStage}
                disabled={currentStageIndex <= 0}
                style={[
                  styles.stageButton,
                  { backgroundColor: colors.surfaceVariant, opacity: currentStageIndex <= 0 ? 0.4 : 1 },
                ]}
              >
                <Ionicons name="arrow-back" size={16} color={colors.text} />
                <Text style={[styles.stageButtonText, { color: colors.text }]}>Retroceder</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAdvanceStage}
                disabled={currentStageIndex >= ACTIVE_STAGES.length - 1}
                style={[
                  styles.stageButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: currentStageIndex >= ACTIVE_STAGES.length - 1 ? 0.4 : 1,
                  },
                ]}
              >
                <Text style={[styles.stageButtonText, { color: '#ffffff' }]}>Avancar</Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}
          {!isActive && stageInfo && (
            <Badge
              label={stageInfo.label}
              variant={lead.stage === 'won' ? 'success' : 'error'}
              style={styles.finalBadge}
            />
          )}
        </Card>

        {/* Lead Info */}
        <Card style={styles.cardMargin}>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.text }]}>{maskPhone(lead.phone)}</Text>
          </View>
          {lead.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{lead.email}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.text }]}>{lead.area}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="megaphone-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {lead.source}
              {lead.sourceDetail ? ` - ${lead.sourceDetail}` : ''}
            </Text>
          </View>
          {lead.estimatedValue !== undefined && lead.estimatedValue > 0 && (
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={18} color={colors.success} />
              <Text style={[styles.infoText, { color: colors.success, fontWeight: '600' }]}>
                {formatCurrency(lead.estimatedValue)}
              </Text>
            </View>
          )}
          {lead.description && (
            <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
              <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} style={{ marginTop: 2 }} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>{lead.description}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={colors.textTertiary} />
            <Text style={[styles.infoText, { color: colors.textTertiary }]}>
              Criado {getRelativeTime(lead.createdAt)}
            </Text>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.infoLight }]}
            onPress={handleCall}
          >
            <Ionicons name="call" size={22} color={colors.info} />
            <Text style={[styles.quickActionText, { color: colors.info }]}>Ligar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: '#dcfce7' }]}
            onPress={handleWhatsApp}
          >
            <Ionicons name="logo-whatsapp" size={22} color="#16a34a" />
            <Text style={[styles.quickActionText, { color: '#16a34a' }]}>WhatsApp</Text>
          </TouchableOpacity>
          {lead.email && (
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.warningLight }]}
              onPress={handleEmail}
            >
              <Ionicons name="mail" size={22} color={colors.warning} />
              <Text style={[styles.quickActionText, { color: colors.warning }]}>E-mail</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notes */}
        <Card style={styles.cardMargin}>
          <TouchableOpacity
            onPress={() => setShowNotesModal(true)}
            style={styles.notesHeader}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
            <Text style={[styles.notesTitle, { color: colors.text }]}>Notas / Historico</Text>
            <Ionicons name="create-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          {lead.notes ? (
            <Text style={[styles.notesContent, { color: colors.textSecondary }]}>
              {lead.notes}
            </Text>
          ) : (
            <Text style={[styles.notesContent, { color: colors.textTertiary, fontStyle: 'italic' }]}>
              Toque para adicionar notas
            </Text>
          )}
        </Card>

        {/* Action Buttons */}
        {isActive && (
          <View style={styles.actionButtons}>
            <Button
              title="Converter em Cliente"
              onPress={handleConvertToClient}
              variant="primary"
              size="lg"
              loading={converting}
              icon={<Ionicons name="person-add-outline" size={18} color="#ffffff" />}
              style={styles.fullButton}
            />
            <Button
              title="Gerar Proposta"
              onPress={handleGenerateProposal}
              variant="outline"
              size="lg"
              icon={<Ionicons name="document-outline" size={18} color={colors.primary} />}
              style={styles.fullButton}
            />
            <Button
              title="Marcar como Perdido"
              onPress={() => setShowLostModal(true)}
              variant="danger"
              size="lg"
              icon={<Ionicons name="close-circle-outline" size={18} color="#ffffff" />}
              style={styles.fullButton}
            />
          </View>
        )}

        {lead.stage === 'lost' && lead.lostReason && (
          <Card style={styles.cardMargin}>
            <View style={styles.infoRow}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
              <Text style={[styles.infoText, { color: colors.error }]}>
                Motivo: {lead.lostReason}
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Lost Reason Modal */}
      <Modal visible={showLostModal} transparent animationType="fade" onRequestClose={() => setShowLostModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowLostModal(false)}>
          <Pressable style={[styles.modal, Shadows.lg, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Motivo da Perda</Text>
            {LOSS_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonItem,
                  lostReason === reason && { backgroundColor: colors.errorLight },
                ]}
                onPress={() => setLostReason(reason)}
              >
                <Text style={[styles.reasonText, { color: colors.text }]}>{reason}</Text>
                {lostReason === reason && (
                  <Ionicons name="checkmark" size={20} color={colors.error} />
                )}
              </TouchableOpacity>
            ))}
            {lostReason === 'Outro' && (
              <TextInput
                value={customReason}
                onChangeText={setCustomReason}
                placeholder="Descreva o motivo..."
                placeholderTextColor={colors.placeholder}
                style={[
                  styles.customInput,
                  { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                ]}
                multiline
              />
            )}
            <View style={styles.modalActions}>
              <Button title="Cancelar" onPress={() => setShowLostModal(false)} variant="secondary" size="md" />
              <Button title="Confirmar" onPress={handleMarkLost} variant="danger" size="md" />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Notes Modal */}
      <Modal visible={showNotesModal} transparent animationType="fade" onRequestClose={() => setShowNotesModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowNotesModal(false)}>
          <Pressable style={[styles.modal, Shadows.lg, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Notas</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Adicione notas sobre o lead..."
              placeholderTextColor={colors.placeholder}
              style={[
                styles.notesInput,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant },
              ]}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <Button title="Cancelar" onPress={() => setShowNotesModal(false)} variant="secondary" size="md" />
              <Button title="Salvar" onPress={handleSaveNotes} variant="primary" size="md" />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Excluir Lead"
        message={`Deseja realmente excluir o lead "${lead.name}"? Esta acao nao pode ser desfeita.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        destructive
      />
    </View>
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
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  cardMargin: {
    marginBottom: Spacing.md,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  stageItem: {
    alignItems: 'center',
    flex: 1,
  },
  stageDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 4,
  },
  stageLabel: {
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
  },
  stageLine: {
    position: 'absolute',
    top: 7,
    left: '60%',
    right: '-60%',
    height: 2,
    zIndex: -1,
  },
  stageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  stageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  stageButtonText: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  finalBadge: {
    alignSelf: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.sm,
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  quickActionText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  notesTitle: {
    fontSize: Typography.sm,
    fontWeight: '600',
    flex: 1,
  },
  notesContent: {
    fontSize: Typography.sm,
    lineHeight: 20,
  },
  actionButtons: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  fullButton: {
    width: '100%',
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
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  reasonText: {
    fontSize: Typography.md,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sm,
    marginTop: Spacing.sm,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sm,
    minHeight: 120,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
});
