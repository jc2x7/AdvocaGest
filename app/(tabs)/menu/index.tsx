import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/store/ThemeContext';
import { useAuth } from '../../../src/store/AuthContext';
import { BorderRadius, Shadows, Spacing, Typography } from '../../../src/constants/theme';
import Avatar from '../../../src/components/ui/Avatar';

interface MenuOption {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
}

const MENU_OPTIONS: MenuOption[] = [
  { key: 'clients', title: 'Clientes', icon: 'people-outline', route: '/(tabs)/clients', color: '#3b82f6' },
  { key: 'leads', title: 'Leads', icon: 'person-add-outline', route: '/(tabs)/menu/leads', color: '#8b5cf6' },
  { key: 'tasks', title: 'Tarefas', icon: 'checkbox-outline', route: '/(tabs)/menu/tasks', color: '#f59e0b' },
  { key: 'timesheet', title: 'Timesheet', icon: 'timer-outline', route: '/(tabs)/menu/timesheet', color: '#10b981' },
  { key: 'documents', title: 'Documentos', icon: 'document-text-outline', route: '/(tabs)/menu/documents', color: '#ef4444' },
  { key: 'communications', title: 'Comunicacoes', icon: 'chatbubbles-outline', route: '/(tabs)/menu/communications', color: '#06b6d4' },
  { key: 'reports', title: 'Relatorios', icon: 'bar-chart-outline', route: '/(tabs)/menu/reports', color: '#ec4899' },
  { key: 'settings', title: 'Configuracoes', icon: 'settings-outline', route: '/(tabs)/menu/settings', color: '#64748b' },
];

export default function MenuScreen() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleNavigate = (route: string) => {
    router.push(route as `/${string}`);
  };

  const renderMenuCard = ({ item }: { item: MenuOption }) => (
    <TouchableOpacity
      style={[
        styles.card,
        Shadows.md,
        {
          backgroundColor: colors.card,
          borderColor: colors.borderLight,
        },
      ]}
      activeOpacity={0.7}
      onPress={() => handleNavigate(item.route)}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
        <Ionicons name={item.icon} size={28} color={item.color} />
      </View>
      <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.profileSection, { backgroundColor: colors.card, borderColor: colors.borderLight }, Shadows.sm]}
          activeOpacity={0.7}
          onPress={() => handleNavigate('/(tabs)/menu/profile')}
        >
          <Avatar
            name={user?.name ?? 'Usuario'}
            uri={user?.profilePhoto}
            size="lg"
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user?.name ?? 'Usuario'}
            </Text>
            <Text style={[styles.profileOab, { color: colors.textSecondary }]}>
              OAB {user?.oabState ?? ''} {user?.oabNumber ?? ''}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        <FlatList
          data={MENU_OPTIONS}
          renderItem={renderMenuCard}
          keyExtractor={(item) => item.key}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.supportButton, { backgroundColor: colors.surfaceVariant }]}
            activeOpacity={0.7}
            onPress={() => handleNavigate('/(tabs)/menu/support')}
          >
            <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.supportText, { color: colors.textSecondary }]}>
              Suporte e FAQ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.errorLight }]}
            activeOpacity={0.7}
            onPress={signOut}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>
              Sair da conta
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileName: {
    fontSize: Typography.lg,
    fontWeight: '600',
  },
  profileOab: {
    fontSize: Typography.sm,
    marginTop: 2,
  },
  grid: {
    paddingBottom: Spacing.md,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  card: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: Typography.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomActions: {
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  supportText: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  logoutText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
});
