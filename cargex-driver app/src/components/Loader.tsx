import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, ActivityIndicator } from 'react-native';
import { COLORS, BORDER_RADIUS } from '../constants/theme';

interface LoaderProps {
  variant?: 'spinner' | 'shimmer';
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export default function Loader({
  variant = 'spinner',
  width = '100%',
  height = 100,
  borderRadius = BORDER_RADIUS.md,
}: LoaderProps) {
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (variant !== 'shimmer') return;

    const pulse = Animated.sequence([
      Animated.timing(shimmerAnim, {
        toValue: 0.7,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(shimmerAnim, {
        toValue: 0.3,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();
  }, [variant]);

  if (variant === 'spinner') {
    return (
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.shimmer, 
        { 
          width: width as any, 
          height, 
          borderRadius, 
          opacity: shimmerAnim 
        }
      ]} 
    />
  );
}

const styles = StyleSheet.create({
  spinnerContainer: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shimmer: {
    backgroundColor: COLORS.surfaceHighlight,
    marginVertical: 6,
  },
});
