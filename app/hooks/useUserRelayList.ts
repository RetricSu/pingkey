"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/auth";
import { useNostr } from "../contexts/nostr";
import { useLocalStorage } from "./useLocalStorage";
import { UserInfoCache, RelayListItem } from "../lib/type";
import { LocalStorageKeys, USER_INFO_CACHE_EXPIRED_MS } from "../lib/config";

interface UseUserRelayListReturn {
  relayList: RelayListItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserRelayList(
  targetPubkey?: string
): UseUserRelayListReturn {
  const { pubkey: currentUserPubkey } = useAuth();
  const { nostr } = useNostr();
  const [userInfoCache, setUserInfoCache] =
    useLocalStorage<UserInfoCache | null>(
      LocalStorageKeys.userInfoCacheKey,
      null
    );

  const [relayList, setRelayList] = useState<RelayListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use targetPubkey if provided, otherwise use current user's pubkey
  const pubkeyToFetch = targetPubkey || currentUserPubkey;

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
    if (!nostr || !pubkeyToFetch) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const relays = await nostr.fetchNip65RelayList([pubkeyToFetch]);

      setRelayList(relays);

      // Update cache only if this is for the current user
      if (pubkeyToFetch === currentUserPubkey && userInfoCache) {
        setUserInfoCache({
          ...userInfoCache,
          relayList: relays,
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      setError("Failed to fetch relay list");
      console.error("Error fetching relay list:", err);
      setRelayList([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    nostr,
    pubkeyToFetch,
    currentUserPubkey,
    userInfoCache,
    setUserInfoCache,
  ]);

  const refetch = useCallback(async (): Promise<void> => {
    await fetchRelayList();
  }, [fetchRelayList]);

  useEffect(() => {
    if (!pubkeyToFetch) {
      setIsLoading(false);
      setRelayList([]);
      return;
    }

    // Check if we should use cache (only for current user)
    if (pubkeyToFetch === currentUserPubkey && isCacheValid(userInfoCache)) {
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
    isLoading,
    error,
    refetch,
  };
}
