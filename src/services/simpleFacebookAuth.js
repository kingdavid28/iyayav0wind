// Simple Facebook Authentication Service for Testing
// This bypasses OAuth complexity and provides a working Facebook login for development

class SimpleFacebookAuth {
  /**
   * Simple Facebook sign-in that always works
   */
  async signIn(userRole = 'parent') {
    try {
      console.log('🔵 Starting simple Facebook sign-in for role:', userRole);
      
      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create mock Facebook user data
      const mockUser = {
        uid: `facebook_${Date.now()}`,
        email: `facebook.user.${userRole}@example.com`,
        name: `Facebook ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}`,
        firstName: 'Facebook',
        lastName: userRole.charAt(0).toUpperCase() + userRole.slice(1),
        profileImage: 'https://via.placeholder.com/150/1877F2/FFFFFF?text=FB',
        role: userRole,
        emailVerified: true,
        authProvider: 'facebook',
        facebookId: `fb_${Date.now()}`,
      };

      console.log('✅ Mock Facebook user created:', mockUser);

      // Try to sync with backend
      try {
        await this.syncWithBackend(mockUser);
        console.log('✅ Backend sync successful');
      } catch (syncError) {
        console.warn('⚠️ Backend sync failed, continuing anyway:', syncError.message);
      }

      return {
        success: true,
        user: mockUser,
        token: `mock_fb_token_${Date.now()}`,
        isMockAuth: true
      };

    } catch (error) {
      console.error('❌ Simple Facebook auth error:', error);
      throw new Error('Facebook sign-in failed. Please try again.');
    }
  }

  /**
   * Sync user data with backend
   */
  async syncWithBackend(userData) {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.9:5000';
    
    console.log('🔄 Syncing with backend:', API_URL);
    
    const syncData = {
      firebaseUid: userData.uid,
      email: userData.email,
      name: userData.name,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImage: userData.profileImage,
      role: userData.role,
      emailVerified: userData.emailVerified,
      authProvider: userData.authProvider,
      facebookId: userData.facebookId,
    };

    const response = await fetch(`${API_URL}/api/auth/firebase-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(syncData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Backend sync failed');
    }

    return await response.json();
  }
}

// Export singleton instance
const simpleFacebookAuth = new SimpleFacebookAuth();
export default simpleFacebookAuth;
