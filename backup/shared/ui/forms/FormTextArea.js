import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { inputStyle } from '../../styles/common';

export default function FormTextArea({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  error, 
  rows = 4,
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
          { 
            minHeight: rows * 20 + 20, 
            textAlignVertical: 'top' 
          },
          error && { borderColor: '#ef4444' },
          style
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        multiline
        numberOfLines={rows}
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