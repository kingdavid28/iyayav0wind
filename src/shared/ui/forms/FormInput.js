import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { inputStyle, textSecondary } from '../../styles/common';

export default function FormInput({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  error, 
  style = {},
  ...props 
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={{ fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          inputStyle,
          error && { borderColor: '#ef4444' },
          style
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && (
        <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 5 }}>
          {error}
        </Text>
      )}
    </View>
  );
}