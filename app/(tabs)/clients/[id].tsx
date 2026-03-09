import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Linking,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/store/ThemeContext';
import { useAuth } from '../../../src/store/AuthContext';
import Avatar from '../../../src/components/ui/Avatar';
import Badge from '../../../src/components/ui/Badge';
import Card from '../../../src/components/ui/Card';
import LoadingState from '../../../src/components/ui/LoadingState';
import ErrorState from '../../../src/components/ui/ErrorState';
import { getClientById } from '../../../src/services/firebase/clientService';
import { Client, ClientStatus } from '../../../src/types/client';
import { maskCPF, maskCNPJ, maskPhone } from '../../../src/utils/masks';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../src/constants/theme';

type TabKey = 'dados' | 'processos' | 'financeiro' | 'historico' | 'documentos';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabConfig[] = [
  { key: 'dados', label: 'Dados', icon: 'person-outline' },
  { key: 'processos', label: 'Processos', icon: 'briefcase-outline' },
  { key: 'financeiro', label: 'Financeiro', icon: 'wallet-outline' },
  { key: 'historico', label: 'Historico', icon: 'time-outline' },
  { key: 'documentos', label: 'Documentos', icon: 'document-outline' },
];

function getStatusBadgeVariant(status: ClientStatus): 'success' | 'neutral' | 'warning' {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'neutral';
    case 'prospect':
      return 'warning';
  }
}

function getStatusLabel(status: ClientStatus): string {
  switch (status) {
    case 'active':
      return 'Ativo';
    case 'inactive':
      return 'Inativo';
    case 'prospect':
      return 'Prospect';
  }
}

interface QuickActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color: string;
  bgColor: string;
}

