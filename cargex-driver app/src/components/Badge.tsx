import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../constants/theme';

interface BadgeProps {
  status: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function Badge({
  status,
  style,
  textStyle,
}: BadgeProps) {
  const getBadgeConfig = () => {
    const s = status?.toLowerCase() || '';
    switch (s) {
      case 'requested':
      case 'pending':
        return {
          bg: '#EFF6FF',
          color: COLORS.blue,
          label: 'PENDING',
        };
      case 'accepted':
      case 'assigned':
      case 'arrived':
        return {
          bg: '#FFFBEB',
          color: COLORS.warning,
          label: s.toUpperCase(),
        };
      case 'in_progress':
      case 'ongoing':
        return {
          bg: '#ECFDF5',
          color: COLORS.accent,
          label: 'ONGOING',
        };
      case 'completed':
      case 'success':
        return {
          bg: '#ECFDF5',
          color: COLORS.success,
          label: 'COMPLETED',
        };
      case 'cancelled':
      case 'rejected':
      case 'blocked':
        return {
          bg: '#FEF2F2',
          color: COLORS.error,
          label: s.toUpperCase(),
        };
      default:
        return {
          bg: COLORS.surface,
          color: COLORS.textMuted,
          label: s.toUpperCase(),
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <Text style={[styles.badgeText, { color: config.color }, textStyle]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
