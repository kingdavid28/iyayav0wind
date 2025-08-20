import { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Image, 
  TouchableOpacity, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  ActivityIndicator,
  Keyboard
} from "react-native";
import { TextInput, Button, useTheme } from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { validator } from "../utils/validator";

const ParentAuth = ({ navigation, route }) => {
  const theme = useTheme();
  const {
    login,
    signup,
    signInWithGoogle,
    signInWithFacebook,
    resetPassword,
    resendVerificationEmail,
    loading: authLoading,
    error: authError,
    isEmailVerified,
    user
  } = useAuth();
  
  const [mode, setMode] = useState(route.params?.mode || 'login'); // 'login' or 'signup' or 'reset'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

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

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    try {
      validator.validateEmail(formData.email);
    } catch (error) {
      errors.email = error.message;
    }
    
    if (mode !== 'reset') {
      try {
        validator.validatePassword(formData.password);
      } catch (error) {
        errors.password = error.message;
      }
      
      if (mode === 'signup') {
        try {
          validator.validateName(formData.name);
        } catch (error) {
          errors.name = error.message;
        }
        
        if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    Keyboard.dismiss();
    
    if (!validateForm()) {
      return;
    }
    
    const { email, password, name, phone } = formData;
    setIsSubmitting(true);
    
    try {
      if (mode === 'login') {
        await login(email, password);
        // Navigation handled in AuthContext state change
      } else if (mode === 'signup') {
        await signup(email, password, { name, phone });
        setVerificationSent(true);
        Alert.alert("Verify Your Email", "A verification email has been sent. Please check your inbox.");
      } else if (mode === 'reset') {
        await resetPassword(email);
        setResetSent(true);
        Alert.alert("Password Reset", "If an account exists with this email, you'll receive a password reset link.");
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert("Error", error.message || "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
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
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8fafc',
    },
    authCard: {
      backgroundColor: 'white',
      borderRadius: 16,
      padding: Platform.select({
        web: 12,
        default: 24
      }),
      width: Platform.select({
        web: '50%',
        default: '100%'
      }),
      maxWidth: Platform.select({
        web: 400,
        default: undefined
      }),
      alignSelf: Platform.select({
        web: 'center',
        default: 'auto'
      }),
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4
    },
    header: {
      flexDirection: 'row',
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
      marginTop: 100,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoBackground: {
  width: Platform.select({
    web: 165,    // 50% larger (110 * 1.5)
    default: 110 // Original mobile size
  }),
  height: Platform.select({
    web: 165,    // 50% larger
    default: 110
  }),
  borderRadius: Platform.select({
    web: 60,     // Scaled proportionally (40 * 1.5)
    default: 40
  }),
  alignItems: 'center',
  justifyContent: 'center',
},
logo: {
  width: Platform.select({
    web: 120,    // 50% larger (80 * 1.5)
    default: 80  // Original mobile size
  }),
  height: Platform.select({
    web: 120,
    default: 80
  }),
},
    appTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#9d174d',
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
      padding: Platform.select({
        web: 12,    // Smaller padding for web
        default: 24  // Original padding for mobile
      }),
      width: Platform.select({
        web: '50%',  // 50% width on web
        default: '100%' // Full width on mobile
      }),
      maxWidth: Platform.select({
        web: 400,    // Optional: Set a max-width for web
        default: undefined
      }),
      alignSelf: Platform.select({
        web: 'center', // Center the card on web
        default: 'auto'
      }),
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4
    },
    parentCard: {
      borderTopWidth: 4,
      borderTopColor: '#fbcfe8'
    },
    userTypeIndicator: {
      alignItems: 'center',
      marginBottom: 24
    },
    parentIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16
    },
    authTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#db2777',
      textAlign: 'center'
    },
    formContainer: {
      marginTop: 16
    },
    input: {
      marginBottom: 16,
      backgroundColor: 'white'
    },
    button: {
      marginTop: 16,
      borderRadius: 8,
      paddingVertical: 8,
      backgroundColor: '#db2777'
    },
    buttonText: {
      color: 'white',
      fontWeight: 'bold'
    },
    toggleText: {
      marginTop: 16,
      textAlign: 'center',
      color: '#6b7280'
    },
    toggleLink: {
      color: '#db2777',
      fontWeight: 'bold'
    },
    errorText: {
      color: '#ef4444',
      fontSize: 12,
      marginTop: -8,
      marginBottom: 8
    },
    successText: {
      color: '#10b981',
      textAlign: 'center',
      marginBottom: 16
    },
    // Added missing styles used in JSX and improved layout
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: '#111827',
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 4,
      fontSize: 14,
      color: '#6b7280',
      textAlign: 'center',
    },
    errorContainer: {
      marginTop: 12,
      padding: 10,
      borderRadius: 8,
      backgroundColor: '#fee2e2',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    successContainer: {
      marginTop: 12,
      padding: 10,
      borderRadius: 8,
      backgroundColor: '#d1fae5',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dividerContainer: {
      marginVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    divider: {
      height: 1,
      backgroundColor: '#e5e7eb',
      flex: 1,
    },
    dividerText: {
      color: '#6b7280',
      fontSize: 12,
    },
    socialButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
    },
    socialButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: '#fff',
      borderRadius: 8,
      borderWidth: Platform.select({ web: 1, default: 0 }),
      borderColor: '#e5e7eb',
      elevation: Platform.select({ default: 2, web: 0 }),
    },
    scrollContainer: {
      paddingBottom: 24,
    },
    form: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
  });

  // Social login handler
  const handleSocialLogin = async (provider) => {
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else if (provider === 'facebook') {
        await signInWithFacebook();
      }
      // Navigation is handled by AuthContext user state change in AppNavigator
    } catch (error) {
      console.error('Social login error:', error);
      Alert.alert("Error", error.message || "An error occurred during social login");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <LinearGradient 
        colors={['#fce8f4', '#e0f2fe']}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {mode === 'login' 
                ? 'Welcome Back' 
                : mode === 'signup' 
                  ? 'Create Account' 
                  : 'Reset Password'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'login' 
                ? 'Sign in to continue' 
                : mode === 'signup' 
                  ? 'Create an account to get started'
                  : 'Enter your email to reset your password'}
            </Text>
            
            {authError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#dc2626" />
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            )}
            
            {verificationSent && (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.successText}>
                  Verification email sent! Please check your inbox.
                </Text>
              </View>
            )}
            
            {resetSent && (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.successText}>
                  If an account exists with this email, you'll receive a password reset link.
                </Text>
              </View>
            )}
          </View>
          <View style={styles.form}>
            {mode === 'signup' && (
              <>
                <TextInput
                  label="Full Name"
                  value={formData.name}
                  onChangeText={(text) => handleChange('name', text)}
                  style={styles.input}
                  mode="outlined"
                  error={!!formErrors.name}
                  left={<TextInput.Icon icon="account" />}
                />
                {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}
                
                <TextInput
                  label="Phone Number"
                  value={formData.phone}
                  onChangeText={(text) => handleChange('phone', text.replace(/[^0-9]/g, ''))}
                  style={[styles.input, { marginTop: 8 }]}
                  mode="outlined"
                  keyboardType="phone-pad"
                  error={!!formErrors.phone}
                  left={<TextInput.Icon icon="phone" />}
                />
                {formErrors.phone && <Text style={styles.errorText}>{formErrors.phone}</Text>}
              </>
            )}
            
            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              style={[styles.input, { marginTop: mode === 'signup' ? 8 : 0 }]}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!formErrors.email}
              left={<TextInput.Icon icon="email" />}
            />
            {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}
            
            {mode !== 'reset' && (
              <>
                <TextInput
                  label="Password"
                  value={formData.password}
                  onChangeText={(text) => handleChange('password', text)}
                  style={[styles.input, { marginTop: 8 }]}
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  error={!!formErrors.password}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />
                {formErrors.password && <Text style={styles.errorText}>{formErrors.password}</Text>}
                
                {mode === 'signup' && (
                  <>
                    <TextInput
                      label="Confirm Password"
                      value={formData.confirmPassword}
                      onChangeText={(text) => handleChange('confirmPassword', text)}
                      style={[styles.input, { marginTop: 8 }]}
                      mode="outlined"
                      secureTextEntry={!showConfirmPassword}
                      error={!!formErrors.confirmPassword}
                      left={<TextInput.Icon icon="lock" />}
                      right={
                        <TextInput.Icon
                          icon={showConfirmPassword ? 'eye-off' : 'eye'}
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        />
                      }
                    />
                    {formErrors.confirmPassword && (
                      <Text style={styles.errorText}>{formErrors.confirmPassword}</Text>
                    )}
                  </>
                )}
              </>
            )}
            
            <Button 
              mode="contained" 
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.button}
              labelStyle={styles.buttonText}
            >
              {mode === 'signup' ? 'Sign Up' : mode === 'reset' ? 'Reset Password' : 'Log In'}
            </Button>
            
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>
            
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleSocialLogin('google')}
              >
                <Ionicons name="logo-google" size={20} color="#db2777" />
                <Text style={{ marginLeft: 8 }}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleSocialLogin('facebook')}
              >
                <Ionicons name="logo-facebook" size={20} color="#db2777" />
                <Text style={{ marginLeft: 8 }}>Facebook</Text>
              </TouchableOpacity>
            </View>
            
            <Pressable onPress={toggleMode} style={styles.toggleText}>
              <Text>
                {mode === 'login' 
                  ? "Don't have an account? " 
                  : "Already have an account? "}
                <Text style={styles.toggleLink}>
                  {mode === 'login' ? 'Sign up' : 'Log in'}
                </Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default ParentAuth;