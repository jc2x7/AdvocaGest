import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { LegalCase, CaseRole } from '../../types/case';

interface Party {
  id: string;
  name: string;
  role: string;
  document?: string;
  lawyer?: string;
  contact?: string;
}

interface CasePartiesTabProps {
  legalCase: LegalCase;
  additionalParties?: Party[];
}

const ROLE_LABELS: Record<CaseRole, string> = {
  author: 'Autor',
  defendant: 'Reu',
  third_party: 'Terceiro',
  assistant: 'Assistente',
};

export default function CasePartiesTab({
  legalCase,
  additionalParties = [],
}: CasePartiesTabProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.section, { backgroundColor: colors.card }, Shadows.sm]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Cliente ({ROLE_LABELS[legalCase.role]})
          </Text>
        </View>
        <View style={styles.partyCard}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {legalCase.clientName.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.partyInfo}>
            <Text style={[styles.partyName, { color: colors.text }]}>
              {legalCase.clientName}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.successLight }]}>
              <Text style={[styles.roleText, { color: colors.success }]}>
                {ROLE_LABELS[legalCase.role]}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }, Shadows.sm]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="people-outline" size={18} color={colors.error} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Parte Adversa
          </Text>
        </View>
        <View style={styles.partyCard}>
          <View style={[styles.avatar, { backgroundColor: colors.error }]}>
            <Text style={styles.avatarText}>
              {legalCase.opposingParty.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.partyInfo}>
            <Text style={[styles.partyName, { color: colors.text }]}>
              {legalCase.opposingParty}
            </Text>
            {legalCase.opposingLawyer ? (
              <View style={styles.lawyerRow}>
                <Ionicons name="briefcase-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.lawyerText, { color: colors.textSecondary }]}>
                  Adv.: {legalCase.opposingLawyer}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {legalCase.judge ? (
        <View style={[styles.section, { backgroundColor: colors.card }, Shadows.sm]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="hammer-outline" size={18} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Juiz
            </Text>
          </View>
          <View style={styles.partyCard}>
            <View style={[styles.avatar, { backgroundColor: colors.warning }]}>
              <Ionicons name="hammer" size={18} color="#ffffff" />
            </View>
            <View style={styles.partyInfo}>
              <Text style={[styles.partyName, { color: colors.text }]}>
                {legalCase.judge}
              </Text>
              <Text style={[styles.courtText, { color: colors.textSecondary }]}>
                {legalCase.court} - {legalCase.branch}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {additionalParties.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card }, Shadows.sm]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-circle-outline" size={18} color={colors.info} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Outras Partes
            </Text>
          </View>
          {additionalParties.map((party) => (
            <View
              key={party.id}
              style={[styles.partyCard, styles.additionalParty, { borderBottomColor: colors.borderLight }]}
            >
              <View style={[styles.avatar, { backgroundColor: colors.info }]}>
                <Text style={styles.avatarText}>
                  {party.name.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.partyInfo}>
                <Text style={[styles.partyName, { color: colors.text }]}>
                  {party.name}
                </Text>
                <Text style={[styles.partyRole, { color: colors.textSecondary }]}>
                  {party.role}
                </Text>
                {party.lawyer ? (
                  <View style={styles.lawyerRow}>
                    <Ionicons name="briefcase-outline" size={12} color={colors.textTertiary} />
                    <Text style={[styles.lawyerText, { color: colors.textTertiary }]}>
                      Adv.: {party.lawyer}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
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
  section: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  partyCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  additionalParty: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  partyInfo: {
    flex: 1,
  },
  partyName: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  roleText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  lawyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  lawyerText: {
    fontSize: Typography.xs,
  },
  courtText: {
    fontSize: Typography.xs,
  },
  partyRole: {
    fontSize: Typography.xs,
    marginBottom: 2,
  },
});
