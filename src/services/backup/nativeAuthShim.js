// Expo Go native auth shim using Firebase Identity Toolkit REST API
// This is a minimal implementation to enable auth flows in Expo Go
// It does NOT provide full Firebase Auth parity.

import { Platform } from 'react-native'
let AsyncStorage = null
try {
   
  AsyncStorage = require('@react-native-async-storage/async-storage').default
} catch (_) {
  AsyncStorage = null
}

export async function sendEmailVerification(_arg) {
  // _arg can be user or auth; we ignore and use stored idToken
  requiredKey()
  const idToken = await storage.getToken()
  if (!idToken) {
    throw new Error('NO_TOKEN_FOR_VERIFICATION')
  }
  const res = await fetch(`${BASE}/accounts:sendOobCode?key=${API_KEY}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requestType: 'VERIFY_EMAIL', idToken })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'VERIFY_EMAIL_FAILED')
  return true
}

const API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY
const BASE = 'https://identitytoolkit.googleapis.com/v1'

const requiredKey = () => {
  if (!API_KEY) {
    throw new Error('EXPO_PUBLIC_FIREBASE_API_KEY missing for nativeAuthShim')
  }
}

const storage = {
  async setToken(token) {
    if (!AsyncStorage) return
    try { await AsyncStorage.setItem('@shim_id_token', token) } catch (error) {
      console.warn('Token storage error:', error);
    }
  },
  async getToken() {
    if (!AsyncStorage) return null
    try { return await AsyncStorage.getItem('@shim_id_token') } catch (error) {
      console.warn('Token retrieval error:', error);
      return null;
    }
  },
  async clear() {
    if (!AsyncStorage) return
    try { await AsyncStorage.removeItem('@shim_id_token') } catch (error) {
      console.warn('Token removal error:', error);
    }
  }
}

const toUser = (payload) => {
  if (!payload) return null
  return {
    uid: payload.localId || payload.userId || null,
    email: payload.email || null,
    getIdToken: async () => payload.idToken || (await storage.getToken()),
  }
}

export async function signInWithEmailAndPassword(_auth, email, password) {
  requiredKey()
  const res = await fetch(`${BASE}/accounts:signInWithPassword?key=${API_KEY}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'SIGN_IN_FAILED')
  await storage.setToken(data.idToken)
  return { user: toUser(data) }
}

export async function createUserWithEmailAndPassword(_auth, email, password) {
  requiredKey()
  const res = await fetch(`${BASE}/accounts:signUp?key=${API_KEY}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'SIGN_UP_FAILED')
  await storage.setToken(data.idToken)
  return { user: toUser(data) }
}

export async function sendPasswordResetEmail(_auth, email) {
  requiredKey()
  const res = await fetch(`${BASE}/accounts:sendOobCode?key=${API_KEY}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requestType: 'PASSWORD_RESET', email })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'RESET_FAILED')
}

export async function signOut(_auth) {
  await storage.clear()
}

export function onAuthStateChanged(_auth, callback) {
  // One-time emit from stored token (no persistence events in Expo Go)
  let cancelled = false
  ;(async () => {
    const token = await storage.getToken()
    if (cancelled) return
    callback(token ? { uid: 'shim', email: null, getIdToken: async () => token } : null)
  })()
  return () => { cancelled = true }
}

// Unsupported in shim (provide no-ops or simple fallbacks)
export function updateProfile() { throw new Error('updateProfile not supported in Expo Go shim') }
export class GoogleAuthProvider {}
export function signInWithPopup() { throw new Error('signInWithPopup not supported in Expo Go shim') }
export function signInWithCredential() { throw new Error('signInWithCredential not supported in Expo Go shim') }
export async function fetchSignInMethodsForEmail(_auth, email) {
  requiredKey()
  const res = await fetch(`${BASE}/createAuthUri?key=${API_KEY}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ identifier: email, continueUri: 'https://localhost' })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'FETCH_METHODS_FAILED')
  return data.allProviders || []
}

export default {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  fetchSignInMethodsForEmail,
}
