import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Truck, Navigation, Award, ArrowRight } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import Button from '../components/Button';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Become a Logistics Partner',
    desc: 'Accept delivery requests, manage cargo types, and earn on a daily schedule.',
    Icon: Truck,
    iconColor: COLORS.accent,
    bgColor: '#EFF6FF',
  },
  {
    title: 'Smart Navigation',
    desc: 'Navigate efficiently with integrated mapping overlays and real-time socket tracking.',
    Icon: Navigation,
    iconColor: COLORS.blue,
    bgColor: '#FFFBEB',
  },
  {
    title: 'Weekly Earnings',
    desc: 'Track completed trips, earnings, rating incentives, and request payouts instantly.',
    Icon: Award,
    iconColor: COLORS.success,
    bgColor: '#ECFDF5',
  },
  {
    title: 'Ready to Drive?',
    desc: 'Upload your documents, wait for compliance approval, and hit the road to start earning.',
    Icon: Truck,
    iconColor: COLORS.primary,
    bgColor: '#F3F4F6',
  },
];

interface OnboardingProps {
  onFinish: () => void;
}

export default function OnboardingScreen({ onFinish }: OnboardingProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const slideAnim = useState(new Animated.Value(0))[0];

  const handleNext = async () => {
    if (activeSlide < SLIDES.length - 1) {
      setActiveSlide(prev => prev + 1);
      Animated.timing(slideAnim, {
        toValue: -(activeSlide + 1) * width,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      await completeOnboarding();
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
    } catch (e) {
      console.warn('Failed to save onboarding completion state', e);
    } finally {
      onFinish();
    }
  };

  const current = SLIDES[activeSlide];
  const IconComponent = current.Icon;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top action row */}
      <View style={styles.header}>
        <Text style={styles.paginationText}>
          {activeSlide + 1} of {SLIDES.length}
        </Text>
        {activeSlide < SLIDES.length - 1 && (
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipBtn}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slide Illustration block */}
      <View style={styles.container}>
        <View style={[styles.iconCard, { backgroundColor: current.bgColor }]}>
          <IconComponent size={64} color={current.iconColor} />
        </View>

        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.desc}>{current.desc}</Text>
      </View>

      {/* Pagination indicators & buttons */}
      <View style={styles.footer}>
        <View style={styles.indicators}>
          {SLIDES.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                i === activeSlide ? styles.activeDot : styles.inactiveDot
              ]} 
            />
          ))}
        </View>

        {activeSlide === SLIDES.length - 1 ? (
          <Button 
            title="Get Started" 
            onPress={completeOnboarding} 
            variant="accent"
            size="lg"
            style={styles.ctaButton}
          />
        ) : (
          <Button 
            title="Next Step" 
            onPress={handleNext} 
            size="lg"
            style={styles.ctaButton}
            icon={<ArrowRight size={16} color={COLORS.white} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  paginationText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  skipBtn: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconCard: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    letterSpacing: -0.5,
  },
  desc: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
    backgroundColor: COLORS.primary,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: COLORS.border,
  },
  ctaButton: {
    width: width - SPACING.lg * 2,
  },
});
