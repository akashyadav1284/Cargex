import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ViewStyle, 
  TextStyle,
  StyleProp
} from 'react-native';
import { COLORS, BORDER_RADIUS } from '../constants/theme';

interface BadgeProps {
  label: string;
  status?: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'pending' | 'ongoing';
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export default function Badge({
  label,
  status = 'pending',
  style,
  labelStyle
}: BadgeProps) {
  const getBadgeColors = () => {
    switch (status) {
      case 'completed':
        return { bg: '#DCFCE7', text: '#15803D' };
      case 'accepted':
      case 'ongoing':
      case 'in_progress':
        return { bg: '#EFF6FF', text: '#1D4ED8' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#B91C1C' };
      case 'requested':
      case 'pending':
      default:
        return { bg: '#FEF3C7', text: '#D97706' };
    }
  };

  const colors = getBadgeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }, labelStyle]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
