import { useState, useCallback } from "react";
import { usePowWorker } from "./usePowWorker";
import { useNostr } from "../contexts/nostr";
import { useNotification } from "../contexts/notification";
import { POW_CONFIG } from "app/lib/config";

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
  const [powDifficulty, setPowDifficulty] = useState<number>(POW_CONFIG.default_difficulty);

  const cancelMining = useCallback(() => {
    cancelCurrentPow();
    setIsMining(false);
  }, [cancelCurrentPow]);

  const createPowNote = useCallback(
    async (params: PowCreationParams) => {
      if (!nostr) {
        return error("Nostr not initialized");
      }

      const { senderPrivkey, recipient, message, difficulty } = params;

      setIsMining(true);

      try {
        // Smart switching: Use Web Worker for difficulty >= difficulty_mode_level, main thread for lower
        const shouldUseWorker = powDifficulty >= POW_CONFIG.difficulty_mode_level;
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
                  POW_CONFIG.main_thread_mining_timeout_ms
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
