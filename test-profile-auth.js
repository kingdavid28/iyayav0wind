// Quick test script to debug profile authentication issue
const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000/api';

async function testProfileAuth() {
  console.log('🧪 Testing profile authentication...');
  
  // Test 1: Health check
  try {
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return;
  }
  
  // Test 2: Try to access profile without token
  try {
    const noTokenResponse = await fetch(`${API_URL}/profile`);
    console.log('🔒 No token response status:', noTokenResponse.status);
    const noTokenData = await noTokenResponse.json();
    console.log('🔒 No token response:', noTokenData);
  } catch (error) {
    console.log('❌ No token test failed:', error.message);
  }
  
  // Test 3: Try with mock Firebase token format
  const mockFirebaseToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vaXlheWFnaXQiLCJhdWQiOiJpeWF5YWdpdCIsImF1dGhfdGltZSI6MTczNzU0NzIwMCwidXNlcl9pZCI6InM3VGI1cHRhWENXTllDME1vVHJER2htazAzOTMiLCJzdWIiOiJzN1RiNXB0YVhDV05ZQzBNb1RyREdobWswMzkzIiwiaWF0IjoxNzM3NTQ3MjAwLCJleHAiOjE3Mzc1NTA4MDAsImVtYWlsIjoia2Vuc2l0ZTI0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbImtlbnNpdGUyNEBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.mock-signature';
  
  try {
    const mockTokenResponse = await fetch(`${API_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${mockFirebaseToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('🔥 Mock Firebase token response status:', mockTokenResponse.status);
    const mockTokenData = await mockTokenResponse.json();
    console.log('🔥 Mock Firebase token response:', mockTokenData);
  } catch (error) {
    console.log('❌ Mock Firebase token test failed:', error.message);
  }
}

testProfileAuth().catch(console.error);