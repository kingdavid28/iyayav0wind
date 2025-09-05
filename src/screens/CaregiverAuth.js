import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Dimensions,
  StyleSheet,
  Keyboard,
} from 'react-native';
import KeyboardAvoidingWrapper from '../components/KeyboardAvoidingWrapper';
import { TextInput, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp, ACTION_TYPES } from '../contexts/AppContext';
import { authAPI } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { CommonActions } from '@react-navigation/native';
import { validateForm, validationRules } from '../utils/validation';
import { useApi } from '../hooks/useApi';

const CaregiverAuth = ({ navigation }) => {
  const [mode, setMode] = useState('login');
  const { dispatch } = useApp();
  const { user: authUser, login, signup } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const { loading: isSubmitting, execute } = useApi();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // When auth user reflects a logged-in state, reset stack to caregiver dashboard
  useEffect(() => {
    if (authUser) {
      try {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'CaregiverDashboard' }],
          })
        );
      } catch (error) {
        console.warn('Navigation error:', error);
      }
    }
  }, [authUser, navigation]);

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user types
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Validate form using validation system
  const validateCurrentForm = () => {
    let rules = {};
    
    if (mode === 'login') {
      rules = validationRules.userLogin;
    } else if (mode === 'signup') {
      rules = {
        ...validationRules.userRegistration,
        confirmPassword: (value) => {
          if (value !== formData.password) {
            return 'Passwords do not match';
          }
          return null;
        }
      };
    }
    
    const errors = validateForm(formData, rules);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    try {
      Keyboard.dismiss();
    } catch (e) {
      // Keyboard might not be available on web
    }
    
    if (!validateCurrentForm()) {
      return;
    }
    
    const { email, password, name, phone } = formData;
    
    const result = await execute(async () => {
      if (mode === 'signup') {
        const result = await signup({ email, password, name, phone, role: 'caregiver' });
        
        // Set role to caregiver
        try { 
          await authAPI.setRole('caregiver'); 
        } catch (error) {
          console.warn('Role setting error:', error);
        }
        
        // Inform user to verify email
        Alert.alert('Account Created', 'Your caregiver account has been created successfully!');
        return result;
      } else {
        const result = await login(email, password);
        
        // Set role to caregiver
        try { 
          await authAPI.setRole('caregiver'); 
        } catch (error) {
          console.warn('Role setting error:', error);
        }
        
        return result;
      }
    }, {
      onError: (error) => {
        console.error('Auth error:', error);
        Alert.alert("Error", error.message || "Authentication failed");
      }
    });
  };

  const toggleAuthMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setFormData({
      email: '',
      password: '',
      name: '',
      phone: '',
      confirmPassword: ''
    });
    setFormErrors({});
  };

  const keyboardOffset = Platform.select({ ios: 80, android: 0 });

  return (
    <KeyboardAvoidingWrapper
      style={styles.container}
      keyboardVerticalOffset={Platform.select({ ios: 64, android: 0, web: 0 })}
    >
      <LinearGradient 
        colors={["#e0f2fe", "#f3e8ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color="#2563eb" />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <LinearGradient 
              colors={["#bfdbfe", "#a5b4fc"]}
              style={styles.logoBackground}
            >
              <Image 
                source={require('../../assets/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="iYaya logo"
              />
            </LinearGradient>
            <Text style={styles.appTitle}>iYaya</Text>
          </View>
        </View>

        <View style={styles.authContainer}>
          <View style={[styles.authCard, styles.caregiverCard]}>
            <View style={styles.userTypeIndicator}>
              <LinearGradient 
                colors={["#e0f2fe", "#bae6fd"]}
                style={styles.caregiverIconContainer}
              >
                <Ionicons name="person-outline" size={32} color="#2563eb" />
              </LinearGradient>
              <Text style={styles.authTitle}>
                {mode === 'signup' ? 'Create Caregiver Account' : 'Welcome Back Caregiver'}
              </Text>
            </View>

            <View style={styles.formContainer}>
              {mode === 'signup' && (
                <>
                <TextInput
                  label="Full Name"
                  value={formData.name}
                  onChangeText={(text) => handleChange('name', text)}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="account" color="#2563eb" />}
                  theme={{ colors: { primary: '#2563eb', background: 'white' } }}
                  accessibilityLabel="Full name input"
                  error={!!formErrors.name}
                />
                {formErrors.name ? <Text style={{ color: 'red', marginBottom: 8 }}>{formErrors.name}</Text> : null}
                
                <TextInput
                  label="Phone Number"
                  value={formData.phone}
                  onChangeText={(text) => handleChange('phone', text)}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="phone-pad"
                  left={<TextInput.Icon icon="phone" color="#2563eb" />}
                  theme={{ colors: { primary: '#2563eb', background: 'white' } }}
                  accessibilityLabel="Phone number input"
                  error={!!formErrors.phone}
                />
                {formErrors.phone ? <Text style={{ color: 'red', marginBottom: 8 }}>{formErrors.phone}</Text> : null}
                </>
              )}

              <TextInput
                label="Email"
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                left={<TextInput.Icon icon="email" color="#2563eb" />}
                theme={{ colors: { primary: '#2563eb', background: 'white' } }}
                accessibilityLabel="Email input"
                error={!!formErrors.email}
              />
              {formErrors.email ? <Text style={{ color: 'red', marginBottom: 8 }}>{formErrors.email}</Text> : null}

              <TextInput
                label="Password"
                value={formData.password}
                onChangeText={(text) => handleChange('password', text)}
                mode="outlined"
                style={styles.input}
                secureTextEntry={!showPassword}
                right={
                  <TextInput.Icon 
                    icon={showPassword ? "eye-off" : "eye"} 
                    onPress={() => setShowPassword(!showPassword)}
                    color="#2563eb"
                  />
                }
                theme={{ colors: { primary: '#2563eb', background: 'white' } }}
                accessibilityLabel="Password input"
                error={!!formErrors.password}
              />
              {formErrors.password ? <Text style={{ color: 'red', marginBottom: 8 }}>{formErrors.password}</Text> : null}

              {mode === 'signup' && (
                <TextInput
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChangeText={(text) => handleChange('confirmPassword', text)}
                  mode="outlined"
                  style={styles.input}
                  secureTextEntry={!showConfirmPassword}
                  right={
                    <TextInput.Icon 
                      icon={showConfirmPassword ? "eye-off" : "eye"} 
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      color="#2563eb"
                    />
                  }
                  theme={{ colors: { primary: '#2563eb', background: 'white' } }}
                  accessibilityLabel="Confirm password input"
                  error={!!formErrors.confirmPassword}
                />
              )}
              {formErrors.confirmPassword ? <Text style={{ color: 'red', marginBottom: 8 }}>{formErrors.confirmPassword}</Text> : null}

              <Button 
                mode="contained" 
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={[styles.authButton, styles.caregiverAuthButton]}
                labelStyle={styles.authButtonLabel}
                accessibilityLabel={mode === 'signup' ? 'Create account button' : 'Sign in button'}
              >
                {mode === 'signup' ? 'Create Account' : 'Sign In'}
              </Button>

              <View style={styles.authFooter}>
                <Text style={styles.authFooterText}>
                  {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                </Text>
                <TouchableOpacity 
                  onPress={toggleAuthMode}
                  accessibilityLabel={mode === 'signup' ? 'Switch to sign in' : 'Switch to sign up'}
                >
                  <Text style={[styles.authFooterLink, { color: '#2563eb' }]}>
                    {mode === 'signup' ? 'Sign In' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 40,
    padding: 8,
  },
  logoContainer: {
    marginTop: 50,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 50,
    height: 50,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
    marginTop: 8,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  authCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  caregiverCard: {
    borderTopWidth: 4,
    borderTopColor: '#bfdbfe',
  },
  userTypeIndicator: {
    alignItems: 'center',
    marginBottom: 24,
  },
  caregiverIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563eb',
    textAlign: 'center',
  },
  formContainer: {
    marginTop: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  authButton: {
    marginTop: 16,
    borderRadius: 8,
    paddingVertical: 8,
  },
  caregiverAuthButton: {
    backgroundColor: '#2563eb',
  },
  authButtonLabel: {
    color: 'white',
    fontWeight: 'bold',
  },
  authFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  authFooterText: {
    color: '#6b7280',
  },
  authFooterLink: {
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default CaregiverAuth;