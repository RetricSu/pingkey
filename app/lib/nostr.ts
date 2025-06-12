import {
  generateSecretKey,
  getPublicKey,
  finalizeEvent,
} from "nostr-tools/pure";
import { SimplePool } from "nostr-tools/pool";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import type { Event } from "nostr-tools/core";
import { Filter } from "nostr-tools";

export interface NostrProfile {
  name?: string;
  about?: string;
  picture?: string;
  nip05?: string;
  lud16?: string;
  website?: string;
}

export class Nostr {
  private secretKey: Uint8Array | null = null;
  private publicKey: string | null = null;
  private pool: SimplePool;
  private relays: string[];

  constructor(relays: string[] = []) {
    this.pool = new SimplePool();
    this.relays =
      relays.length > 0
        ? relays
        : [
            "wss://relay.damus.io",
            "wss://nos.lol",
            "wss://relay.nostr.band",
            "wss://nostr.wine",
          ];
  }

  /**
   * Generate a new secret key and derive the public key
   */
  generateNewKey(): { secretKey: string; publicKey: string } {
    this.secretKey = generateSecretKey();
    this.publicKey = getPublicKey(this.secretKey);

    return {
      secretKey: bytesToHex(this.secretKey),
      publicKey: this.publicKey,
    };
  }

  /**
   * Set secret key from hex string
   */
  setSecretKey(secretKeyHex: string): void {
    this.secretKey = hexToBytes(secretKeyHex);
    this.publicKey = getPublicKey(this.secretKey);
  }

  /**
   * Get the current public key
   */
  getPublicKey(): string | null {
    return this.publicKey;
  }

  /**
   * Set up profile metadata (kind 0 event)
   */
  async setupProfile(profile: NostrProfile): Promise<Event | null> {
    if (!this.secretKey || !this.publicKey) {
      throw new Error("Secret key not set. Generate or set a key first.");
    }

    const profileEvent = {
      kind: 0,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: JSON.stringify(profile),
      pubkey: this.publicKey,
    };

    const signedEvent = finalizeEvent(profileEvent, this.secretKey);

    try {
      await this.publishEvent(signedEvent);
      return signedEvent;
    } catch (error) {
      console.error("Failed to publish profile:", error);
      return null;
    }
  }

  /**
   * Publish an event to relays
   */
  async publishEvent(event: Event): Promise<void> {
    const promises = this.relays.map((relay) =>
      this.pool.publish([relay], event)
    );

    await Promise.allSettled(promises);
  }

  /**
   * Fetch events from relays based on filters
   */
  async fetchEvents(
    filters: Filter[],
    timeoutMs: number = 10000
  ): Promise<Event[]> {
    return new Promise((resolve) => {
      const events: Event[] = [];
      const timeoutId = setTimeout(() => {
        resolve(events);
      }, timeoutMs);

      const sub = this.pool.subscribeMany(this.relays, filters, {
        onevent(event) {
          events.push(event);
        },
        oneose() {
          clearTimeout(timeoutId);
          resolve(events);
        },
      });

      // Clean up subscription after timeout
      setTimeout(() => {
        sub.close();
      }, timeoutMs);
    });
  }

  /**
   * Fetch profile metadata for a public key
   */
  async fetchProfile(pubkey: string): Promise<NostrProfile | null> {
    const filters: Filter[] = [
      {
        kinds: [0],
        authors: [pubkey],
        limit: 1,
      },
    ];

    const events = await this.fetchEvents(filters, 5000);

    if (events.length === 0) {
      return null;
    }

    // Get the most recent profile event
    const latestEvent = events.sort((a, b) => b.created_at - a.created_at)[0];

    try {
      return JSON.parse(latestEvent.content) as NostrProfile;
    } catch (error) {
      console.error("Failed to parse profile content:", error);
      return null;
    }
  }

  /**
   * Fetch text notes (kind 1 events) from followed users or specific authors
   */
  async fetchNotes(authors?: string[], limit: number = 50): Promise<Event[]> {
    const filters: Filter[] = [
      {
        kinds: [1],
        authors: authors,
        limit: limit,
      },
    ];

    return this.fetchEvents(filters);
  }

  /**
   * Publish a text note (kind 1 event)
   */
  async publishNote(
    content: string,
    tags: string[][] = []
  ): Promise<Event | null> {
    if (!this.secretKey || !this.publicKey) {
      throw new Error("Secret key not set. Generate or set a key first.");
    }

    const noteEvent = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: tags,
      content: content,
      pubkey: this.publicKey,
    };

    const signedEvent = finalizeEvent(noteEvent, this.secretKey);

    try {
      await this.publishEvent(signedEvent);
      return signedEvent;
    } catch (error) {
      console.error("Failed to publish note:", error);
      return null;
    }
  }

  /**
   * Add a relay to the pool
   */
  addRelay(relayUrl: string): void {
    if (!this.relays.includes(relayUrl)) {
      this.relays.push(relayUrl);
    }
  }

  /**
   * Remove a relay from the pool
   */
  removeRelay(relayUrl: string): void {
    this.relays = this.relays.filter((relay) => relay !== relayUrl);
  }

  /**
   * Get current relays
   */
  getRelays(): string[] {
    return [...this.relays];
  }

  /**
   * Close all connections and clean up
   */
  destroy(): void {
    this.pool.close(this.relays);
  }
}
