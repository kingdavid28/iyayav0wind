import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { cardStyle } from '../styles/common';

export default function Card({ 
  children, 
  style = {}, 
  onPress, 
  disabled = false,
  variant = 'default' 
}) {
  const variants = {
    default: {},
    elevated: { elevation: 4, shadowOpacity: 0.15 },
    flat: { elevation: 0, shadowOpacity: 0, borderWidth: 1, borderColor: '#e5e7eb' },
    highlighted: { borderWidth: 2, borderColor: '#3b82f6' }
  };

  const cardStyles = [
    cardStyle,
    variants[variant],
    style
  ];

  if (onPress && !disabled) {
    return (
      <TouchableOpacity 
        style={cardStyles} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyles}>
      {children}
    </View>
  );
}