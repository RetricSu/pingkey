'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Nostr } from '../lib/nostr';
import { CryptoUtils } from 'app/lib/crypto';

interface AuthContextType {
  isSignedIn: boolean;
  pubkey: string | null;
  nostr: Nostr | null;
  signIn: (privateKey: string, password: string) => Promise<void>;
  signOut: () => void;
  generateNewKey: (password: string) => Promise<{ secretKey: string; publicKey: string }>;
  signEvent: (eventData: any, password: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [nostr, setNostr] = useState<Nostr | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const storedPubkey = localStorage.getItem('nostr_pubkey');
    if (storedPubkey) {
      setPubkey(storedPubkey);
      setIsSignedIn(true);
      
      // Initialize Nostr instance without private key for read-only operations
      const nostrInstance = new Nostr();
      setNostr(nostrInstance);
    }
  }, []);

  const signIn = async (privateKey: string, password: string): Promise<void> => {
    try {
      // Initialize Nostr instance and set the private key
      const nostrInstance = new Nostr();
      nostrInstance.setSecretKey(privateKey);
      
      const publicKey = nostrInstance.getPublicKey();
      if (!publicKey) {
        throw new Error('Invalid private key');
      }

      // Encrypt and store private key
      const encryptedPrivateKey = await CryptoUtils.encrypt(privateKey, password);
      localStorage.setItem('nostr_encrypted_private_key', encryptedPrivateKey);
      
      // Store public key
      localStorage.setItem('nostr_pubkey', publicKey);

      // Update state
      setPubkey(publicKey);
      setIsSignedIn(true);
      setNostr(nostrInstance);

    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  const signOut = (): void => {
    // Clear localStorage
    localStorage.removeItem('nostr_encrypted_private_key');
    localStorage.removeItem('nostr_pubkey');

    // Clear state
    setPubkey(null);
    setIsSignedIn(false);
    
    // Clean up Nostr instance
    if (nostr) {
      nostr.destroy();
    }
    setNostr(null);
  };

  const generateNewKey = async (password: string): Promise<{ secretKey: string; publicKey: string }> => {
    const nostrInstance = new Nostr();
    const keyPair = nostrInstance.generateNewKey();
    
    // Encrypt and store the new private key
    const encryptedPrivateKey = await CryptoUtils.encrypt(keyPair.secretKey, password);
    localStorage.setItem('nostr_encrypted_private_key', encryptedPrivateKey);
    localStorage.setItem('nostr_pubkey', keyPair.publicKey);

    // Update state
    setPubkey(keyPair.publicKey);
    setIsSignedIn(true);
    setNostr(nostrInstance);

    return keyPair;
  };

  // Function to unlock private key for operations that require it
  const unlockPrivateKey = async (password: string): Promise<Nostr | null> => {
    if (!isSignedIn || !nostr) return null;

    try {
      const encryptedPrivateKey = localStorage.getItem('nostr_encrypted_private_key');
      if (!encryptedPrivateKey) {
        throw new Error('No encrypted private key found');
      }

      const privateKey = await CryptoUtils.decrypt(encryptedPrivateKey, password);
      nostr.setSecretKey(privateKey);
      return nostr;
    } catch (error) {
      console.error('Failed to unlock private key:', error);
      throw error;
    }
  };

  const signEvent = async (eventData: any, password: string): Promise<any> => {
    if (!isSignedIn || !nostr) {
      throw new Error('Not signed in');
    }

    try {
      const encryptedPrivateKey = localStorage.getItem('nostr_encrypted_private_key');
      if (!encryptedPrivateKey) {
        throw new Error('No encrypted private key found');
      }

      const privateKey = await CryptoUtils.decrypt(encryptedPrivateKey, password);
      nostr.setSecretKey(privateKey);
      
      // Use finalizeEvent from nostr-tools to sign the event
      const { finalizeEvent } = await import('nostr-tools/pure');
      return finalizeEvent(eventData, new Uint8Array(Buffer.from(privateKey, 'hex')));
    } catch (error) {
      console.error('Failed to sign event:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    isSignedIn,
    pubkey,
    nostr,
    signIn,
    signOut,
    generateNewKey,
    signEvent,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export the CryptoUtils for use in components that need to unlock private key
export { CryptoUtils }; 
