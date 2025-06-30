import {
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
} from "nostr-tools/pure";
import { SimplePool } from "nostr-tools/pool";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import type {
  Event,
  EventTemplate,
  NostrEvent,
  UnsignedEvent,
} from "nostr-tools/core";
import { Filter, nip44 } from "nostr-tools";
import { Profile, RelayListItem, Recipient } from "./type";
import { DEFAULT_BIG_RELAY_URLS, LocalStorageKeys, POW_CONFIG } from "./config";
import { minePow } from "nostr-tools/nip13";
import { GiftWrap, PrivateDirectMessage } from "nostr-tools/kinds";
import { createRumor, createSeal } from "nostr-tools/nip59";

export class Nostr {
  private pool: SimplePool;
  public requestPublicKey: (() => Promise<string | null>) | null = null;
  public requestSignEvent:
    | ((eventData: EventTemplate) => Promise<Event>)
    | null = null;

  constructor() {
    this.pool = new SimplePool();
  }

  setRequestSignEvent(
    requestSignEvent: (eventData: EventTemplate) => Promise<Event>
  ): void {
    this.requestSignEvent = requestSignEvent;
  }

  setRequestPublicKey(requestPublicKey: () => Promise<string | null>): void {
    this.requestPublicKey = requestPublicKey;
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

  async publishEventToRelays(
    event: Event,
    relays: string[]
  ): Promise<{ relay: string; result: string | null }[]> {
    const r = await this.pool.publish(relays, event);
    const res = await Promise.all(r);
    return relays.map((r, index) => {
      return {
        relay: r,
        result: res[index],
      };
    });
  }

  async signToPublishEvent(
    kind: number,
    content: string,
    tags: string[][],
    relays: string[]
  ): Promise<Event | null> {
    if (!this.requestSignEvent || !this.requestPublicKey) {
      throw new Error("requestSignEvent or requestPublicKey not set.");
    }

    const publicKey = await this.requestPublicKey();
    if (!publicKey) {
      throw new Error("Failed to request public key.");
    }

    const event = {
      kind,
      created_at: Math.floor(Date.now() / 1000),
      tags: tags,
      content: content,
      pubkey: publicKey,
    };

    try {
      const signedEvent = await this.requestSignEvent(event);
      await this.publishEventToRelays(signedEvent, relays);
      return signedEvent;
    } catch (error) {
      console.error("Failed to sign and publish event:", error);
      return null;
    }
  }

  async publishProfile(profile: Profile): Promise<Event | null> {
    return await this.signToPublishEvent(
      0,
      JSON.stringify(profile),
      [],
      loadBigRelays()
    );
  }

  async publishNip65RelayListEvent(relayList: RelayListItem[]) {
    return await this.signToPublishEvent(
      10002,
      "",
      relayList.map((relay) => {
        if (relay.marker) {
          return ["r", relay.url, relay.marker];
        } else {
          return ["r", relay.url];
        }
      }),
      loadBigRelays()
    );
  }

  async fetchEventFromRelays(
    filters: Filter[],
    relays: string[],
    timeoutMs: number = 10000
  ): Promise<Event[]> {
    return new Promise((resolve) => {
      const events: Event[] = [];
      const timeoutId = setTimeout(() => {
        resolve(events);
      }, timeoutMs);

      const sub = this.pool.subscribeMany(relays, filters, {
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
      loadBigRelays(),
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
    const events = await this.fetchEventFromRelays(filters, loadBigRelays());
    const eventTags = events.map((event) => event.tags).flat();
    const relayTags = eventTags.filter((tag) => tag[0] === "r");
    return relayTags
      .map((tag) => {
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
      .filter((r) => r !== null) as unknown as RelayListItem[];
  }

  async fetchGiftWrappedNotes(
    receiptPubkey: string,
    relays: string[],
    limit: number = 50
  ): Promise<Event[]> {
    const filters: Filter[] = [
      {
        "#p": [receiptPubkey],
        kinds: [1059],
        limit: limit,
      },
    ];
    return await this.fetchEventFromRelays(filters, relays);
  }

  private async createNip59POWWrapEvent(
    seal: NostrEvent,
    recipientPublicKey: string,
    difficulty: number = 8
  ): Promise<NostrEvent> {
    const randomKey = generateSecretKey();

    const unsignedEvent: UnsignedEvent = {
      kind: GiftWrap,
      content: await this.nip44Encrypt(
        bytesToHex(randomKey),
        recipientPublicKey,
        JSON.stringify(seal)
      ),
      created_at: Math.floor(Date.now() / 1000),
      tags: [["p", recipientPublicKey]],
      pubkey: getPublicKey(randomKey),
    };

    const powUnsignedEvent: UnsignedEvent = minePow(unsignedEvent, difficulty);

    return finalizeEvent(powUnsignedEvent, randomKey) as NostrEvent;
  }

  private createNip17BaseEvent(
    recipients: Recipient | Recipient[],
    message: string,
    extraTags?: string[][]
  ): EventTemplate {
    const baseEvent: EventTemplate = {
      created_at: Math.ceil(Date.now() / 1000),
      kind: PrivateDirectMessage,
      tags: [],
      content: message,
    };

    const recipientsArray = Array.isArray(recipients)
      ? recipients
      : [recipients];

    recipientsArray.forEach(({ publicKey, relayUrl }) => {
      baseEvent.tags.push(
        relayUrl ? ["p", publicKey, relayUrl] : ["p", publicKey]
      );
    });

    if (extraTags && extraTags.length > 0) {
      baseEvent.tags.push(...extraTags);
    }

    return baseEvent;
  }

  async createPowGiftWrappedNote(
    senderPrivkey: Uint8Array<ArrayBufferLike>,
    recipient: {
      publicKey: string;
      relay?: string;
    },
    message: string,
    difficulty: number = POW_CONFIG.default_difficulty,
    extraTags?: string[][]
  ): Promise<Event> {
    const event = this.createNip17BaseEvent(recipient, message, extraTags);
    const rumor = createRumor(event, senderPrivkey);
    const seal = createSeal(rumor, senderPrivkey, recipient.publicKey);
    const wrappedEvent = await this.createNip59POWWrapEvent(
      seal,
      recipient.publicKey,
      difficulty
    );
    return wrappedEvent;
  }

  destroy(): void {
    this.pool.close(loadBigRelays());
  }
}

export function getSubjectTitleFromEvent(event: Event): string | null {
  const subject = event.tags.find((tag) => tag[0] === "subject");
  return subject ? subject[1] : null;
}

export function generateNewKey(): { secretKey: string; publicKey: string } {
  const secretKey = generateSecretKey();
  const publicKey = getPublicKey(secretKey);

  return {
    secretKey: bytesToHex(secretKey),
    publicKey: publicKey,
  };
}

export function getPublicKeyFromPrivateKey(privateKeyHex: string): string {
  return getPublicKey(hexToBytes(privateKeyHex));
}

export function loadBigRelays(): string[] {
  // Always return built-in defaults during SSR or when window is not available
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return DEFAULT_BIG_RELAY_URLS;
  }

  try {
    const customRelays = localStorage.getItem(
      LocalStorageKeys.customDefaultRelaysKey
    );
    if (customRelays) {
      const parsed = JSON.parse(customRelays);
      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed.every((relay) => typeof relay === "string")
      ) {
        return parsed;
      }
    }
  } catch (error) {
    console.error(
      "Error reading custom default relays from localStorage:",
      error
    );
  }

  return DEFAULT_BIG_RELAY_URLS;
}
