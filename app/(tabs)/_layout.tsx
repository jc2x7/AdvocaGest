import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/store/ThemeContext';
import {
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
} from '../../src/constants/theme';

interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
}

function TabIcon({ name, color, size }: TabIconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}

interface FABAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const FAB_ACTIONS: FABAction[] = [
  {
    id: 'new-client',
    label: 'Novo Cliente',
    icon: 'person-add-outline',
    route: '/(tabs)/clients/new',
  },
  {
    id: 'new-case',
    label: 'Novo Processo',
    icon: 'folder-open-outline',
    route: '/(tabs)/cases/new',
  },
  {
    id: 'new-appointment',
    label: 'Novo Compromisso',
    icon: 'calendar-outline',
    route: '/(tabs)/appointments/new',
  },
  {
    id: 'new-revenue',
    label: 'Nova Receita',
    icon: 'cash-outline',
    route: '/(tabs)/financial/new',
  },
];

export default function TabsLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [fabOpen, setFabOpen] = useState(false);

  const handleFabAction = useCallback(
    (route: string) => {
      setFabOpen(false);
      router.push(route as `/${string}`);
    },
    [router],
  );

  const toggleFab = useCallback(() => {
    setFabOpen((prev) => !prev);
  }, []);

  const closeFab = useCallback(() => {
    setFabOpen(false);
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: Spacing.xs,
          },
          tabBarLabelStyle: {
            fontSize: Typography.xs,
            fontWeight: Typography.fontWeight.medium,
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="grid-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="cases"
          options={{
            title: 'Processos',
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="folder-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="fab-placeholder"
          options={{
            title: '',
            tabBarButton: () => (
              <View style={styles.fabWrapper}>
                <TouchableOpacity
                  onPress={toggleFab}
                  activeOpacity={0.8}
                  style={[
                    styles.fabButton,
                    { backgroundColor: colors.primary },
                    Shadows.lg,
                  ]}
                >
                  <Ionicons
                    name={fabOpen ? 'close' : 'add'}
                    size={28}
                    color="#ffffff"
                  />
                </TouchableOpacity>
              </View>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
            },
          }}
        />
        <Tabs.Screen
          name="financial"
          options={{
            title: 'Financeiro',
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="wallet-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: 'Menu',
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="menu-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs>

      <Modal
        visible={fabOpen}
        transparent
        animationType="fade"
        onRequestClose={closeFab}
      >
        <Pressable style={styles.modalOverlay} onPress={closeFab}>
          <View
            style={[
              styles.fabMenu,
              {
                backgroundColor: colors.surface,
                bottom: 80 + insets.bottom,
              },
              Shadows.lg,
            ]}
          >
            {FAB_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                onPress={() => handleFabAction(action.route)}
                style={[
                  styles.fabMenuItem,
                  { borderBottomColor: colors.borderLight },
                ]}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.fabMenuIcon,
                    { backgroundColor: colors.primaryLight + '20' },
                  ]}
                >
                  <Ionicons
                    name={action.icon}
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.fabMenuLabel, { color: colors.text }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    top: -14,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  fabMenu: {
    position: 'absolute',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    width: Dimensions.get('window').width - Spacing.xl * 2,
    alignSelf: 'center',
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fabMenuIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  fabMenuLabel: {
    fontSize: Typography.md,
    fontWeight: Typography.fontWeight.medium,
  },
});
