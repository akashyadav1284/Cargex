import React from 'react';
import { StyleSheet, Text, View, Image, ViewStyle, StyleProp } from 'react-native';
import { COLORS, BORDER_RADIUS } from '../constants/theme';

interface AvatarProps {
  name: string;
  source?: string;
  size?: number;
  showActiveDot?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function Avatar({
  name,
  source,
  size = 48,
  showActiveDot = false,
  style,
}: AvatarProps) {
  const getInitials = (fullName: string) => {
    if (!fullName) return 'D';
    const parts = fullName.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return fullName.charAt(0).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
      {source ? (
        <Image 
          source={{ uri: source }} 
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.monogram, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.monogramText, { fontSize: size * 0.4 }]}>
            {initials}
          </Text>
        </View>
      )}

      {showActiveDot && (
        <View 
          style={[
            styles.activeDot, 
            { 
              width: size * 0.25, 
              height: size * 0.25, 
              borderRadius: (size * 0.25) / 2,
              bottom: 0,
              right: size * 0.05
            }
          ]} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    position: 'relative',
  },
  monogram: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  monogramText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  activeDot: {
    position: 'absolute',
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
});
