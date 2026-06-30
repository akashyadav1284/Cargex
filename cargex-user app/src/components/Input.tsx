import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  View, 
  TouchableOpacity, 
  ViewStyle, 
  TextStyle,
  StyleProp
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  icon,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  style,
  inputStyle,
  labelStyle,
  onFocus,
  onBlur
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const isPasswordInput = secureTextEntry;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}

      <View 
        style={[
          styles.inputWrapper,
          isFocused ? styles.inputWrapperFocused : undefined,
          error ? styles.inputWrapperError : undefined
        ]}
      >
        {icon && (
          <View style={styles.iconContainer}>
            {icon}
          </View>
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          onFocus={() => {
            setIsFocused(true);
            if (onFocus) onFocus();
          }}
          onBlur={() => {
            setIsFocused(false);
            if (onBlur) onBlur();
          }}
          secureTextEntry={isPasswordInput && !passwordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[styles.input, icon ? styles.noLeftPadding : undefined, inputStyle]}
        />

        {isPasswordInput && (
          <TouchableOpacity 
            onPress={() => setPasswordVisible(!passwordVisible)} 
            style={styles.rightIconContainer}
          >
            {passwordVisible ? (
              <EyeOff size={20} color={COLORS.textMuted} />
            ) : (
              <Eye size={20} color={COLORS.textMuted} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: SPACING.sm,
  },
  noLeftPadding: {
    paddingLeft: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  inputWrapperError: {
    borderColor: COLORS.error,
  },
  iconContainer: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    padding: SPACING.xs,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
  },
});
