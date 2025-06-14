import { useRef, useCallback, useEffect } from "react";

interface PowWorkerData {
  senderPrivkey: Uint8Array;
  recipient: { publicKey: string };
  message: string;
  difficulty: number;
}

interface PowWorkerResult {
  id: string;
  [key: string]: any;
}

interface UsePowWorkerReturn {
  createPowNote: (data: PowWorkerData) => Promise<PowWorkerResult>;
  isWorkerReady: boolean;
  cancelCurrentPow: () => void;
}

export function usePowWorker(): UsePowWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const isWorkerReady = useRef(false);
  const pendingRequests = useRef<
    Map<string, { resolve: Function; reject: Function }>
  >(new Map());
  const currentRequestIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker("/pow-worker.js");

    workerRef.current.onmessage = (e) => {
      const { type, result, error, requestId } = e.data;

      if (type === "NOSTR_READY") {
        isWorkerReady.current = true;
        return;
      }

      if (type === "POW_COMPLETE" && requestId) {
        const request = pendingRequests.current.get(requestId);
        if (request) {
          request.resolve(result);
          pendingRequests.current.delete(requestId);
          currentRequestIdRef.current = null;
        }
        return;
      }

      if (type === "POW_CANCELLED" && requestId) {
        const request = pendingRequests.current.get(requestId);
        if (request) {
          request.reject(new Error("POW mining cancelled by user"));
          pendingRequests.current.delete(requestId);
          currentRequestIdRef.current = null;
        }
        return;
      }

      if (type === "ERROR" && requestId) {
        const request = pendingRequests.current.get(requestId);
        if (request) {
          request.reject(new Error(error));
          pendingRequests.current.delete(requestId);
          currentRequestIdRef.current = null;
        }
        return;
      }
    };

    workerRef.current.onerror = (error) => {
      console.error("Worker error:", error);
    };

    // Initialize the worker
    workerRef.current.postMessage({ type: "INIT_NOSTR" });

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const createPowNote = useCallback(
    async (data: PowWorkerData): Promise<PowWorkerResult> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error("Worker not initialized"));
          return;
        }

        const requestId =
          Date.now().toString() + Math.random().toString(36).substr(2, 9);
        currentRequestIdRef.current = requestId;
        pendingRequests.current.set(requestId, { resolve, reject });

        // Convert Uint8Array to regular array for serialization
        const serializedData = {
          ...data,
          senderPrivkey: Array.from(data.senderPrivkey),
          requestId,
        };

        workerRef.current.postMessage({
          type: "CREATE_POW_NOTE",
          data: serializedData,
        });
      });
    },
    []
  );

  const cancelCurrentPow = useCallback(() => {
    if (!workerRef.current || !currentRequestIdRef.current) {
      return;
    }

    workerRef.current.postMessage({
      type: "CANCEL_POW",
      data: { requestId: currentRequestIdRef.current },
    });
  }, []);

  return {
    createPowNote,
    isWorkerReady: isWorkerReady.current,
    cancelCurrentPow,
  };
}
