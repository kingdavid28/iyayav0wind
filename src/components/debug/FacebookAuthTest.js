import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import FacebookSignInButton from '../auth/FacebookSignInButton';

/**
 * Debug component for testing Facebook authentication
 * Use this to isolate and test Facebook auth issues
 */
const FacebookAuthTest = () => {
  const [testResults, setTestResults] = useState([]);

  const addTestResult = (test, result, details = '') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, {
      test,
      result,
      details,
      timestamp
    }]);
  };

  const testEnvironmentVariables = () => {
    console.log('🧪 Testing Environment Variables...');
    
    const appId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
    const appSecret = process.env.EXPO_PUBLIC_FACEBOOK_APP_SECRET;
    
    if (!appId) {
      addTestResult('Environment Variables', '❌ FAIL', 'Facebook App ID not found');
      return;
    }
    
    if (!appSecret) {
      addTestResult('Environment Variables', '❌ FAIL', 'Facebook App Secret not found');
      return;
    }
    
    addTestResult('Environment Variables', '✅ PASS', `App ID: ${appId.substring(0, 8)}...`);
    
    console.log('Environment check results:', {
      appId: appId ? `${appId.substring(0, 8)}...` : 'NOT SET',
      appSecret: appSecret ? 'SET' : 'NOT SET'
    });
  };

  const testFacebookAuth = async (userRole) => {
    console.log(`🧪 Testing Facebook Auth for ${userRole}...`);
    addTestResult(`Facebook Auth (${userRole})`, '⏳ TESTING', 'Starting authentication...');
  };

  const handleFacebookSuccess = (result, userRole) => {
    console.log('✅ Facebook auth test successful:', result);
    addTestResult(`Facebook Auth (${userRole})`, '✅ SUCCESS', `User: ${result.user?.name || 'Unknown'}`);
    
    Alert.alert(
      'Facebook Auth Success!',
      `Successfully signed in as ${result.user?.name || 'Unknown User'} (${userRole})`,
      [{ text: 'OK' }]
    );
  };

  const handleFacebookError = (error, userRole) => {
    console.error('❌ Facebook auth test failed:', error);
    addTestResult(`Facebook Auth (${userRole})`, '❌ FAIL', error.message);
    
    Alert.alert(
      'Facebook Auth Failed',
      `Error: ${error.message}`,
      [{ text: 'OK' }]
    );
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Facebook Auth Debug Console</Text>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Environment Tests</Text>
        <Button 
          mode="outlined" 
          onPress={testEnvironmentVariables}
          style={styles.testButton}
        >
          Test Environment Variables
        </Button>
      </View>

      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Authentication Tests</Text>
        
        <FacebookSignInButton
          userRole="parent"
          onSuccess={(result) => handleFacebookSuccess(result, 'parent')}
          onError={(error) => handleFacebookError(error, 'parent')}
          onPress={() => testFacebookAuth('parent')}
          style={styles.facebookButton}
        />
        
        <FacebookSignInButton
          userRole="caregiver"
          onSuccess={(result) => handleFacebookSuccess(result, 'caregiver')}
          onError={(error) => handleFacebookError(error, 'caregiver')}
          onPress={() => testFacebookAuth('caregiver')}
          style={styles.facebookButton}
        />
      </View>

      <View style={styles.resultsSection}>
        <View style={styles.resultsHeader}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          <Button 
            mode="text" 
            onPress={clearResults}
            compact
          >
            Clear
          </Button>
        </View>
        
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>No test results yet. Run some tests above.</Text>
        ) : (
          testResults.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <Text style={styles.resultTest}>{result.test}</Text>
              <Text style={styles.resultStatus}>{result.result}</Text>
              {result.details && (
                <Text style={styles.resultDetails}>{result.details}</Text>
              )}
              <Text style={styles.resultTime}>{result.timestamp}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Debug Information</Text>
        <Text style={styles.infoText}>
          App ID: {process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || 'NOT SET'}
        </Text>
        <Text style={styles.infoText}>
          App Secret: {process.env.EXPO_PUBLIC_FACEBOOK_APP_SECRET ? 'SET' : 'NOT SET'}
        </Text>
        <Text style={styles.infoText}>
          Current Time: {new Date().toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  testSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  testButton: {
    marginVertical: 4,
  },
  facebookButton: {
    marginVertical: 4,
  },
  resultsSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    maxHeight: 300,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noResults: {
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  resultItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  resultTest: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  resultStatus: {
    fontSize: 14,
    marginTop: 2,
  },
  resultDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  resultTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  infoSection: {
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    padding: 16,
    elevation: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default FacebookAuthTest;
