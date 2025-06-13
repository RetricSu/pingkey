"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Nostr } from "../lib/nostr";
import { Event, EventTemplate } from "nostr-tools/core";
import { CryptoUtils } from "app/lib/crypto";
import { finalizeEvent } from "nostr-tools/pure";

interface NostrContextType {
  nostr: Nostr | null;
  signEvent: (eventData: EventTemplate) => Promise<Event>;
  destroyNostr: () => void;
}

const NostrContext = createContext<NostrContextType | undefined>(undefined);

interface NostrProviderProps {
  children: ReactNode;
}

export function NostrProvider({ children }: NostrProviderProps) {
  const [nostr, setNostr] = useState<Nostr | null>(null);

  const initializeNostr = () => {
    const nostrInstance = new Nostr();

    nostrInstance.setRequestPublicKey(async () => {
      const pubkey = localStorage.getItem("nostr_pubkey");
      if (!pubkey) {
        throw new Error("No public key found");
      }
      return pubkey;
    });

    nostrInstance.setSignEventCallback(async (eventData) => {
      try {
        const encryptedPrivateKey = localStorage.getItem(
          "nostr_encrypted_private_key"
        );
        if (!encryptedPrivateKey) {
          throw new Error("No encrypted private key found");
        }

        const password = prompt("Enter your password");
        if (!password) {
          throw new Error("Password not set");
        }

        const privateKey = await CryptoUtils.decrypt(
          encryptedPrivateKey,
          password
        );

        return finalizeEvent(
          eventData,
          new Uint8Array(Buffer.from(privateKey, "hex"))
        );
      } catch (error) {
        console.error("Failed to export private key:", error);
        throw error;
      }
    });

    setNostr(nostrInstance);
  };

  const signEvent = async (eventData: EventTemplate): Promise<Event> => {
    if (!nostr) {
      throw new Error("Nostr not initialized");
    }
    if (!nostr.signEventCallback) {
      throw new Error("Sign event callback not set");
    }
    if (!nostr.requestPublicKey) {
      throw new Error("request Public key not set");
    }

    return await nostr.signEventCallback(eventData);
  };

  const destroyNostr = () => {
    if (nostr) {
      nostr.destroy();
    }
    setNostr(null);
  };

  useEffect(() => {
    initializeNostr();
  }, []);

  const value: NostrContextType = {
    nostr,
    signEvent,
    destroyNostr,
  };

  return (
    <NostrContext.Provider value={value}>{children}</NostrContext.Provider>
  );
}

export function useNostr(): NostrContextType {
  const context = useContext(NostrContext);
  if (context === undefined) {
    throw new Error("useNostr must be used within a NostrProvider");
  }
  return context;
}
