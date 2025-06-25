import { SimplePool } from "nostr-tools/pool";
import type { Event } from "nostr-tools/core";
import { Filter } from "nostr-tools";
import { Profile, RelayListItem } from "./type";
import { DEFAULT_BIG_RELAY_URLS } from "./config";
import { createServerCache } from "./cache";

/**
 * Server-side Nostr utilities for data fetching
 * This runs only on the server and is used for static generation and server-side caching
 */
class NostrServer {
  private pool: SimplePool;

  constructor() {
    this.pool = new SimplePool();
  }

  private async fetchEventFromRelays(
    filters: Filter[],
    relays: string[],
    timeoutMs: number = 10000
  ): Promise<Event[]> {
    return new Promise((resolve) => {
      const events: Event[] = [];
      const timeoutId = setTimeout(() => {
        this.pool.close(relays);
        resolve(events);
      }, timeoutMs);

      const sub = this.pool.subscribeMany(relays, filters, {
        onevent(event) {
          events.push(event);
        },
        oneose() {
          clearTimeout(timeoutId);
          sub.close();
          resolve(events);
        },
      });
    });
  }

  async fetchProfile(pubkey: string): Promise<Profile | null> {
    const filters: Filter[] = [
      {
        kinds: [0],
        authors: [pubkey],
        limit: 1,
      },
    ];

    const events = await this.fetchEventFromRelays(
      filters,
      this.loadBigRelays(),
      5000
    );

    if (events.length === 0) {
      return null;
    }

    // Get the most recent profile event
    const latestEvent = events.sort((a, b) => b.created_at - a.created_at)[0];

    try {
      return JSON.parse(latestEvent.content) as Profile;
    } catch (error) {
      console.error("Failed to parse profile content:", error);
      return null;
    }
  }

  async fetchNip65RelayList(authors: string[]): Promise<RelayListItem[]> {
    const filters: Filter[] = [
      {
        kinds: [10002],
        authors: authors,
      },
    ];

    const events = await this.fetchEventFromRelays(
      filters,
      this.loadBigRelays()
    );
    const eventTags = events.map((event) => event.tags).flat();
    const relayTags = eventTags.filter((tag) => tag[0] === "r");

    return relayTags
      .map((tag) => {
        const relayUrl = tag[1];
        const marker = tag[2];

        if (!relayUrl) return null;

        const data: RelayListItem = {
          url: relayUrl,
        };
        const m =
          marker === "read" ? "r" : marker === "write" ? "w" : undefined;
        if (m) {
          data.marker = m;
        }
        return data;
      })
      .filter((relay): relay is RelayListItem => relay !== null);
  }

  private loadBigRelays(): string[] {
    return DEFAULT_BIG_RELAY_URLS;
  }

  destroy(): void {
    this.pool.close([]);
  }
}

// Create singleton instance
const nostrServer = new NostrServer();

// Cached versions of the functions
export const getCachedNostrProfile = createServerCache(
  async (pubkey: string): Promise<Profile | null> => {
    return await nostrServer.fetchProfile(pubkey);
  },
  ["nostr", "profile"],
  { revalidate: 300, tags: ["nostr-profiles"] } // 5 minutes
);

export const getCachedRelayList = createServerCache(
  async (pubkeys: string[]): Promise<RelayListItem[]> => {
    return await nostrServer.fetchNip65RelayList(pubkeys);
  },
  ["nostr", "relays"],
  { revalidate: 600, tags: ["nostr-relays"] } // 10 minutes
);

export default nostrServer;
