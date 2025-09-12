import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import colors from '../../constants/colors';

const PrimaryButton = ({ 
  title, 
  onPress, 
  loading = false, 
  disabled = false, 
  style = {},
  textStyle = {} 
}) => {
  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: colors.primary,
          paddingVertical: 16,
          paddingHorizontal: 24,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
          opacity: disabled ? 0.6 : 1,
        },
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text
          style={[
            {
              color: '#fff',
              fontSize: 16,
              fontWeight: '600',
            },
            textStyle
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default PrimaryButton;