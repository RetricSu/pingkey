import { cache } from "react";
import { unstable_cache, revalidateTag } from "next/cache";

// In-memory cache for development/testing
const memoryCache = new Map<string, { data: any; timestamp: number }>();

export interface CacheOptions {
  /** Cache duration in seconds */
  revalidate?: number;
  /** Cache tags for on-demand revalidation */
  tags?: string[];
}

/**
 * Server-side cache wrapper for expensive operations
 * Uses Next.js unstable_cache for production and memory cache for fallback
 */
export function createServerCache<T extends readonly unknown[], R>(
  fn: (...args: T) => Promise<R>,
  keyParts: string[],
  options: CacheOptions = {}
): (...args: T) => Promise<R> {
  const { revalidate = 3600, tags = [] } = options;

  // Use Next.js built-in caching in production
  if (process.env.NODE_ENV === "production") {
    return unstable_cache(fn, keyParts, {
      revalidate,
      tags,
    });
  }

  // Fallback to memory cache for development
  return cache(async (...args: T): Promise<R> => {
    const cacheKey = `${keyParts.join(":")}-${JSON.stringify(args)}`;
    const cached = memoryCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < revalidate * 1000) {
      return cached.data;
    }

    const result = await fn(...args);
    memoryCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return result;
  });
}

/**
 * Cache Nostr profile data
 */
export const getCachedNostrProfile = createServerCache(
  async (pubkey: string): Promise<any> => {
    // This would integrate with your Nostr client
    // return await nostr.fetchProfile(pubkey);
    throw new Error("Implement with your Nostr client");
  },
  ["nostr", "profile"],
  { revalidate: 300, tags: ["nostr-profiles"] } // 5 minutes
);

/**
 * Cache relay list data
 */
export const getCachedRelayList = createServerCache(
  async (pubkeys: string[]): Promise<any> => {
    // This would integrate with your Nostr client
    // return await nostr.fetchNip65RelayList(pubkeys);
    throw new Error("Implement with your Nostr client");
  },
  ["nostr", "relays"],
  { revalidate: 600, tags: ["nostr-relays"] } // 10 minutes
);

/**
 * Utility to invalidate cache by tags
 * Call this when you want to force refresh cached data
 */
export function revalidateCache(tags: string[]): void {
  try {
    tags.forEach(tag => revalidateTag(tag));
  } catch (error) {
    console.warn("Cache revalidation failed:", error);
  }
}

export default createServerCache; 
