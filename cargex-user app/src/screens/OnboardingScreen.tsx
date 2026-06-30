import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  useWindowDimensions, 
  SafeAreaView, 
  TouchableOpacity, 
  Animated 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { Truck, Navigation, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import Button from '../components/Button';

interface OnboardingScreenProps {
  onFinish: () => void;
}

interface SlideItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const slides: SlideItem[] = [
    {
      id: '1',
      title: 'Book Trucks in Minutes',
      description: 'Book cargo vehicles anywhere in India with just a few taps.',
      icon: <Truck size={80} color={COLORS.secondary} />
    },
    {
      id: '2',
      title: 'Live Driver Tracking',
      description: 'Track your shipment in real time from dispatch to delivery.',
      icon: <Navigation size={80} color={COLORS.secondary} />
    },
    {
      id: '3',
      title: 'Verified Drivers',
      description: 'Every transport partner is thoroughly verified for your safety and reliability.',
      icon: <ShieldCheck size={80} color={COLORS.secondary} />
    },
    {
      id: '4',
      title: 'Ready to Move?',
      description: 'Sign up or log in now to book your first logistics delivery with Cargex.',
      icon: <CheckCircle2 size={80} color={COLORS.secondary} />
    }
  ];

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
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
      onFinish();
    } catch (e) {
      console.error('Failed to save onboarding state', e);
      onFinish();
    }
  };

  const renderItem = ({ item }: { item: SlideItem }) => {
    return (
      <View style={[styles.slide, { width }]}>
        <View style={styles.iconContainer}>
          <View style={styles.circle}>
            {item.icon}
          </View>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Action Bar */}
      <View style={styles.header}>
        {currentIndex < slides.length - 1 ? (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipBtn}>Skip</Text>
          </TouchableOpacity>
        ) : <View />}
      </View>

      {/* Slide Carousels */}
      <FlatList
        data={slides}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false
        })}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
        style={{ flex: 3 }}
      />

      {/* Pagination Controls */}
      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width
            ];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [10, 24, 10],
              extrapolate: 'clamp'
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp'
            });

            return (
              <Animated.View 
                key={index} 
                style={[
                  styles.dot, 
                  { width: dotWidth, opacity, backgroundColor: index === currentIndex ? COLORS.secondary : COLORS.border }
                ]} 
              />
            );
          })}
        </View>

        <Button 
          label={currentIndex === slides.length - 1 ? "Get Started" : "Next"} 
          onPress={handleNext}
          style={styles.actionBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  skipBtn: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 140,
  },
  indicatorContainer: {
    flexDirection: 'row',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  actionBtn: {
    width: '100%',
  },
});
