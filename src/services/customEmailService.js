export const sendCustomVerificationEmail = async (user, role) => {
  try {
    // Get Firebase action link
    const actionCodeSettings = {
      url: `exp://192.168.1.10:8081/--/verify-success?role=${role}`,
      handleCodeInApp: true
    };
    
    // Send custom email via backend
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.10:5000'}/api/auth/send-custom-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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