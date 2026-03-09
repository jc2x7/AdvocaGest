import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { Client, ClientType } from '../../types/client';

interface ClientCardProps {
  client: Client;
  onPress?: (client: Client) => void;
}

function getTypeLabel(type: ClientType): string {
  return type === 'PF' ? 'Pessoa Fisica' : 'Pessoa Juridica';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function ClientCard({ client, onPress }: ClientCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }, Shadows.sm]}
      onPress={() => onPress?.(client)}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{getInitials(client.fullName)}</Text>
        </View>

        <View style={styles.content}>
          <Text
            style={[styles.name, { color: colors.text }]}
            numberOfLines={1}
          >
            {client.fullName}
          </Text>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor:
                    client.type === 'PF'
                      ? colors.infoLight
                      : colors.warningLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.typeText,
                  {
                    color:
                      client.type === 'PF' ? colors.info : colors.warning,
                  },
                ]}
              >
                {client.type}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons
                name="call-outline"
                size={12}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.metaText, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {client.phone}
              </Text>
            </View>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textTertiary}
        />
      </View>

      <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
        <View style={styles.stat}>
          <Ionicons
            name="briefcase-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {client.activeCasesCount} processo{client.activeCasesCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.stat}>
          <Ionicons
            name="cash-outline"
            size={14}
            color={colors.success}
          />
          <Text style={[styles.statText, { color: colors.success }]}>
            {formatCurrency(client.totalRevenue)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: Typography.md,
    fontWeight: Typography.fontWeight.bold,
  },
  content: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  name: {
    fontSize: Typography.md,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Typography.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: Typography.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});
