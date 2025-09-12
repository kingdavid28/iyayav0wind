import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export default function LoadingSpinner({ 
  size = 'large', 
  color = '#3b82f6', 
  text = 'Loading...', 
  style = {} 
}) {
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text style={{ marginTop: 12, fontSize: 16, color: '#6b7280' }}>
          {text}
        </Text>
      )}
    </View>
  );
}