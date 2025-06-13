"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { CryptoUtils } from "app/lib/crypto";
import { Nostr } from "../lib/nostr";

interface AuthContextType {
  isSignedIn: boolean;
  pubkey: string | null;
  signIn: (privateKey: string, password: string) => Promise<void>;
  signOut: () => void;
  generateNewKey: (
    password: string
  ) => Promise<{ secretKey: string; publicKey: string }>;
  exportPrivateKey: (password: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [pubkey, setPubkey] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const storedPubkey = localStorage.getItem("nostr_pubkey");
    if (storedPubkey) {
      setPubkey(storedPubkey);
      setIsSignedIn(true);
    }
  }, []);

  const signIn = async (
    privateKey: string,
    password: string
  ): Promise<void> => {
    try {
      // Get public key from private key
      const nostrInstance = new Nostr();
      const publicKey = nostrInstance.getPublicKeyFromPrivateKey(privateKey);
      if (!publicKey) {
        throw new Error("Invalid private key");
      }

      // Encrypt and store private key
      const encryptedPrivateKey = await CryptoUtils.encrypt(
        privateKey,
        password
      );
      localStorage.setItem("nostr_encrypted_private_key", encryptedPrivateKey);
      localStorage.setItem("nostr_pubkey", publicKey);

      // Update state
      setPubkey(publicKey);
      setIsSignedIn(true);
    } catch (error) {
      console.error("Sign in failed:", error);
      throw error;
    }
  };

  const signOut = (): void => {
    // Clear localStorage
    localStorage.removeItem("nostr_encrypted_private_key");
    localStorage.removeItem("nostr_pubkey");

    // Clear state
    setPubkey(null);
    setIsSignedIn(false);
  };

  const exportPrivateKey = async (password: string): Promise<string> => {
    if (!isSignedIn) {
      throw new Error("Not signed in");
    }

    try {
      const encryptedPrivateKey = localStorage.getItem(
        "nostr_encrypted_private_key"
      );
      if (!encryptedPrivateKey) {
        throw new Error("No encrypted private key found");
      }

      const privateKey = await CryptoUtils.decrypt(
        encryptedPrivateKey,
        password
      );

      return privateKey;
    } catch (error) {
      console.error("Failed to export private key:", error);
      throw error;
    }
  };

  const generateNewKey = async (
    password: string
  ): Promise<{ secretKey: string; publicKey: string }> => {
    const nostrInstance = new Nostr();
    const keyPair = nostrInstance.generateNewKey();

    // Encrypt and store the new private key
    const encryptedPrivateKey = await CryptoUtils.encrypt(
      keyPair.secretKey,
      password
    );
    localStorage.setItem("nostr_encrypted_private_key", encryptedPrivateKey);
    localStorage.setItem("nostr_pubkey", keyPair.publicKey);

    // Update state
    setPubkey(keyPair.publicKey);
    setIsSignedIn(true);

    return keyPair;
  };

  const value: AuthContextType = {
    isSignedIn,
    pubkey,
    signIn,
    signOut,
    exportPrivateKey,
    generateNewKey,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
