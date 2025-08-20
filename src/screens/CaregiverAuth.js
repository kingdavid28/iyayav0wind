import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';

export const CaregiverAuth = ({ navigation }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const { actions, state } = useApp();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const { email, password, confirmPassword, name, phone } = formData;

    if (!email || !password) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (mode === 'signup') {
      if (!name) {
        Alert.alert("Error", "Please enter your name");
        return;
      }
      if (!phone) {
        Alert.alert("Error", "Please enter your phone number");
        return;
      }
      
      if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return;
      }

      if (password.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      if (mode === 'signup') {
        await actions.register({ email, password, name, phone, role: 'caregiver' });
        // Navigation will be handled by auth state switching in App.js
      } else {
        await actions.login(email, password);
        // Navigation will be handled by auth state switching in App.js
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <LinearGradient 
        colors={["#e0f2fe", "#f3e8ff"]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
                  onChangeText={(text) => setFormData({...formData, name: text})}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="account" color="#2563eb" />}
                  theme={{ 
                    colors: { 
                      primary: '#2563eb',
                      background: 'white'
                    } 
                  }}
                  accessibilityLabel="Full name input"
                />
                <TextInput
                  label="Phone Number"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({...formData, phone: text})}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="phone-pad"
                  left={<TextInput.Icon icon="phone" color="#2563eb" />}
                  theme={{ 
                    colors: { 
                      primary: '#2563eb',
                      background: 'white'
                    }
                  }}
                  accessibilityLabel="Phone number input"
                />
                </>
              )}

              <TextInput
                label="Email"
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                left={<TextInput.Icon icon="email" color="#2563eb" />}
                theme={{ 
                  colors: { 
                    primary: '#2563eb',
                    background: 'white'
                  } 
                }}
                accessibilityLabel="Email input"
              />

              <TextInput
                label="Password"
                value={formData.password}
                onChangeText={(text) => setFormData({...formData, password: text})}
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
                theme={{ 
                  colors: { 
                    primary: '#2563eb',
                    background: 'white'
                  } 
                }}
                accessibilityLabel="Password input"
              />

              {mode === 'signup' && (
                <TextInput
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
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
                  theme={{ 
                    colors: { 
                      primary: '#2563eb',
                      background: 'white'
                    } 
                  }}
                  accessibilityLabel="Confirm password input"
                />
              )}

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
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}