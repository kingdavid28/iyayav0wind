import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { sendEmailVerification } from 'firebase/auth';
import { firebaseAuthService } from '../services/firebaseAuthService';

const EmailVerificationPendingScreen = ({ navigation, route }) => {
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const { email } = route.params || {};

  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      const currentUser = firebaseAuthService.getCurrentUser();
      
      if (currentUser) {
        await sendEmailVerification(currentUser);
        Alert.alert('Email Sent', 'Verification email has been sent to your inbox.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      setIsChecking(true);
      const currentUser = firebaseAuthService.getCurrentUser();
      
      if (currentUser) {
        await currentUser.reload();
        
        if (currentUser.emailVerified) {
          Alert.alert('Email Verified!', 'You can now sign in.', [
            { text: 'Sign In', onPress: () => navigation.navigate('Welcome') }
          ]);
        } else {
          Alert.alert('Not Verified Yet', 'Please check your inbox.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check verification status');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <LinearGradient colors={['#f8fafc', '#e2e8f0']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>📧 Check Your Email</Text>
        <Text style={styles.message}>We've sent a verification link to:</Text>
        <Text style={styles.email}>{email}</Text>
        
        <Button
          mode="contained"
          onPress={handleCheckVerification}
          loading={isChecking}
          style={styles.button}
        >
          I've Verified My Email
        </Button>
        
        <Button
          mode="outlined"
          onPress={handleResendVerification}
          loading={isResending}
          style={styles.button}
        >
          Resend Verification Email
        </Button>
        
        <Button
          mode="text"
          onPress={() => navigation.navigate('Welcome')}
        >
          Back to Sign In
        </Button>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  message: { fontSize: 16, textAlign: 'center', marginBottom: 8 },
  email: { fontSize: 16, fontWeight: '600', color: '#db2777', marginBottom: 32 },
  button: { marginBottom: 12, width: '100%', maxWidth: 300 }
});

export default EmailVerificationPendingScreen;