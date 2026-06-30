import React, { useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Animated, 
  Pressable, 
  ViewStyle,
  StyleProp
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export default function Card({
  children,
  onPress,
  style,
  variant = 'elevated',
  padding = 'medium'
}: CardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 40,
      bounciness: 2
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 2
    }).start();
  };

  const getCardStyle = () => {
    switch (variant) {
      case 'outlined':
        return styles.outlined;
      case 'flat':
        return styles.flat;
      default:
        return styles.elevated;
    }
  };

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return SPACING.sm;
      case 'large':
        return SPACING.lg;
      default:
        return SPACING.md;
    }
  };

  const content = (
    <View style={[styles.inner, { padding: getPadding() }]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.base, getCardStyle()]}
        >
          {content}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View style={[styles.base, getCardStyle(), style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
  },
  elevated: {
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...SHADOWS.sm,
  },
  outlined: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  flat: {
    backgroundColor: COLORS.surface,
  },
  inner: {
    width: '100%',
  },
});
