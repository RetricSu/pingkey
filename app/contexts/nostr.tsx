"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Nostr } from "../lib/nostr/nostr";
import { CryptoUtils } from "app/lib/crypto";
import { finalizeEvent } from "nostr-tools/pure";
import { UserInfoCache } from "app/lib/type";
import { useLocalStorage } from "app/hooks/useLocalStorage";
import { LocalStorageKeys } from "app/lib/config";
import { prompt } from "app/components/gadget/dialog";

interface NostrContextType {
  nostr: Nostr | null;
  destroyNostr: () => void;
}

const NostrContext = createContext<NostrContextType | undefined>(undefined);

interface NostrProviderProps {
  children: ReactNode;
}

export function NostrProvider({ children }: NostrProviderProps) {
  const [userInfoCache] = useLocalStorage<UserInfoCache | null>(
    LocalStorageKeys.userInfoCacheKey,
    null
  );
  const [nostr, setNostr] = useState<Nostr | null>(null);

  const initializeNostr = () => {
    const nostrInstance = new Nostr();

    nostrInstance.setRequestPublicKey(async () => {
      const pubkey = userInfoCache?.pubkey;
      if (!pubkey) {
        throw new Error("No public key found");
      }
      return pubkey;
    });

    nostrInstance.setRequestSignEvent(async (eventData) => {
      try {
        const encryptedPrivateKey = userInfoCache?.encryptedPrivateKey;
        if (!encryptedPrivateKey) {
          throw new Error("No encrypted private key found");
        }

        const password = await prompt(
          "Enter your password",
          "Please enter your password to sign the event:",
          "",
          {
            type: "password",
            placeholder: "Enter password",
            confirmLabel: "Sign",
          }
        );
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
