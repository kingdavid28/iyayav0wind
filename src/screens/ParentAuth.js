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
import { TextInput, Button, useTheme } from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import { useApp, ACTION_TYPES } from "../contexts/AppContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { validateForm, validationRules } from "../utils/validation";
import { useApi } from "../hooks/useApi";
import { authAPI } from "../config/api";
import { CommonActions } from '@react-navigation/native';

const ParentAuth = ({ navigation, route }) => {
  const theme = useTheme();
  const { dispatch } = useApp();
  const { user: authUser, login, signup } = useAuth();
  
  // When auth user is present (after login/signup), reset stack to ParentDashboard
  useEffect(() => {
    if (authUser) {
      try {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'ParentDashboard' }],
          })
        );
      } catch (error) {
        console.warn('Navigation error:', error);
      }
    }
  }, [authUser, navigation]);
  
  const [mode, setMode] = useState(route.params?.mode || 'login');
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
    } else if (mode === 'reset') {
      rules = { email: validationRules.userRegistration.email };
    }
    
    const errors = validateForm(formData, rules);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
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
      if (mode === 'login') {
        const result = await login(email, password);
        // Set role to parent
        try { await authAPI.setRole('parent'); } catch (error) {
          console.warn('Role setting error:', error);
        }
        return result;
      } else if (mode === 'signup') {
        const result = await signup({ email, password, name, phone, role: 'parent' });
        try { await authAPI.setRole('parent'); } catch (error) {
          console.warn('Role setting error:', error);
        }
        return result;
      } else if (mode === 'reset') {
        const result = await authAPI.resetPassword(email);
        Alert.alert("Reset Link Sent", "If an account with that email exists, a password reset link has been sent. Check the server console for the reset URL in development mode.");
        setMode('login');
        return result;
      }
    }, {
      onError: (error) => {
        Alert.alert("Error", error?.message || "Authentication failed");
      }
    });
  };

  // Toggle between login/signup modes
  const toggleMode = () => {
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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
    >
      <LinearGradient 
        colors={["#fce8f4", "#f3e8ff"]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color="#db2777" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <LinearGradient 
              colors={["#fbcfe8", "#f9a8d4"]}
              style={styles.logoBackground}
            >
              <Image 
                source={require('../../assets/icon.png')} 
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="iYaya logo"
              />
            </LinearGradient>
            <Text style={styles.appTitle}>iYaya</Text>
          </View>
        </View>

        <View style={styles.authContainer}>
          <View style={[styles.authCard, styles.parentCard]}>
            <View style={styles.userTypeIndicator}>
              <LinearGradient 
                colors={["#fce7f3", "#fbcfe8"]}
                style={styles.parentIconContainer}
              >
                <Ionicons name="happy-outline" size={32} color="#db2777" />
              </LinearGradient>
              <Text style={styles.authTitle}>
                {mode === 'signup' ? 'Create Parent Account' : mode === 'reset' ? 'Reset Password' : 'Welcome Back Parent'}
              </Text>
            </View>

            <View style={styles.formContainer}>
              {/* Name & Phone for signup */}
              {mode === 'signup' && (
                <>
                  <TextInput
                    label="Full Name"
                    value={formData.name}
                    onChangeText={(text) => handleChange('name', text)}
                    mode="outlined"
                    style={styles.input}
                    left={<TextInput.Icon icon="account" color="#db2777" />}
                    theme={{ colors: { primary: '#db2777', background: 'white' } }}
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
                    left={<TextInput.Icon icon="phone" color="#db2777" />}
                    theme={{ colors: { primary: '#db2777', background: 'white' } }}
                    accessibilityLabel="Phone number input"
                    error={!!formErrors.phone}
                  />
                  {formErrors.phone ? <Text style={{ color: 'red', marginBottom: 8 }}>{formErrors.phone}</Text> : null}
                </>
              )}

              {/* Email */}
              <TextInput
                label="Email"
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                left={<TextInput.Icon icon="email" color="#db2777" />}
                theme={{ colors: { primary: '#db2777', background: 'white' } }}
                accessibilityLabel="Email input"
                error={!!formErrors.email}
              />
              {formErrors.email ? <Text style={{ color: 'red', marginBottom: 8 }}>{formErrors.email}</Text> : null}

              {/* Passwords (skip for reset mode) */}
              {mode !== 'reset' && (
                <>
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
                        color="#db2777"
                      />
                    }
                    theme={{ colors: { primary: '#db2777', background: 'white' } }}
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
                          color="#db2777"
                        />
                      }
                      theme={{ colors: { primary: '#db2777', background: 'white' } }}
                      accessibilityLabel="Confirm password input"
                      error={!!formErrors.confirmPassword}
                    />
                  )}
                  {formErrors.confirmPassword ? <Text style={{ color: 'red', marginBottom: 8 }}>{formErrors.confirmPassword}</Text> : null}
                </>
              )}

              {/* Primary action button */}
              <Button 
                mode="contained" 
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={[styles.authButton, styles.parentAuthButton]}
                labelStyle={styles.authButtonLabel}
                accessibilityLabel={
                  mode === 'signup' ? 'Create account button' : mode === 'reset' ? 'Send reset link button' : 'Sign in button'
                }
              >
                {mode === 'signup' ? 'Create Account' : mode === 'reset' ? 'Send Reset Link' : 'Sign In'}
              </Button>

              {/* Footer links */}
              {mode !== 'reset' ? (
                <>
                  <TouchableOpacity onPress={() => setMode('reset')} accessibilityLabel="Switch to reset password">
                    <Text style={styles.smallLink}>Forgot password?</Text>
                  </TouchableOpacity>
                  <View style={styles.authFooter}>
                    <Text style={styles.authFooterText}>
                      {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                    </Text>
                    <TouchableOpacity 
                      onPress={toggleMode}
                      accessibilityLabel={mode === 'signup' ? 'Switch to sign in' : 'Switch to sign up'}
                    >
                      <Text style={[styles.authFooterLink, { color: '#16a34a' }]}>
                        {mode === 'signup' ? 'Sign In' : 'Sign Up'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity onPress={() => setMode('login')} accessibilityLabel="Back to sign in">
                  <Text style={styles.smallLink}>Back to Sign In</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
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
  logo: { width: 50, height: 50 },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#db2777',
    marginTop: 8,
  },
  authContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 },
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
  parentCard: { borderTopWidth: 4, borderTopColor: '#fbcfe8' },
  userTypeIndicator: { alignItems: 'center', marginBottom: 24 },
  parentIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  authTitle: { fontSize: 18, fontWeight: '600', color: '#db2777', textAlign: 'center' },
  formContainer: { marginTop: 16 },
  input: { marginBottom: 16, backgroundColor: 'white' },
  authButton: { marginTop: 16, borderRadius: 8, paddingVertical: 8 },
  parentAuthButton: { backgroundColor: '#db2777' },
  authButtonLabel: { color: 'white', fontWeight: 'bold' },
  authFooter: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  authFooterText: { color: '#6b7280' },
  authFooterLink: { fontWeight: 'bold', marginLeft: 4 },
  smallLink: { color: '#db2777', textAlign: 'center', marginTop: 8 },
});

export default ParentAuth;