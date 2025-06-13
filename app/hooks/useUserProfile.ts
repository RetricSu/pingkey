"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/auth";
import { useNostr } from "../contexts/nostr";
import { useLocalStorage } from "./useLocalStorage";
import { UserInfoCache, Profile } from "../lib/type";
import {
  LocalStorageKeys,
  USER_INFO_CACHE_EXPIRED_MS,
  defaultProfile,
} from "../lib/config";

interface UseUserProfileReturn {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserProfile(targetPubkey?: string): UseUserProfileReturn {
  const { pubkey: currentUserPubkey } = useAuth();
  const { nostr } = useNostr();
  const [userInfoCache, setUserInfoCache] =
    useLocalStorage<UserInfoCache | null>(
      LocalStorageKeys.userInfoCacheKey,
      null
    );

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use targetPubkey if provided, otherwise use current user's pubkey
  const pubkeyToFetch = targetPubkey || currentUserPubkey;

  const isCacheValid = useCallback(
    (cache: UserInfoCache | null): boolean => {
      if (!cache || !cache.profile || !cache.updatedAt) {
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

  const fetchProfile = useCallback(async (): Promise<void> => {
    if (!nostr || !pubkeyToFetch) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const nostrProfile = await nostr.fetchProfile(pubkeyToFetch);

      if (nostrProfile) {
        const profileData: Profile = {
          name: nostrProfile.name || defaultProfile.name,
          picture: nostrProfile.picture || defaultProfile.picture,
          about: nostrProfile.about || defaultProfile.about,
          nip05: nostrProfile.nip05,
          lud16: nostrProfile.lud16,
          website: nostrProfile.website,
        };

        setProfile(profileData);

        // Update cache only if this is for the current user
        if (pubkeyToFetch === currentUserPubkey && userInfoCache) {
          setUserInfoCache({
            ...userInfoCache,
            profile: profileData,
            updatedAt: Date.now(),
          });
        }
      } else {
        // Profile not found, use default profile
        setProfile(defaultProfile);
      }
    } catch (err) {
      setError("Failed to fetch profile");
      console.error("Error fetching profile:", err);
      setProfile(defaultProfile);
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
    await fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!pubkeyToFetch) {
      setIsLoading(false);
      setProfile(null);
      return;
    }

    // Check if we should use cache (only for current user)
    if (pubkeyToFetch === currentUserPubkey && isCacheValid(userInfoCache)) {
      setProfile(userInfoCache!.profile!);
      setIsLoading(false);
      return;
    }

    // Cache is invalid or this is not the current user, fetch from network
    fetchProfile();
  }, [
    pubkeyToFetch,
    currentUserPubkey,
    userInfoCache,
    isCacheValid,
    fetchProfile,
  ]);

  return {
    profile,
    isLoading,
    error,
    refetch,
  };
}
