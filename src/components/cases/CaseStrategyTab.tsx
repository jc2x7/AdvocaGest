import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { LegalCase } from '../../types/case';

interface CaseStrategyTabProps {
  legalCase: LegalCase;
  onSaveStrategy?: (strategy: string) => void;
  isEditing?: boolean;
}

export default function CaseStrategyTab({
  legalCase,
  onSaveStrategy,
  isEditing: initialEditing = false,
}: CaseStrategyTabProps) {
  const { colors } = useTheme();
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [strategyText, setStrategyText] = useState(legalCase.strategy || '');

  const handleSave = () => {
    onSaveStrategy?.(strategyText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setStrategyText(legalCase.strategy || '');
    setIsEditing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.warningBanner, { backgroundColor: colors.warningLight }]}>
        <Ionicons name="lock-closed-outline" size={18} color={colors.warning} />
        <View style={styles.warningContent}>
          <Text style={[styles.warningTitle, { color: colors.warning }]}>
            Conteudo Sigiloso
          </Text>
          <Text style={[styles.warningText, { color: colors.textSecondary }]}>
            Estrategia processual protegida por sigilo profissional (art. 7o, II do Estatuto da OAB).
          </Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }, Shadows.sm]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Estrategia do Processo
          </Text>
          {!isEditing && onSaveStrategy && (
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="create-outline" size={16} color={colors.primary} />
              <Text style={[styles.editButtonText, { color: colors.primary }]}>
                Editar
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.border,
                },
              ]}
              value={strategyText}
              onChangeText={setStrategyText}
              multiline
              placeholder="Descreva a estrategia processual..."
              placeholderTextColor={colors.placeholder}
              textAlignVertical="top"
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surfaceVariant }]}
                onPress={handleCancel}
              >
                <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>
                  Salvar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : strategyText ? (
          <Text style={[styles.strategyText, { color: colors.text }]}>
            {strategyText}
          </Text>
        ) : (
          <View style={styles.emptyStrategy}>
            <Ionicons name="document-text-outline" size={32} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Nenhuma estrategia definida
            </Text>
            {onSaveStrategy && (
              <TouchableOpacity
                style={[styles.addButton, { borderColor: colors.primary }]}
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="add-outline" size={16} color={colors.primary} />
                <Text style={[styles.addButtonText, { color: colors.primary }]}>
                  Adicionar Estrategia
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }, Shadows.sm]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Informacoes do Processo
        </Text>
        <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            Parte Adversa
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {legalCase.opposingParty}
          </Text>
        </View>
        {legalCase.opposingLawyer && (
          <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Advogado Adverso
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {legalCase.opposingLawyer}
            </Text>
          </View>
        )}
        {legalCase.judge && (
          <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Juiz
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {legalCase.judge}
            </Text>
          </View>
        )}
        {legalCase.description && (
          <View style={styles.descriptionContainer}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Descricao
            </Text>
            <Text style={[styles.descriptionText, { color: colors.text }]}>
              {legalCase.description}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  warningBanner: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 2,
  },
  warningText: {
    fontSize: Typography.xs,
    lineHeight: 18,
  },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  editButtonText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  editContainer: {
    gap: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    minHeight: 200,
    fontSize: Typography.sm,
    lineHeight: 22,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  actionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  actionButtonText: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  strategyText: {
    fontSize: Typography.sm,
    lineHeight: 24,
  },
  emptyStrategy: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  addButtonText: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: Typography.sm,
    flex: 1,
  },
  infoValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
    textAlign: 'right',
  },
  descriptionContainer: {
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  descriptionText: {
    fontSize: Typography.sm,
    lineHeight: 22,
  },
});
