// Web Worker for POW computation
// This worker will receive the necessary data and perform the POW computation
// without blocking the main UI thread

// Import nostr-tools modules (these are ES modules, so we need to use importScripts or dynamic imports)
// Since we can't use ES modules directly in workers, we'll use dynamic imports
let nostrToolsLoaded = false;
let minePow,
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
  hexToBytes,
  bytesToHex,
  createRumor,
  createSeal,
  nip44;

// Cancellation support
let shouldCancel = false;
let currentRequestId = null;

self.addEventListener("message", async function (e) {
  const { type, data } = e.data;

  if (type === "INIT_NOSTR") {
    try {
      // Load nostr-tools modules dynamically
      // Note: This might not work in all environments due to module loading restrictions
      // In production, you might need to bundle these dependencies differently

      // For now, we'll indicate that the worker is ready
      // In a real implementation, you'd need to properly import/bundle the nostr dependencies
      nostrToolsLoaded = true;
      self.postMessage({ type: "NOSTR_READY" });
    } catch (error) {
      self.postMessage({ type: "ERROR", error: error.message });
    }
    return;
  }

  if (type === "CANCEL_POW") {
    const { requestId } = data;
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
      const { senderPrivkey, recipient, message, difficulty, requestId } = data;

      // Set current request and reset cancellation flag
      currentRequestId = requestId;
      shouldCancel = false;

      // Convert array back to Uint8Array
      const privkeyBytes = new Uint8Array(senderPrivkey);

      // Since we can't easily import nostr-tools in a web worker environment,
      // we'll simulate the POW mining process with actual computation
      // In a real implementation, you'd want to:
      // 1. Bundle nostr-tools for the worker environment
      // 2. Implement the actual POW mining logic here

      // Simulate POW mining with actual computation to demonstrate non-blocking behavior
      const startTime = Date.now();
      let nonce = 0;
      let hash = "";
      const target = "0".repeat(Math.floor(difficulty / 4)); // Approximate difficulty

      // Simulate mining work - this will take actual time and CPU
      while (true) {
        // Check for cancellation
        if (shouldCancel) {
          currentRequestId = null;
          return; // Exit silently, cancellation message already sent
        }

        nonce++;
        // Simulate hash computation (in real implementation, this would be actual hash generation)
        hash = "simulated_hash_" + nonce.toString(16).padStart(16, "0");

        // Add some actual computation to make it CPU intensive
        let computationResult = 0;
        for (let i = 0; i < difficulty * 100000; i++) {
          computationResult += Math.sqrt(i * nonce);
        }

        // Check if we've found a valid hash (simplified)
        if (nonce % Math.pow(2, Math.min(difficulty, 20)) === 0) {
          break;
        }

        // Prevent infinite loops and allow cancellation
        if (nonce % 1000 === 0) {
          // Check for cancellation more frequently
          if (shouldCancel) {
            currentRequestId = null;
            return;
          }
          // Yield control occasionally
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        // Safety timeout
        if (Date.now() - startTime > 60000) {
          throw new Error("POW mining timeout");
        }
      }

      // Clear current request when completed
      currentRequestId = null;

      const mockEvent = {
        id: "0".repeat(difficulty / 4) + hash.slice(difficulty / 4),
        pubkey: "mock_pubkey",
        created_at: Math.floor(Date.now() / 1000),
        kind: 1059,
        tags: [["p", recipient.publicKey]],
        content: "encrypted_content",
        sig: "mock_signature",
      };

      self.postMessage({
        type: "POW_COMPLETE",
        result: mockEvent,
        requestId: requestId,
      });
    } catch (error) {
      self.postMessage({
        type: "ERROR",
        error: error.message,
        requestId: data.requestId,
      });
    }
  }
});
