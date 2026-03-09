import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { formatDate } from '../../utils/dateUtils';
import { Client } from '../../types/client';

interface ClientDataTabProps {
  client: Client;
}

interface DataRowProps {
  label: string;
  value: string | undefined;
  icon: keyof typeof Ionicons.glyphMap;
}

function DataRow({ label, value, icon }: DataRowProps) {
  const { colors } = useTheme();

  if (!value) return null;

  return (
    <View style={[dataRowStyles.row, { borderBottomColor: colors.borderLight }]}>
      <View style={dataRowStyles.labelContainer}>
        <Ionicons name={icon} size={16} color={colors.textSecondary} />
        <Text style={[dataRowStyles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      </View>
      <Text style={[dataRowStyles.value, { color: colors.text }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const dataRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  label: {
    fontSize: Typography.sm,
  },
  value: {
    fontSize: Typography.sm,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
    textAlign: 'right',
  },
});

export default function ClientDataTab({ client }: ClientDataTabProps) {
  const { colors } = useTheme();

  const formatAddress = (): string | undefined => {
    if (!client.address) return undefined;
    const { street, number, complement, neighborhood, city, state, cep } =
      client.address;
    const parts = [
      `${street}, ${number}`,
      complement,
      neighborhood,
      `${city}/${state}`,
      cep,
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.section, { backgroundColor: colors.card }, Shadows.sm]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Dados Pessoais
        </Text>
        <DataRow label="Nome" value={client.fullName} icon="person-outline" />
        <DataRow
          label="Tipo"
          value={client.type === 'PF' ? 'Pessoa Fisica' : 'Pessoa Juridica'}
          icon="id-card-outline"
        />
        {client.type === 'PF' ? (
          <>
            <DataRow label="CPF" value={client.cpf} icon="card-outline" />
            <DataRow label="RG" value={client.rg} icon="card-outline" />
            <DataRow
              label="Nascimento"
              value={client.birthDate ? formatDate(client.birthDate) : undefined}
              icon="calendar-outline"
            />
            <DataRow label="Genero" value={client.gender} icon="people-outline" />
            <DataRow label="Estado Civil" value={client.maritalStatus} icon="heart-outline" />
            <DataRow label="Profissao" value={client.profession} icon="construct-outline" />
          </>
        ) : (
          <>
            <DataRow label="Razao Social" value={client.companyName} icon="business-outline" />
            <DataRow label="Nome Fantasia" value={client.tradeName} icon="storefront-outline" />
            <DataRow label="CNPJ" value={client.cnpj} icon="card-outline" />
            <DataRow label="Contato" value={client.contactPerson} icon="person-outline" />
          </>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }, Shadows.sm]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Contato
        </Text>
        <DataRow label="Telefone" value={client.phone} icon="call-outline" />
        <DataRow label="Telefone 2" value={client.phone2} icon="call-outline" />
        <DataRow label="E-mail" value={client.email} icon="mail-outline" />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }, Shadows.sm]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Endereco
        </Text>
        <DataRow label="Endereco" value={formatAddress()} icon="location-outline" />
      </View>

      {client.notes ? (
        <View style={[styles.section, { backgroundColor: colors.card }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Observacoes
          </Text>
          <Text style={[styles.notes, { color: colors.textSecondary }]}>
            {client.notes}
          </Text>
        </View>
      ) : null}

      {client.tags && client.tags.length > 0 ? (
        <View style={[styles.section, { backgroundColor: colors.card }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Tags
          </Text>
          <View style={styles.tagsContainer}>
            {client.tags.map((tag, index) => (
              <View
                key={`${tag}-${index}`}
                style={[styles.tag, { backgroundColor: colors.surfaceVariant }]}
              >
                <Text style={[styles.tagText, { color: colors.primary }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
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
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  notes: {
    fontSize: Typography.sm,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});
