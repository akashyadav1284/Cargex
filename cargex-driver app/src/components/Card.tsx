import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'solid';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export default function Card({
  children,
  variant = 'elevated',
  padding = 'md',
  style,
}: CardProps) {
  const getPaddingValue = () => {
    switch (padding) {
      case 'none': return 0;
      case 'sm': return SPACING.sm;
      case 'lg': return SPACING.lg;
      case 'md':
      default: return SPACING.md;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return {
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.card,
        };
      case 'solid':
        return {
          backgroundColor: COLORS.surface,
        };
      case 'elevated':
      default:
        return {
          backgroundColor: COLORS.card,
          ...SHADOWS.md,
        };
    }
  };

  return (
    <View 
      style={[
        styles.card, 
        getVariantStyles(), 
        { padding: getPaddingValue() }, 
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
});
