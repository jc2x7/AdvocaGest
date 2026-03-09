import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/store/ThemeContext';
import { useAuth } from '../../../src/store/AuthContext';
import SearchBar from '../../../src/components/ui/SearchBar';
import FilterChips from '../../../src/components/ui/FilterChips';
import LoadingState from '../../../src/components/ui/LoadingState';
import EmptyState from '../../../src/components/ui/EmptyState';
import ErrorState from '../../../src/components/ui/ErrorState';
import Badge from '../../../src/components/ui/Badge';
import Avatar from '../../../src/components/ui/Avatar';
import Card from '../../../src/components/ui/Card';
import { getClients } from '../../../src/services/firebase/clientService';
import { Client, ClientStatus } from '../../../src/types/client';
import { maskCPF, maskCNPJ } from '../../../src/utils/masks';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../src/constants/theme';

const ITEM_HEIGHT = 88;

const STATUS_FILTER_OPTIONS = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Ativos' },
  { key: 'inactive', label: 'Inativos' },
  { key: 'prospect', label: 'Prospects' },
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

interface ClientCardProps {
  client: Client;
  onPress: () => void;
}

function ClientCard({ client, onPress }: ClientCardProps) {
  const { colors } = useTheme();

  const documentLabel = useMemo(() => {
    if (client.type === 'PJ' && client.cnpj) {
      return maskCNPJ(client.cnpj);
    }
    if (client.cpf) {
      return maskCPF(client.cpf);
    }
    return null;
  }, [client.type, client.cnpj, client.cpf]);

  return (
    <Card onPress={onPress} style={styles.clientCard}>
      <View style={styles.clientCardContent}>
        <Avatar name={client.fullName} size="md" />
        <View style={styles.clientInfo}>
          <Text
            style={[styles.clientName, { color: colors.text }]}
            numberOfLines={1}
          >
            {client.fullName}
          </Text>
          <View style={styles.clientMeta}>
            {documentLabel && (
              <Text
                style={[styles.clientDocument, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {documentLabel}
              </Text>
            )}
            <Badge
              label={getStatusLabel(client.status)}
              variant={getStatusBadgeVariant(client.status)}
            />
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textTertiary}
        />
      </View>
    </Card>
  );
}

export default function ClientListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadClients = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const data = await getClients(user.uid);
      setClients(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao carregar clientes';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  }, [loadClients]);

  const filteredClients = useMemo(() => {
    let result = clients;

    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (searchQuery.trim().length > 0) {
      const lowerQuery = searchQuery.toLowerCase();
      const rawQuery = searchQuery.replace(/\D/g, '');
      result = result.filter((c) => {
        const nameMatch = c.fullName.toLowerCase().includes(lowerQuery);
        const cpfMatch = c.cpf ? c.cpf.includes(rawQuery) : false;
        const cnpjMatch = c.cnpj ? c.cnpj.includes(rawQuery) : false;
        return nameMatch || cpfMatch || cnpjMatch;
      });
    }

    return result;
  }, [clients, statusFilter, searchQuery]);

  const handleClientPress = useCallback(
    (clientId: string) => {
      router.push(`/(tabs)/clients/${clientId}`);
    },
    [router]
  );

  const handleAddClient = useCallback(() => {
    router.push('/(tabs)/clients/new');
  }, [router]);

  const renderClient = useCallback(
    ({ item }: ListRenderItemInfo<Client>) => (
      <ClientCard
        client={item}
        onPress={() => handleClientPress(item.id)}
      />
    ),
    [handleClientPress]
  );

  const keyExtractor = useCallback((item: Client) => item.id, []);

  const getItemLayout = useCallback(
    (_data: ArrayLike<Client> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState message="Carregando clientes..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorState message={error} onRetry={loadClients} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por nome, CPF ou CNPJ..."
        />
      </View>

      <FilterChips
        options={STATUS_FILTER_OPTIONS}
        selectedKey={statusFilter}
        onSelect={setStatusFilter}
      />

      <FlatList
        data={filteredClients}
        renderItem={renderClient}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        contentContainerStyle={[
          styles.listContent,
          filteredClients.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Nenhum cliente encontrado"
            message={
              searchQuery || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Cadastre seu primeiro cliente para comecar'
            }
            actionLabel={
              searchQuery || statusFilter !== 'all' ? undefined : 'Adicionar Cliente'
            }
            onAction={
              searchQuery || statusFilter !== 'all' ? undefined : handleAddClient
            }
          />
        }
        removeClippedSubviews
        maxToRenderPerBatch={15}
        windowSize={10}
        initialNumToRender={10}
      />

      <TouchableOpacity
        style={[styles.fab, Shadows.lg, { backgroundColor: colors.primary }]}
        onPress={handleAddClient}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
    gap: Spacing.sm,
  },
  emptyList: {
    flex: 1,
  },
  clientCard: {
    marginBottom: 0,
  },
  clientCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: Typography.md,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  clientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  clientDocument: {
    fontSize: Typography.xs,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
