import { generateSecretKey, getPublicKey } from "nostr-tools/pure";
import { SimplePool } from "nostr-tools/pool";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import type { Event, EventTemplate } from "nostr-tools/core";
import { Filter, nip44 } from "nostr-tools";
import { Profile, RelayListItem } from "./type";

export class Nostr {
  public requestPublicKey: (() => Promise<string | null>) | null = null;
  public signEventCallback:
    | ((eventData: EventTemplate) => Promise<Event>)
    | null = null;
  private pool: SimplePool;
  public relays: string[];

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
    const secretKey = generateSecretKey();
    const publicKey = getPublicKey(secretKey);

    return {
      secretKey: bytesToHex(secretKey),
      publicKey: publicKey,
    };
  }

  setSignEventCallback(
    signEventCallback: (eventData: EventTemplate) => Promise<Event>
  ): void {
    this.signEventCallback = signEventCallback;
  }

  setRequestPublicKey(requestPublicKey: () => Promise<string | null>): void {
    this.requestPublicKey = requestPublicKey;
  }

  getPublicKeyFromPrivateKey(privateKeyHex: string): string {
    return getPublicKey(hexToBytes(privateKeyHex));
  }

  /**
   * Set up profile metadata (kind 0 event)
   */
  async setupProfile(profile: Profile): Promise<Event | null> {
    if (!this.signEventCallback || !this.requestPublicKey) {
      throw new Error("signEventCallback not set.");
    }

    const publicKey = await this.requestPublicKey();
    if (!publicKey) {
      throw new Error("Public key not set.");
    }

    const profileEvent = {
      kind: 0,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: JSON.stringify(profile),
      pubkey: publicKey,
    };

    try {
      const signedEvent = await this.signEventCallback(profileEvent);
      await this.publishEvent(signedEvent);
      return signedEvent;
    } catch (error) {
      console.error("Failed to publish profile:", error);
      return null;
    }
  }

  async nip44Encrypt(
    privateKey: string,
    publicKey: string,
    message: string
  ): Promise<string> {
    const privateKeyBytes = hexToBytes(privateKey);
    const conversationKey = nip44.getConversationKey(
      privateKeyBytes,
      publicKey
    );
    return nip44.encrypt(message, conversationKey);
  }

  async nip44Decrypt(
    privateKey: string,
    publicKey: string,
    payload: string
  ): Promise<string> {
    const privateKeyBytes = hexToBytes(privateKey);
    const conversationKey = nip44.getConversationKey(
      privateKeyBytes,
      publicKey
    );
    return nip44.decrypt(payload, conversationKey);
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

  async publishEventToRelays(event: Event, relays: string[]): Promise<void> {
    const promises = relays.map((relay) => this.pool.publish([relay], event));
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
  async fetchProfile(pubkey: string): Promise<Profile | null> {
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
      return JSON.parse(latestEvent.content) as Profile;
    } catch (error) {
      console.error("Failed to parse profile content:", error);
      return null;
    }
  }

  async fetchGiftWrappedNotes(
    receiptPubkey: string,
    limit: number = 50
  ): Promise<Event[]> {
    const filters: Filter[] = [
      {
        "#p": [receiptPubkey],
        kinds: [1059],
        limit: limit,
      },
    ];
    return await this.fetchEvents(filters);
  }

  async fetchNip65RelayList(authors: string[]): Promise<RelayListItem[]> {
    const filters: Filter[] = [
      {
        kinds: [10002],
        authors: authors,
      },
    ];
    const events = await this.fetchEvents(filters);
    return events
      .map((event) =>
        event.tags
          .find((tag) => tag[0] === "r")
          ?.map((tag) => {
            const relayUrl = tag[1];
            const marker = tag[2] as "r" | "w" | undefined;
            if (!relayUrl) {
              return null;
            } else {
              return {
                url: relayUrl,
                marker: marker,
              } as RelayListItem;
            }
          })
      )
      .filter((r) => r !== null) as unknown as RelayListItem[];
  }

  async publishNote(
    kind: number,
    content: string,
    tags: string[][] = []
  ): Promise<Event | null> {
    if (!this.signEventCallback || !this.requestPublicKey) {
      throw new Error("signEventCallback or requestPublicKey not set.");
    }

    const publicKey = await this.requestPublicKey();
    if (!publicKey) {
      throw new Error("Public key not set.");
    }

    const noteEvent = {
      kind,
      created_at: Math.floor(Date.now() / 1000),
      tags: tags,
      content: content,
      pubkey: publicKey,
    };

    try {
      const signedEvent = await this.signEventCallback(noteEvent);
      await this.publishEvent(signedEvent);
      return signedEvent;
    } catch (error) {
      console.error("Failed to publish note:", error);
      return null;
    }
  }

  async publishNip65RelayListEvent(relayList: RelayListItem[]) {
    return await this.publishNote(
      10002,
      "",
      relayList.map((relay) => {
        if (relay.marker) {
          return ["r", relay.url, relay.marker];
        } else {
          return ["r", relay.url];
        }
      })
    );
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
