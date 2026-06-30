import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Animated, 
  Dimensions, 
  ActivityIndicator 
} from 'react-native';
import { COLORS } from '../constants/theme';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const taglineFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence of entrance animations
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 10,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // End after 2.5 seconds
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(taglineFadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start(() => {
        onFinish();
      });
    }, 2800);

    return () => clearTimeout(timer);
  }, [onFinish, scaleAnim, fadeAnim, taglineFadeAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.logoContainer, 
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}>
        <Text style={styles.logo}>Cargex</Text>
      </Animated.View>
      <Animated.Text style={[styles.tagline, { opacity: taglineFadeAnim }]}>
        Moving India Smarter
      </Animated.Text>
      <ActivityIndicator size="small" color={COLORS.secondary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 8,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -1.5,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 8,
  },
  spinner: {
    position: 'absolute',
    bottom: 50,
  },
});