function QuickActionButton({ icon, label, onPress, color, bgColor }: QuickActionButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={styles.quickAction}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.quickActionLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

function DadosTab({ client }: { client: Client }) {
  const { colors } = useTheme();

  return (
    <View style={styles.tabContent}>
      <Card style={styles.tabCard}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {client.type === 'PF' ? 'Dados Pessoais' : 'Dados da Empresa'}
        </Text>

        {client.type === 'PF' ? (
          <>
            <InfoRow label="Nome" value={client.fullName} />
            {client.cpf && <InfoRow label="CPF" value={maskCPF(client.cpf)} />}
            {client.rg && <InfoRow label="RG" value={client.rg} />}
            {client.birthDate && <InfoRow label="Nascimento" value={client.birthDate} />}
            {client.gender && <InfoRow label="Genero" value={client.gender} />}
            {client.maritalStatus && <InfoRow label="Estado Civil" value={client.maritalStatus} />}
            {client.profession && <InfoRow label="Profissao" value={client.profession} />}
          </>
        ) : (
          <>
            <InfoRow label="Razao Social" value={client.fullName} />
            {client.cnpj && <InfoRow label="CNPJ" value={maskCNPJ(client.cnpj)} />}
            {client.tradeName && <InfoRow label="Nome Fantasia" value={client.tradeName} />}
            {client.contactPerson && <InfoRow label="Contato" value={client.contactPerson} />}
          </>
        )}
      </Card>

      <Card style={styles.tabCard}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Contato
        </Text>
        {client.email && <InfoRow label="E-mail" value={client.email} />}
        <InfoRow label="Telefone" value={maskPhone(client.phone)} />
        {client.phone2 && <InfoRow label="Telefone 2" value={maskPhone(client.phone2)} />}
      </Card>

      {client.address && (
        <Card style={styles.tabCard}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Endereco
          </Text>
          <InfoRow
            label="Logradouro"
            value={`${client.address.street}${client.address.number ? `, ${client.address.number}` : ''}`}
          />
          {client.address.complement && (
            <InfoRow label="Complemento" value={client.address.complement} />
          )}
          <InfoRow label="Bairro" value={client.address.neighborhood} />
          <InfoRow label="Cidade/UF" value={`${client.address.city}/${client.address.state}`} />
          <InfoRow label="CEP" value={client.address.cep} />
        </Card>
      )}

      {client.notes && (
        <Card style={styles.tabCard}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Observacoes
          </Text>
          <Text style={[styles.notesText, { color: colors.textSecondary }]}>
            {client.notes}
          </Text>
        </Card>
      )}

      {client.tags && client.tags.length > 0 && (
        <Card style={styles.tabCard}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Tags
          </Text>
          <View style={styles.tagsContainer}>
            {client.tags.map((tag) => (
              <View
                key={tag}
                style={[styles.tag, { backgroundColor: colors.surfaceVariant }]}
              >
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      )}
    </View>
  );
}

function PlaceholderTab({ title }: { title: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.placeholderTab}>
      <Ionicons name="construct-outline" size={48} color={colors.textTertiary} />
      <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
        {title} sera implementado em breve
      </Text>
    </View>
  );
}

export default function ClientProfileScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('dados');

  const loadClient = useCallback(async () => {
    if (!user || !id) return;
    try {
      setError(null);
      const data = await getClientById(user.uid, id);
      if (!data) {
        setError('Cliente nao encontrado');
        return;
      }
      setClient(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao carregar cliente';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadClient();
    setRefreshing(false);
  }, [loadClient]);

  const handleCall = useCallback(() => {
    if (!client) return;
    Linking.openURL(`tel:${client.phone}`);
  }, [client]);

  const handleWhatsApp = useCallback(() => {
    if (!client) return;
    const cleanPhone = client.phone.replace(/\D/g, '');
    const whatsappNumber = cleanPhone.length === 11 ? `55${cleanPhone}` : `55${cleanPhone}`;
    Linking.openURL(`https://wa.me/${whatsappNumber}`);
  }, [client]);

  const handleEmail = useCallback(() => {
    if (!client?.email) return;
    Linking.openURL(`mailto:${client.email}`);
  }, [client]);

  const handleEdit = useCallback(() => {
    if (!id) return;
    router.push(`/(tabs)/clients/edit/${id}`);
  }, [id, router]);

  const renderTabContent = useCallback(() => {
    if (!client) return null;

    switch (activeTab) {
      case 'dados':
        return <DadosTab client={client} />;
      case 'processos':
        return <PlaceholderTab title="Processos" />;
      case 'financeiro':
        return <PlaceholderTab title="Financeiro" />;
      case 'historico':
        return <PlaceholderTab title="Historico" />;
      case 'documentos':
        return <PlaceholderTab title="Documentos" />;
    }
  }, [client, activeTab]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState message="Carregando cliente..." />
      </View>
    );
  }

  if (error || !client) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorState
          message={error ?? 'Cliente nao encontrado'}
          onRetry={loadClient}
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: client.fullName,
          headerRight: () => (
            <TouchableOpacity
              onPress={handleEdit}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="create-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Avatar name={client.fullName} size="lg" />
          <Text style={[styles.headerName, { color: colors.text }]}>
            {client.fullName}
          </Text>
          <View style={styles.headerMeta}>
            <Badge
              label={getStatusLabel(client.status)}
              variant={getStatusBadgeVariant(client.status)}
            />
            <Badge
              label={client.type === 'PF' ? 'Pessoa Fisica' : 'Pessoa Juridica'}
              variant="info"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickActionButton
            icon="call-outline"
            label="Ligar"
            onPress={handleCall}
            color={colors.success}
            bgColor={colors.successLight}
          />
          <QuickActionButton
            icon="logo-whatsapp"
            label="WhatsApp"
            onPress={handleWhatsApp}
            color="#25D366"
            bgColor="#e8faf0"
          />
          <QuickActionButton
            icon="mail-outline"
            label="E-mail"
            onPress={handleEmail}
            color={colors.info}
            bgColor={colors.infoLight}
          />
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  {
                    borderBottomColor: isActive ? colors.primary : 'transparent',
                  },
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={isActive ? colors.primary : colors.textTertiary}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? colors.primary : colors.textTertiary,
                      fontWeight: isActive ? '600' : '400',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  headerName: {
    fontSize: Typography.xl,
    fontWeight: '700',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  headerMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  quickAction: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  tabsContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 2,
  },
  tabLabel: {
    fontSize: Typography.sm,
  },
  tabContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  tabCard: {
    marginBottom: 0,
  },
  cardTitle: {
    fontSize: Typography.md,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  infoLabel: {
    fontSize: Typography.sm,
    flex: 1,
  },
  infoValue: {
    fontSize: Typography.sm,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  notesText: {
    fontSize: Typography.sm,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  placeholderTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  placeholderText: {
    fontSize: Typography.sm,
    textAlign: 'center',
  },
});
