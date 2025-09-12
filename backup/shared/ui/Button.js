import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { buttonPrimary, buttonSecondary, textPrimary } from '../styles/common';

export default function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  disabled = false, 
  loading = false,
  style = {},
  textStyle = {},
  icon,
  children
}) {
  const variants = {
    primary: { 
      button: buttonPrimary, 
      text: { ...textPrimary, color: '#fff' } 
    },
    secondary: { 
      button: buttonSecondary, 
      text: { ...textPrimary, color: '#374151' } 
    },
    danger: { 
      button: { ...buttonPrimary, backgroundColor: '#ef4444' }, 
      text: { ...textPrimary, color: '#fff' } 
    },
    ghost: { 
      button: { ...buttonSecondary, backgroundColor: 'transparent', borderWidth: 0 }, 
      text: { ...textPrimary, color: '#3b82f6' } 
    }
  };

  const variantStyles = variants[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        variantStyles.button,
        isDisabled && { opacity: 0.5 },
        style
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading && <ActivityIndicator size="small" color={variantStyles.text.color} style={{ marginRight: 8 }} />}
      {icon && !loading && icon}
      {children || <Text style={[variantStyles.text, textStyle]}>{title}</Text>}
    </TouchableOpacity>
  );
}