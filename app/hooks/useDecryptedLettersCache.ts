"use client";

import { useCallback, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { LocalStorageKeys } from "app/lib/config";
import { useAuth } from "app/contexts/auth";

export interface DecryptedLetter {
  from: string;
  subject?: string | null;
  content: string;
  receivedAt: number;
  deliveryEventId: string;
  replyToEventId: string;
}

interface CachedLetter {
  decryptedContent: DecryptedLetter;
  cachedAt: number;
  lastAccessed: number;
}

type DecryptedLettersCache = Record<string, CachedLetter>;

export function useDecryptedLettersCache() {
  const { pubkey } = useAuth();
  
  // Create a user-specific cache key
  const cacheKey = pubkey ? `${LocalStorageKeys.decryptedLettersKey}_${pubkey}` : LocalStorageKeys.decryptedLettersKey;
  
  const [cache, setCache, removeCache] = useLocalStorage<DecryptedLettersCache>(
    cacheKey,
    {}
  );
  
  // Reload cache from localStorage to ensure freshness
  const reloadCache = useCallback(() => {
    try {
      const stored = window.localStorage.getItem(cacheKey);
      if (stored) {
        const parsedCache = JSON.parse(stored);
        setCache(parsedCache);
      }
    } catch (error) {
      console.error("Failed to reload cache:", error);
    }
  }, [cacheKey, setCache]);
  
  // Force re-render trigger
  const [forceUpdate, setForceUpdate] = useState(0);

  // Check if a letter is cached
  const isLetterCached = useCallback((eventId: string): boolean => {
    return eventId in cache;
  }, [cache, forceUpdate]);

  // Get cached letter
  const getCachedLetter = useCallback((eventId: string): DecryptedLetter | null => {
    const cachedEntry = cache[eventId];
    if (!cachedEntry) return null;

    return cachedEntry.decryptedContent;
  }, [cache, forceUpdate]);

  // Cache a decrypted letter
  const cacheDecryptedLetter = useCallback((eventId: string, decryptedContent: DecryptedLetter) => {
    const now = Date.now();
    setCache(prevCache => ({
      ...prevCache,
      [eventId]: {
        decryptedContent,
        cachedAt: now,
        lastAccessed: now
      }
    }));
    // Force components to re-evaluate cache status
    setForceUpdate(prev => prev + 1);
  }, [setCache]);

  // Update last accessed timestamp (call this when user actually interacts with cached letter)
  const updateLastAccessed = useCallback((eventId: string) => {
    const cachedEntry = cache[eventId];
    if (!cachedEntry) return;

    const now = Date.now();
    setCache(prevCache => ({
      ...prevCache,
      [eventId]: {
        ...cachedEntry,
        lastAccessed: now
      }
    }));
  }, [cache, setCache]);

  // Clear all cached letters (used on logout)
  const clearCache = useCallback(() => {
    removeCache();
  }, [removeCache]);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const entries = Object.entries(cache);
    return {
      totalCached: entries.length,
      oldestCache: entries.length > 0 ? Math.min(...entries.map(([_, entry]) => entry.cachedAt)) : null,
      newestCache: entries.length > 0 ? Math.max(...entries.map(([_, entry]) => entry.cachedAt)) : null,
      totalSize: JSON.stringify(cache).length // rough size estimate
    };
  }, [cache]);

  return {
    isLetterCached,
    getCachedLetter,
    cacheDecryptedLetter,
    updateLastAccessed,
    clearCache,
    getCacheStats,
    reloadCache,
    cacheCount: Object.keys(cache).length
  };
} 
