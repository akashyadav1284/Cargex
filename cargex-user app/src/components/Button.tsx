import React, { useRef } from 'react';
import { 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  Animated, 
  ViewStyle, 
  TextStyle,
  StyleProp
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  icon,
  style,
  labelStyle
}: ButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4
    }).start();
  };

  const isBtnDisabled = disabled || isLoading;

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'outline':
        return styles.outline;
      case 'ghost':
        return styles.ghost;
      default:
        return styles.primary;
    }
  };

  const getLabelStyle = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return styles.labelTextOutline;
      default:
        return styles.labelTextPrimary;
    }
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isBtnDisabled}
        activeOpacity={0.9}
        style={[
          styles.base,
          getButtonStyle(),
          isBtnDisabled ? styles.disabled : undefined,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator 
            color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white} 
            size="small" 
          />
        ) : (
          <>
            {icon && icon}
            <Text style={[styles.labelText, getLabelStyle(), icon ? styles.marginText : undefined, labelStyle]}>
              {label}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  marginText: {
    marginLeft: 8,
  },
  base: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
    ...SHADOWS.sm,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: COLORS.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  disabled: {
    opacity: 0.6,
  },
  labelText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  labelTextPrimary: {
    color: COLORS.white,
  },
  labelTextOutline: {
    color: COLORS.primary,
  },
});
