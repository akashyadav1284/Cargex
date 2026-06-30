import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  ViewStyle,
  StyleProp
} from 'react-native';
import { COLORS, BORDER_RADIUS } from '../constants/theme';

interface AvatarProps {
  name: string;
  imageUri?: string;
  size?: number;
  showOnlineBadge?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function Avatar({
  name,
  imageUri,
  size = 48,
  showOnlineBadge = false,
  style
}: AvatarProps) {
  const getInitials = () => {
    if (!name) return 'U';
    const split = name.trim().split(' ');
    if (split.length > 1) {
      return (split[0].charAt(0) + split[1].charAt(0)).toUpperCase();
    }
    return split[0].charAt(0).toUpperCase();
  };

  const radius = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {imageUri ? (
        <Image 
          source={{ uri: imageUri }} 
          style={{ width: size, height: size, borderRadius: radius }} 
        />
      ) : (
        <View style={[styles.monogram, { width: size, height: size, borderRadius: radius }]}>
          <Text style={[styles.monogramText, { fontSize: size * 0.4 }]}>
            {getInitials()}
          </Text>
        </View>
      )}

      {showOnlineBadge && (
        <View 
          style={[
            styles.badge, 
            { 
              width: size * 0.28, 
              height: size * 0.28, 
              borderRadius: (size * 0.28) / 2,
              bottom: 0,
              right: 0
            }
          ]} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  monogram: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  badge: {
    backgroundColor: COLORS.secondary,
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
});
