import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useAuthSubmit } from '../../../hooks/useAuthSubmit';
import { useSecurity } from '../../../hooks/useSecurity';

const AuthForm = ({ mode = 'login', userType = 'parent', onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  
  const { submitAuth, isSubmitting, errors } = useAuthSubmit();
  const { sanitizeInput, checkRateLimit } = useSecurity();

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: sanitizeInput(value)
    }));
  };

  const handleSubmit = async () => {
    // Rate limiting check
    if (!checkRateLimit('auth')) {
      alert('Too many attempts. Please wait before trying again.');
      return;
    }

    try {
      const result = await submitAuth(formData, mode, userType);
      if (result.success) {
        onSuccess?.(result);
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {mode === 'signup' && (
        <TextInput
          label="Full Name *"
          value={formData.name}
          onChangeText={(text) => handleChange('name', text)}
          mode="outlined"
          style={styles.input}
          error={!!errors.name}
        />
      )}

      <TextInput
        label="Email *"
        value={formData.email}
        onChangeText={(text) => handleChange('email', text)}
        mode="outlined"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        error={!!errors.email}
      />

      {mode !== 'reset' && (
        <TextInput
          label="Password *"
          value={formData.password}
          onChangeText={(text) => handleChange('password', text)}
          mode="outlined"
          style={styles.input}
          secureTextEntry={!showPassword}
          right={
            <TextInput.Icon 
              icon={showPassword ? "eye-off" : "eye"} 
              onPress={() => setShowPassword(!showPassword)}
            />
          }
          error={!!errors.password}
        />
      )}

      {mode === 'signup' && (
        <>
          <TextInput
            label="Confirm Password *"
            value={formData.confirmPassword}
            onChangeText={(text) => handleChange('confirmPassword', text)}
            mode="outlined"
            style={styles.input}
            secureTextEntry={!showPassword}
            error={!!errors.confirmPassword}
          />

          <TextInput
            label="Phone Number *"
            value={formData.phone}
            onChangeText={(text) => handleChange('phone', text)}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
            error={!!errors.phone}
          />
        </>
      )}

      {Object.values(errors).map((error, index) => (
        <Text key={index} style={styles.errorText}>{error}</Text>
      ))}

      <Button 
        mode="contained" 
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.button}
      >
        {mode === 'signup' ? 'Create Account' : 
         mode === 'reset' ? 'Send Reset Link' : 'Sign In'}
      </Button>
    </View>
  );
};

const styles = {
  container: { padding: 16 },
  input: { marginBottom: 16, backgroundColor: 'white' },
  button: { marginTop: 16, paddingVertical: 8 },
  errorText: { color: 'red', fontSize: 12, marginBottom: 8 }
};

export default AuthForm;