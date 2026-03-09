import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../store/ThemeContext';
import { BorderRadius, Shadows, Spacing, Typography } from '../../constants/theme';

interface FABMenuItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface FABMenuProps {
  items: FABMenuItem[];
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

export default function FABMenu({
  items,
  icon = 'add',
  color,
}: FABMenuProps) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const fabColor = color ?? colors.primary;

  const toggleMenu = () => {
    const toValue = open ? 0 : 1;
    setOpen(!open);
    Animated.spring(animation, {
      toValue,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleItemPress = (onPress: () => void) => {
    toggleMenu();
    onPress();
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={toggleMenu}
      >
        <Pressable style={styles.overlay} onPress={toggleMenu}>
          <View style={styles.menuContainer}>
            {items.map((item, index) => {
              const translateY = animation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              });
              const itemOpacity = animation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0, 1],
              });

              return (
                <Animated.View
                  key={item.key}
                  style={[
                    styles.menuItem,
                    {
                      opacity: itemOpacity,
                      transform: [{ translateY }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.menuItemContent,
                      {
                        backgroundColor: colors.surface,
                      },
                      Shadows.md,
                    ]}
                    onPress={() => handleItemPress(item.onPress)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.menuItemIcon,
                        { backgroundColor: fabColor },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color="#ffffff"
                      />
                    </View>
                    <Text
                      style={[
                        styles.menuItemLabel,
                        { color: colors.text },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      <View style={styles.fabWrapper}>
        <TouchableOpacity
          onPress={toggleMenu}
          activeOpacity={0.8}
          style={[
            styles.fab,
            Shadows.lg,
            { backgroundColor: fabColor },
          ]}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name={icon} size={28} color="#ffffff" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 100,
    paddingRight: Spacing.md,
  },
  menuContainer: {
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  menuItem: {
    marginBottom: Spacing.sm,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  menuItemLabel: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  fabWrapper: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.md,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
