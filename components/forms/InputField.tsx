import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  Pressable,
} from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  isPassword?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  icon,
  isPassword = false,
  style,
  ...props
}) => {
  const { theme } = useThemeStore();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!isPassword);

  const getBorderColor = () => {
    if (error) return theme.danger;
    if (isFocused) return theme.primary;
    return 'rgba(255, 255, 255, 0.1)';
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.textDim }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: isFocused
              ? 'rgba(255, 255, 255, 0.07)'
              : 'rgba(255, 255, 255, 0.04)',
            borderColor: getBorderColor(),
          },
        ]}
      >
        {icon && <View style={styles.iconBox}>{icon}</View>}
        <TextInput
          style={[styles.input, { color: theme.text }, style]}
          placeholderTextColor="rgba(255, 255, 255, 0.3)"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeBtn}
          >
            {showPassword ? (
              <EyeOff size={18} color={theme.textDim} />
            ) : (
              <Eye size={18} color={theme.textDim} />
            )}
          </Pressable>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
  iconBox: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  error: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: '600',
  },
});
