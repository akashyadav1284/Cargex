import React, { useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Animated, 
  ViewStyle, 
  TextStyle,
  StyleProp
} from 'react-native';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'accent':
        return {
          button: { backgroundColor: COLORS.accent },
          text: { color: COLORS.white },
        };
      case 'outline':
        return {
          button: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.border },
          text: { color: COLORS.primary },
        };
      case 'ghost':
        return {
          button: { backgroundColor: 'transparent' },
          text: { color: COLORS.primary },
        };
      case 'danger':
        return {
          button: { backgroundColor: COLORS.error },
          text: { color: COLORS.white },
        };
      case 'primary':
      default:
        return {
          button: { backgroundColor: COLORS.primary },
          text: { color: COLORS.white },
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          button: { paddingVertical: 8, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.sm },
          text: { fontSize: 13, fontWeight: '700' as const },
        };
      case 'lg':
        return {
          button: { paddingVertical: 16, paddingHorizontal: SPACING.xl, borderRadius: BORDER_RADIUS.lg },
          text: { fontSize: 16, fontWeight: '800' as const },
        };
      case 'md':
      default:
        return {
          button: { paddingVertical: 12, paddingHorizontal: SPACING.lg, borderRadius: BORDER_RADIUS.md },
          text: { fontSize: 14, fontWeight: '700' as const },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        disabled={disabled || loading}
        style={[
          styles.baseButton,
          variantStyles.button,
          sizeStyles.button,
          (disabled || loading) && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator 
            color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white} 
            size="small" 
          />
        ) : (
          <Animated.View style={styles.contentContainer}>
            {icon && <Animated.View style={styles.iconContainer}>{icon}</Animated.View>}
            <Text style={[styles.baseText, variantStyles.text, sizeStyles.text, textStyle]}>
              {title}
            </Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    ...SHADOWS.sm,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  baseText: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
});
