export const sendCustomVerificationEmail = async (user, role) => {
  try {
    // Get Firebase action link
    const actionCodeSettings = {
      url: `exp://192.168.1.10:8081/--/verify-success?role=${role}`,
      handleCodeInApp: true
    };
    
    // Get CSRF token
    const csrfResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.10:5000'}/api/csrf-token`);
    const csrfData = await csrfResponse.json();
    
    // Send custom email via backend
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.10:5000'}/api/auth/send-custom-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfData.token
      },
      body: JSON.stringify({
        email: user.email,
        name: user.displayName,
        role: role,
        uid: user.uid
      })
    });
    
    return response.json();
  } catch (error) {
    console.error('Custom email error:', error);
    throw error;
  }
};