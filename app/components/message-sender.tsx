"use client";

import { useState } from "react";
import { useAuth } from "../contexts/auth";
import { useNostr } from "../contexts/nostr";
import { useNotification } from "../contexts/notification";
import { generateSecretKey } from "nostr-tools/pure";
import { hexToBytes } from "@noble/hashes/utils";
import { RelayListItem } from "../lib/type";
import { custom, CustomDialogProps } from "./dialog";
import { Stamp } from "./stamp";
import { usePowCreation } from "../hooks/usePowCreation";
import { PowMiningIndicator } from "./pow-mining-indicator";
import { POW_CONFIG } from "app/lib/config";

interface MessageSenderProps {
  slug: string;
  profileName?: string;
  relayList: RelayListItem[];
}

export function MessageSender({
  slug,
  profileName,
  relayList,
}: MessageSenderProps) {
  const { isSignedIn, pubkey, exportPrivateKey } = useAuth();
  const { nostr } = useNostr();
  const { success, error } = useNotification();
  const {
    createPowNote,
    isMining,
    cancelMining,
    powDifficulty,
    setPowDifficulty,
  } = usePowCreation();

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    setSendError(null);

    try {
      let senderPrivkey: Uint8Array | null = null;

      // If not signed in, generate a temporary key pair
      if (!isSignedIn) {
        senderPrivkey = generateSecretKey();
      } else {
        const password = prompt(
          "Please enter your password to send the message"
        );
        if (!password) {
          throw new Error("Password required to send message");
        }
        senderPrivkey = hexToBytes(await exportPrivateKey(password));
      }

      const recipient = {
        publicKey: slug,
      };

      if (!nostr) {
        throw new Error("Nostr not initialized");
      }
      // Use the POW creation hook to handle all the complexity
      const signedEvent = await createPowNote({
        senderPrivkey,
        recipient,
        message,
        difficulty: powDifficulty,
      });

      // Show stamp dialog with the event ID
      const StampDialog = ({
        onResolve,
        onReject,
      }: CustomDialogProps<boolean>) => {
        return (
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold mb-2">
                POW Stamp Generated!
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your message has been forged and ready to send with Proof of
                Work Stamp (Difficulty: {powDifficulty}). The Stamp will be used
                as a spam filter for relays. Higer difficulty means more
                spam-proof, but slower to forge.
              </p>
            </div>

            <div className="flex justify-center mb-6">
              <Stamp hash={signedEvent.id} showArt={true} />
            </div>

            <div className="text-center space-y-2 mb-6 overflow-x-auto">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-mono">
                  {signedEvent.id.slice(0, 10)}...{signedEvent.id.slice(-10)}
                </span>
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => onResolve(true)}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Send Message
              </button>
            </div>
          </div>
        );
      };

      const shouldSend = await custom(StampDialog, { maxWidth: "md" });
      if (!shouldSend) {
        return error("You cancelled the message");
      }

      await nostr.publishEventToRelays(
        signedEvent,
        relayList.map((relay) => relay.url)
      );

      setMessage("");
      success("Message sent successfully!");
    } catch (err: any) {
      if (err.message === "cancelled") {
        return; // User cancelled, just exit silently
      }
      console.error("Failed to send message:", err);
      setSendError(
        err instanceof Error ? err.message : "Failed to send message"
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {sendError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
          {sendError}
        </div>
      )}

      <PowMiningIndicator
        isMining={isMining}
        powDifficulty={powDifficulty}
        onCancel={cancelMining}
      />

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your message here..."
        className="w-full h-32 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        rows={6}
      />

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mr-2">
              POW
            </span>
            <input
              id="pow-difficulty"
              type="number"
              min="1"
              max="64"
              value={powDifficulty}
              onChange={(e) =>
                setPowDifficulty(
                  parseInt(e.target.value) || POW_CONFIG.default_difficulty
                )
              }
              className="w-12 bg-transparent text-sm text-gray-900 dark:text-gray-100 focus:outline-none text-center font-mono"
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={isSending || isMining || !message.trim()}
            className="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-sm text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMining
              ? "Mining POW..."
              : isSending
              ? "Sending..."
              : "Send Letter"}
          </button>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          {isSignedIn
            ? "Signed in as " +
              (profileName
                ? profileName
                : pubkey?.slice(0, 6) + "..." + pubkey?.slice(-4))
            : "Sending as anonymous"}
        </div>
      </div>
    </div>
  );
}
