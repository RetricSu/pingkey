"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/auth";
import { useNostr } from "../contexts/nostr";
import { useLocalStorage } from "./useLocalStorage";
import { UserInfoCache, RelayListItem } from "../lib/type";
import { LocalStorageKeys, USER_INFO_CACHE_EXPIRED_MS } from "../lib/config";
import { useWeb5DID } from "app/contexts/web5-did";

interface UseUserRelayListReturn {
  relayList: RelayListItem[];
  relayListFromDid: RelayListItem[];
  relayListFromNip65: RelayListItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserRelayList(
  targetPubkey?: string
): UseUserRelayListReturn {
  const { pubkey: currentUserPubkey } = useAuth();
  const { nostr } = useNostr();

  const { didDocument } = useWeb5DID();

  const [userInfoCache, setUserInfoCache] =
    useLocalStorage<UserInfoCache | null>(
      LocalStorageKeys.userInfoCacheKey,
      null
    );

  const [relayList, setRelayList] = useState<RelayListItem[]>([]);
  const [relayListFromDid, setRelayListFromDid] = useState<RelayListItem[]>([]);
  const [relayListFromNip65, setRelayListFromNip65] = useState<RelayListItem[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use targetPubkey if provided, otherwise use current user's pubkey
  const pubkeyToFetch =
    targetPubkey || didDocument?.verificationMethods.nostr || currentUserPubkey;

  const isCacheValid = useCallback(
    (cache: UserInfoCache | null): boolean => {
      if (!cache || !cache.relayList || !cache.updatedAt) {
        return false;
      }

      // Check if pubkey matches
      if (cache.pubkey !== pubkeyToFetch) {
        return false;
      }

      // Check if cache is not outdated
      const now = Date.now();
      const isNotOutdated = now - cache.updatedAt < USER_INFO_CACHE_EXPIRED_MS;

      return isNotOutdated;
    },
    [pubkeyToFetch]
  );

  const fetchRelayList = useCallback(async (): Promise<void> => {
    console.log("fetchRelayList, document: ", didDocument);

    // Reset states
    setRelayListFromDid([]);
    setRelayListFromNip65([]);

    if (didDocument?.services.nostr_relays) {
      const relay = didDocument.services.nostr_relays.endpoints;
      const relays = [
        {
          url: relay,
        },
      ];
      setRelayListFromDid(relays);
      if (pubkeyToFetch === currentUserPubkey && userInfoCache) {
        console.debug("useUserRelayList: update cache.");
        setUserInfoCache({
          ...userInfoCache,
          relayList: relays,
          updatedAt: Date.now(),
        });
      }
      console.debug("useUserRelayList: fetched from did document.");
      return;
    }

    if (!nostr || !pubkeyToFetch) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const relays = await nostr.fetchNip65RelayList([pubkeyToFetch]);

      setRelayListFromNip65(relays);

      // Update cache only if this is for the current user
      if (pubkeyToFetch === currentUserPubkey && userInfoCache) {
        console.debug("useUserRelayList: use cache.");
        setUserInfoCache({
          ...userInfoCache,
          relayList: relays,
          updatedAt: Date.now(),
        });
      }
      console.debug("useUserRelayList: fetched from nostr network.");
    } catch (err) {
      setError("Failed to fetch relay list");
      console.error("Error fetching relay list:", err);
      setRelayListFromNip65([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    nostr,
    pubkeyToFetch,
    currentUserPubkey,
    didDocument,
    userInfoCache,
    setUserInfoCache,
  ]);

  const refetch = useCallback(async (): Promise<void> => {
    await fetchRelayList();
  }, [fetchRelayList]);

  // Determine final relay list based on priority: DID first, then NIP-65
  useEffect(() => {
    if (relayListFromDid.length > 0) {
      setRelayList(relayListFromDid);
    } else {
      setRelayList(relayListFromNip65);
    }
  }, [relayListFromDid, relayListFromNip65]);

  useEffect(() => {
    // Check if we should use cache (only for current user)
    if (pubkeyToFetch === currentUserPubkey && isCacheValid(userInfoCache)) {
      console.debug("useRelayList: use cache.");
      setRelayList(userInfoCache!.relayList!);
      setIsLoading(false);
      return;
    }

    // Cache is invalid or this is not the current user, fetch from network
    fetchRelayList();
  }, [
    pubkeyToFetch,
    currentUserPubkey,
    userInfoCache,
    isCacheValid,
    fetchRelayList,
  ]);

  return {
    relayList,
    relayListFromDid,
    relayListFromNip65,
    isLoading,
    error,
    refetch,
  };
}
