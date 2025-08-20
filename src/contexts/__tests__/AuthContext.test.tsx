import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { AuthProvider, useAuth } from '../AuthContext';
import { auth } from '../../config/firebase';

// Mock Firebase auth methods
const mockSignInWithEmailAndPassword = jest.fn();
const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSignOut = jest.fn();
const mockSendPasswordResetEmail = jest.fn();
const mockOnAuthStateChanged = jest.fn();

auth.signInWithEmailAndPassword = mockSignInWithEmailAndPassword;
auth.createUserWithEmailAndPassword = mockCreateUserWithEmailAndPassword;
auth.signOut = mockSignOut;
auth.sendPasswordResetEmail = mockSendPasswordResetEmail;
auth.onAuthStateChanged = mockOnAuthStateChanged;

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should provide initial context values', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle login successfully', async () => {
    const testUser = { uid: 'test-uid', email: 'test@example.com' };
    mockSignInWithEmailAndPassword.mockResolvedValueOnce({ user: testUser });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
      auth,
      'test@example.com',
      'password123'
    );
    expect(result.current.error).toBeNull();
  });

  it('should handle login error', async () => {
    const testError = new Error('Invalid credentials');
    mockSignInWithEmailAndPassword.mockRejectedValueOnce(testError);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('wrong@example.com', 'wrongpassword');
    });

    expect(result.current.error).toBe('Failed to sign in. Please try again.');
  });

  it('should handle signup successfully', async () => {
    const testUser = { uid: 'new-user-uid', email: 'new@example.com' };
    mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({ user: testUser });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signup('new@example.com', 'password123');
    });

    expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
      auth,
      'new@example.com',
      'password123'
    );
    expect(result.current.error).toBeNull();
  });

  it('should handle logout', async () => {
    mockSignOut.mockResolvedValueOnce(undefined);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockSignOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('should handle password reset', async () => {
    mockSendPasswordResetEmail.mockResolvedValueOnce(undefined);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.resetPassword('test@example.com');
    });

    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(auth, 'test@example.com');
    expect(result.current.error).toBeNull();
  });
});
