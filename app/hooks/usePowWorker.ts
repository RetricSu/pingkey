import { useRef, useCallback, useEffect, useState } from "react";

interface PowWorkerData {
  senderPrivkey: Uint8Array;
  recipient: { publicKey: string };
  message: string;
  difficulty: number;
  extraTags?: string[][];
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
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const pendingRequests = useRef<
    Map<string, { resolve: Function; reject: Function }>
  >(new Map());
  const currentRequestIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Create worker from TypeScript file
    try {
      // Use the modern Next.js worker approach
      workerRef.current = new Worker(
        new URL("../../workers/pow.worker.ts", import.meta.url)
      );

      workerRef.current.onmessage = (e) => {
        const { type, result, error, requestId } = e.data;

        if (type === "NOSTR_READY") {
          setIsWorkerReady(true);
          console.log("POW Worker ready!");
          return;
        }

        if (type === "POW_PROGRESS") {
          console.log("POW Progress:", e.data.progress);
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
        setIsWorkerReady(false);
        pendingRequests.current.forEach(({ reject }) => {
          reject(new Error("Worker error occurred"));
        });
        pendingRequests.current.clear();
        currentRequestIdRef.current = null;
      };

      workerRef.current.onmessageerror = (error) => {
        console.error("Worker message error:", error);
        setIsWorkerReady(false);
      };
    } catch (error) {
      console.error("Failed to create worker:", error);
      setIsWorkerReady(false);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      setIsWorkerReady(false);
      pendingRequests.current.clear();
      currentRequestIdRef.current = null;
    };
  }, []);

  const createPowNote = useCallback(
    async (data: PowWorkerData): Promise<PowWorkerResult> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error("Worker not initialized"));
          return;
        }

        if (!isWorkerReady) {
          reject(new Error("Worker not ready"));
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

        try {
          workerRef.current.postMessage({
            type: "CREATE_POW_NOTE",
            data: serializedData,
          });
        } catch (error) {
          // Clean up if postMessage fails
          pendingRequests.current.delete(requestId);
          currentRequestIdRef.current = null;
          reject(new Error("Failed to send message to worker"));
        }
      });
    },
    [isWorkerReady]
  );

  const cancelCurrentPow = useCallback(() => {
    if (!workerRef.current || !currentRequestIdRef.current) {
      return;
    }

    try {
      workerRef.current.postMessage({
        type: "CANCEL_POW",
        data: { requestId: currentRequestIdRef.current },
      });
    } catch (error) {
      console.error("Failed to cancel POW:", error);
    }
  }, []);

  return {
    createPowNote,
    isWorkerReady,
    cancelCurrentPow,
  };
}
