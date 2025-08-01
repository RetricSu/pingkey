import {
  Event,
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
  UnsignedEvent,
} from "nostr-tools/pure";
import { createRumor, createSeal } from "nostr-tools/nip59";
import { nip44 } from "nostr-tools";
import { fastEventHash, getPow } from "nostr-tools/nip13";
import { POW_CONFIG } from "app/lib/config";

// Worker types
export interface PowWorkerData {
  senderPrivkey: number[];
  recipient: { publicKey: string };
  message: string;
  extraTags?: string[][];
  powWrapEventExtraTags?: string[][];
  difficulty: number;
  requestId: string;
}

export interface PowWorkerProgress {
  nonce: number;
  timeElapsed: number;
}

export interface PowWorkerMessage {
  type: "CREATE_POW_NOTE" | "CANCEL_POW" | "POW_PROGRESS";
  data:
    | PowWorkerData
    | { requestId: string }
    | { progress: PowWorkerProgress; requestId: string };
}

// Cancellation support
let shouldCancel = false;
let currentRequestId: string | null = null;

// Helper function to create NIP-17 base event
function createNip17BaseEvent(
  recipient: { publicKey: string },
  message: string,
  extraTags?: string[][]
) {
  const tags = [["p", recipient.publicKey]];
  if (extraTags && extraTags.length > 0) {
    tags.push(...extraTags);
  }
  return {
    created_at: Math.ceil(Date.now() / 1000),
    kind: 14, // PrivateDirectMessage
    tags,
    content: message,
  };
}

// Custom POW mining function with cancellation support
async function minePowWithCancellation(
  unsigned: UnsignedEvent,
  difficulty: number,
  powWrapEventExtraTags?: string[][],
): Promise<any> {
  return new Promise((resolve, reject) => {
    let count = 0;
    let event = unsigned as unknown as Omit<Event, "sig">;
    if (powWrapEventExtraTags && powWrapEventExtraTags.length > 0) {
      event.tags.push(...powWrapEventExtraTags);
    }
    const tag = ["nonce", count.toString(), difficulty.toString()];
    event.tags.push(tag);
    

    const startTime = Date.now();

    const mineLoop = async () => {
      try {
        while (true) {
          if (shouldCancel) {
            reject(new Error("Cancelled"));
            return;
          }

          const now = Math.floor(new Date().getTime() / 1000);

          if (now !== event.created_at) {
            count = 0;
            event.created_at = now;
          }

          tag[1] = (++count).toString();

          event.id = fastEventHash(event);

          if (getPow(event.id) >= difficulty) {
            resolve(event);
            break;
          }

          // todo: this has a bug that it will trigger multiple times in a row(every 3 seconds)
          if ((Date.now() - startTime) % 3000 === 0) {
            self.postMessage({
              type: "POW_PROGRESS",
              progress: { nonce: count, timeElapsed: Date.now() - startTime },
              requestId: currentRequestId,
            });
          }

          // Safety timeout
          if (
            Date.now() - startTime >
            POW_CONFIG.web_worker_mining_timeout_ms
          ) {
            reject(new Error("POW mining timeout - try reducing difficulty"));
            break;
          }
        }
      } catch (error) {
        reject(error);
      }
    };

    mineLoop();
  });
}

async function createNip59POWWrapEvent(
  seal: any,
  recipientPublicKey: string,
  difficulty: number,
  extraTags?: string[][],
  powWrapEventExtraTags?: string[][]
): Promise<any> {
  const randomKey = generateSecretKey();
  const conversationKey = nip44.getConversationKey(
    randomKey,
    recipientPublicKey
  );
  const encryptedContent = nip44.encrypt(JSON.stringify(seal), conversationKey);
  const tags = [["p", recipientPublicKey]];
  if (extraTags && extraTags.length > 0) {
    tags.push(...extraTags);
  };

  const unsignedEvent = {
    kind: 1059, // GiftWrap
    content: encryptedContent,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    pubkey: getPublicKey(randomKey),
  };

  const powEvent = await minePowWithCancellation(unsignedEvent, difficulty, powWrapEventExtraTags);

  if (shouldCancel) {
    throw new Error("Cancelled");
  }

  return finalizeEvent(powEvent, randomKey);
}

// Message handler
self.addEventListener(
  "message",
  async function (e: MessageEvent<PowWorkerMessage>) {
    const { type, data } = e.data;

    if (type === "CANCEL_POW") {
      const { requestId } = data as { requestId: string };
      if (currentRequestId === requestId) {
        shouldCancel = true;
        self.postMessage({
          type: "POW_CANCELLED",
          requestId: requestId,
        });
      }
      return;
    }

    if (type === "CREATE_POW_NOTE") {
      try {
        const { senderPrivkey, recipient, message, difficulty, extraTags, requestId, powWrapEventExtraTags } =
          data as PowWorkerData;
        currentRequestId = requestId;
        shouldCancel = false;

        const privkeyBytes = new Uint8Array(senderPrivkey);
        const event = createNip17BaseEvent(recipient, message, extraTags);
        const rumor = createRumor(event, privkeyBytes);
        const seal = createSeal(rumor, privkeyBytes, recipient.publicKey);

        const wrappedEvent = await createNip59POWWrapEvent(
          seal,
          recipient.publicKey,
          difficulty,
          extraTags,
          powWrapEventExtraTags
        );

        currentRequestId = null;

        self.postMessage({
          type: "POW_COMPLETE",
          result: wrappedEvent,
          requestId: requestId,
        });
      } catch (error) {
        if (error instanceof Error && error.message === "Cancelled") {
          return;
        }

        currentRequestId = null;
        self.postMessage({
          type: "ERROR",
          error: error instanceof Error ? error.message : "Unknown error",
          requestId: (data as PowWorkerData).requestId,
        });
      }
    }
  }
);

// Initialize worker as ready
self.postMessage({ type: "NOSTR_READY" });
