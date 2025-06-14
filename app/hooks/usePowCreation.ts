import { useState, useCallback } from "react";
import { usePowWorker } from "./usePowWorker";
import { useNostr } from "../contexts/nostr";
import { useNotification } from "../contexts/notification";

interface PowCreationParams {
  senderPrivkey: Uint8Array;
  recipient: { publicKey: string };
  message: string;
  difficulty: number;
}

interface UsePowCreationReturn {
  createPowNote: (params: PowCreationParams) => Promise<any>;
  isMining: boolean;
  cancelMining: () => void;
  powDifficulty: number;
  setPowDifficulty: (difficulty: number) => void;
}

export function usePowCreation(): UsePowCreationReturn {
  const { nostr } = useNostr();
  const { error } = useNotification();
  const { createPowNote: workerCreatePowNote, cancelCurrentPow } =
    usePowWorker();

  const [isMining, setIsMining] = useState(false);
  const [powDifficulty, setPowDifficulty] = useState<number>(4);

  const cancelMining = useCallback(() => {
    cancelCurrentPow();
    setIsMining(false);
  }, [cancelCurrentPow]);

  const createPowNote = useCallback(
    async (params: PowCreationParams) => {
      if (!nostr) {
        throw new Error("Nostr not initialized");
      }

      const { senderPrivkey, recipient, message, difficulty } = params;

      setIsMining(true);

      try {
        // Smart switching: Use Web Worker for difficulty >= 2, main thread for lower
        const shouldUseWorker = powDifficulty >= 2;
        let signedEvent;

        if (shouldUseWorker) {
          try {
            signedEvent = await workerCreatePowNote({
              senderPrivkey,
              recipient,
              message,
              difficulty,
            });
          } catch (workerError: any) {
            if (workerError.message === "POW mining cancelled by user") {
              throw new Error("cancelled"); // Special error for cancellation
            }

            console.warn(
              "Web Worker failed, falling back to main thread:",
              workerError
            );

            // Fallback to main thread with timeout
            signedEvent = await Promise.race([
              nostr.createPowGiftWrappedNote(
                senderPrivkey,
                recipient,
                message,
                difficulty
              ),
              new Promise<never>((_, reject) =>
                setTimeout(
                  () =>
                    reject(
                      new Error("Mining timeout - try reducing difficulty")
                    ),
                  30000
                )
              ),
            ]);
          }
        } else {
          // For low difficulty, use main thread (faster for simple computation)
          signedEvent = await nostr.createPowGiftWrappedNote(
            senderPrivkey,
            recipient,
            message,
            difficulty
          );
        }

        return signedEvent;
      } finally {
        setIsMining(false);
      }
    },
    [nostr, workerCreatePowNote, powDifficulty]
  );

  return {
    createPowNote,
    isMining,
    cancelMining,
    powDifficulty,
    setPowDifficulty,
  };
}
