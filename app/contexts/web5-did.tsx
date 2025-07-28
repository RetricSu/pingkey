"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ccc, Signer } from "@ckb-ccc/connector-react";
import { DIDSDK } from "app/lib/web5/did";
import { DIDDocument } from "app/lib/web5/type";

interface Web5DIDContextType {
  didIdentifier: string | null;
  didDocument: DIDDocument | null;
  isLoading: boolean;
  error: string | null;
  createDID: (nostrPublicKey: string, relayUrl: string) => Promise<void>;
  updateDID: (nostrPublicKey: string, relayUrl: string) => Promise<void>;
  refreshDID: () => Promise<void>;
}

const Web5DIDContext = createContext<Web5DIDContextType | undefined>(undefined);

interface Web5DIDProviderProps {
  children: ReactNode;
}

export function Web5DIDProvider({ children }: Web5DIDProviderProps) {
  const { client,signerInfo } = ccc.useCcc();
  
  const [didIdentifier, setDidIdentifier] = useState<string | null>(null);
  const [didDocument, setDidDocument] = useState<DIDDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchForDID = async (sdk: DIDSDK) => {
    try {
      const cells = await sdk.findDIDCells(signerInfo?.signer as Signer);
      if (cells.length > 0) {
        const did = sdk.parseDIDCell(cells[0]);
        setDidDocument(did.didWeb5Data);
        setDidIdentifier(did.didIdentifier);
      } else {
        setDidDocument(null);
        setDidIdentifier(null);
      }
    } catch (err) {
      console.error("Failed to search for DID:", err);
      setError("Failed to search for DID: " + (err as Error).message);
    }
  };

  const refreshDID = async () => {
    if (!signerInfo) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const sdk = new DIDSDK(client);
      await searchForDID(sdk);
    } finally {
      setIsLoading(false);
    }
  };

  const createDID = async (nostrPublicKey: string, relayUrl: string) => {
    if (!signerInfo) {
      throw new Error("No signer available");
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const sdk = new DIDSDK(client);
      const txHash = await sdk.createDID(nostrPublicKey, relayUrl, signerInfo.signer as Signer);
      
      // Wait a moment for the transaction to be processed
      setTimeout(async () => {
        try {
          await searchForDID(sdk);
        } catch (err) {
          console.error("Failed to refresh DID after creation:", err);
        }
      }, 3000);
      
      console.log("DID created with transaction hash:", txHash);
    } catch (err) {
      console.error("Failed to create DID:", err);
      setError("Failed to create DID: " + (err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateDID = async (nostrPublicKey: string, relayUrl: string) => {
    if (!signerInfo) {
      throw new Error("No signer available");
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const sdk = new DIDSDK(client);
      // For updating, we essentially create a new DID with updated information
      const txHash = await sdk.createDID(nostrPublicKey, relayUrl, signerInfo.signer as Signer);
      
      // Wait a moment for the transaction to be processed
      setTimeout(async () => {
        try {
          await searchForDID(sdk);
        } catch (err) {
          console.error("Failed to refresh DID after update:", err);
        }
      }, 3000);
      
      console.log("DID updated with transaction hash:", txHash);
    } catch (err) {
      console.error("Failed to update DID:", err);
      setError("Failed to update DID: " + (err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Search for DID when signerInfo becomes available
  useEffect(() => {
    if (signerInfo) {
      refreshDID();
    } else {
      // Clear DID data when wallet is disconnected
      setDidIdentifier(null);
      setDidDocument(null);
      setError(null);
    }
  }, [signerInfo]);

  const value: Web5DIDContextType = {
    didIdentifier,
    didDocument,
    isLoading,
    error,
    createDID,
    updateDID,
    refreshDID,
  };

  return (
    <Web5DIDContext.Provider value={value}>{children}</Web5DIDContext.Provider>
  );
}

export function useWeb5DID(): Web5DIDContextType {
  const context = useContext(Web5DIDContext);
  if (context === undefined) {
    throw new Error("useWeb5DID must be used within a Web5DIDProvider");
  }
  return context;
} 
