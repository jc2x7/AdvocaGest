import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ListRenderItemInfo,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../src/store/ThemeContext';
import { Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import Button from '../../src/components/ui/Button';

const ONBOARDING_SEEN_KEY = '@advocagest:onboarding_seen';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'briefcase-outline',
    title: 'Gerencie seus processos',
    description:
      'Acompanhe todos os seus processos em um so lugar, com prazos, movimentacoes e documentos organizados.',
  },
  {
    id: '2',
    icon: 'calendar-outline',
    title: 'Controle sua agenda',
    description:
      'Nunca perca um compromisso. Receba lembretes de audiencias, reunioes e prazos importantes.',
  },
  {
    id: '3',
    icon: 'cash-outline',
    title: 'Financeiro integrado',
    description:
      'Controle honorarios, despesas e receitas. Tenha uma visao completa da saude financeira do seu escritorio.',
  },
  {
    id: '4',
    icon: 'people-outline',
    title: 'Gestao de clientes',
    description:
      'Mantenha o cadastro completo dos seus clientes com historico de processos e comunicacoes.',
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const markAsSeen = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
    } catch {
      // Silently fail
    }
  }, []);

  const handleSkip = useCallback(async () => {
    await markAsSeen();
    router.replace('/(auth)/login');
  }, [markAsSeen, router]);

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  }, [currentIndex]);

  const handleGetStarted = useCallback(async () => {
    await markAsSeen();
    router.replace('/(auth)/login');
  }, [markAsSeen, router]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const renderSlide = useCallback(
    ({ item }: ListRenderItemInfo<OnboardingSlide>) => (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.primaryLight + '20' },
          ]}
        >
          <Ionicons name={item.icon} size={64} color={colors.primary} />
        </View>
        <Text style={[styles.slideTitle, { color: colors.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.slideDescription, { color: colors.textSecondary }]}>
          {item.description}
        </Text>
      </View>
    ),
    [colors],
  );

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        {!isLastSlide ? (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>
              Pular
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipButton} />
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      <View style={styles.bottomSection}>
        <View style={styles.dotsContainer}>
          {SLIDES.map((slide, index) => (
            <View
              key={slide.id}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex
                      ? colors.primary
                      : colors.disabled,
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonsContainer}>
          {isLastSlide ? (
            <Button
              title="Comecar"
              onPress={handleGetStarted}
              size="lg"
              style={styles.fullWidthButton}
            />
          ) : (
            <Button
              title="Proximo"
              onPress={handleNext}
              size="lg"
              style={styles.fullWidthButton}
              icon={
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#ffffff"
                />
              }
              iconPosition="right"
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  skipButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    fontSize: Typography.md,
    fontWeight: Typography.fontWeight.medium,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  slideTitle: {
    fontSize: Typography.xxl,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  slideDescription: {
    fontSize: Typography.md,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  bottomSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: BorderRadius.full,
  },
  buttonsContainer: {
    flexDirection: 'row',
  },
  fullWidthButton: {
    flex: 1,
  },
});
