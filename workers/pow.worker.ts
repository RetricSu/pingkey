import { 
  finalizeEvent, 
  generateSecretKey, 
  getPublicKey,
} from "nostr-tools/pure";
import { createRumor, createSeal } from "nostr-tools/nip59";
import { nip44 } from "nostr-tools";

// Worker types
interface PowWorkerData {
  senderPrivkey: number[];
  recipient: { publicKey: string };
  message: string;
  difficulty: number;
  requestId: string;
}

interface PowWorkerMessage {
  type: "CREATE_POW_NOTE" | "CANCEL_POW";
  data: PowWorkerData | { requestId: string };
}

// Cancellation support
let shouldCancel = false;
let currentRequestId: string | null = null;

// Helper function to create NIP-17 base event
function createNip17BaseEvent(recipient: { publicKey: string }, message: string) {
  return {
    created_at: Math.ceil(Date.now() / 1000),
    kind: 14, // PrivateDirectMessage
    tags: [["p", recipient.publicKey]],
    content: message,
  };
}

// Custom POW mining function with cancellation support
async function minePowWithCancellation(event: any, difficulty: number): Promise<any> {
  return new Promise((resolve, reject) => {
    let nonce = 0;
    const startTime = Date.now();
    
    const mineLoop = async () => {
      try {
        while (true) {
          if (shouldCancel) {
            reject(new Error("Cancelled"));
            return;
          }

          // Create event with current nonce
          const eventWithNonce = {
            ...event,
            tags: [...event.tags, ["nonce", nonce.toString(), difficulty.toString()]],
          };

          // Calculate event ID
          const eventData = [
            0,
            eventWithNonce.pubkey,
            eventWithNonce.created_at,
            eventWithNonce.kind,
            eventWithNonce.tags,
            eventWithNonce.content,
          ];
          
          const serialized = JSON.stringify(eventData);
          const eventId = await sha256(serialized);
          
          // Check if we have enough leading zeros
          if (countLeadingZeros(eventId) >= difficulty) {
            resolve({ ...eventWithNonce, id: eventId });
            return;
          }

          nonce++;

          // Yield control and post progress
          if (nonce % 10000 === 0) {
            await new Promise(resolve => setTimeout(resolve, 1));
            
            if (nonce % 50000 === 0) {
              self.postMessage({
                type: "POW_PROGRESS",
                progress: { nonce, timeElapsed: Date.now() - startTime },
                requestId: currentRequestId,
              });
            }
            
            // Safety timeout (5 minutes)
            if (Date.now() - startTime > 300000) {
              reject(new Error("POW mining timeout - try reducing difficulty"));
              return;
            }
          }
        }
      } catch (error) {
        reject(error);
      }
    };

    mineLoop();
  });
}

// Helper functions
function countLeadingZeros(hex: string): number {
  let count = 0;
  for (let i = 0; i < hex.length; i++) {
    if (hex[i] === '0') {
      count++;
    } else {
      break;
    }
  }
  return count;
}

async function sha256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function createNip59POWWrapEvent(seal: any, recipientPublicKey: string, difficulty: number): Promise<any> {
  const randomKey = generateSecretKey();
  const conversationKey = nip44.getConversationKey(randomKey, recipientPublicKey);
  const encryptedContent = nip44.encrypt(JSON.stringify(seal), conversationKey);

  const unsignedEvent = {
    kind: 1059, // GiftWrap
    content: encryptedContent,
    created_at: Math.floor(Date.now() / 1000),
    tags: [["p", recipientPublicKey]],
    pubkey: getPublicKey(randomKey),
  };

  const powEvent = await minePowWithCancellation(unsignedEvent, difficulty);
  
  if (shouldCancel) {
    throw new Error("Cancelled");
  }

  return finalizeEvent(powEvent, randomKey);
}

// Message handler
self.addEventListener("message", async function (e: MessageEvent<PowWorkerMessage>) {
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
      const { senderPrivkey, recipient, message, difficulty, requestId } = data as PowWorkerData;
      currentRequestId = requestId;
      shouldCancel = false;

      const privkeyBytes = new Uint8Array(senderPrivkey);
      const event = createNip17BaseEvent(recipient, message);
      const rumor = createRumor(event, privkeyBytes);
      const seal = createSeal(rumor, privkeyBytes, recipient.publicKey);
      
      const wrappedEvent = await createNip59POWWrapEvent(
        seal,
        recipient.publicKey,
        difficulty
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
});

// Initialize worker as ready
self.postMessage({ type: "NOSTR_READY" }); 