"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/auth";
import { useNostr } from "../../contexts/nostr";
import { useNotification } from "../../contexts/notification";
import { generateSecretKey } from "nostr-tools/pure";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { RelayListItem } from "../../lib/type";
import { custom, CustomDialogProps } from "../gadget/dialog";
import { usePowCreation } from "../../hooks/usePowCreation";
import { PowMiningIndicator } from "../stamp/pow-mining-indicator";
import { buildGeneratedStampDialog } from "../stamp/mint-stamp";
import { prompt } from "../gadget/dialog";
import { useUserProfile } from "app/hooks/useUserProfile";
import { PowAdjustment } from "../stamp/pow-adjustment";

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
  const { profile: signedInProfile } = useUserProfile();
  const { isSignedIn, pubkey, exportPrivateKey } = useAuth();
  const { nostr } = useNostr();
  const { success, error, info } = useNotification();
  const {
    createPowNote,
    isMining,
    cancelMining,
    powDifficulty,
    setPowDifficulty,
  } = usePowCreation();

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setIsSending(true);

    try {
      let senderPrivkey: Uint8Array | null = null;
      let anonymousUserPrivateKey: Uint8Array | null = null;

      // If not signed in, generate a temporary key pair
      if (!isSignedIn) {
        anonymousUserPrivateKey = generateSecretKey();
        senderPrivkey = anonymousUserPrivateKey;
      } else {
        const password = await prompt(
          "Enter your password",
          "Please enter your password to send the message:",
          "",
          {
            type: "password",
            placeholder: "Enter password",
            confirmLabel: "Send",
          }
        );
        if (!password) {
          return error("Password required to send message");
        }
        senderPrivkey = hexToBytes(await exportPrivateKey(password));
      }

      const recipient = {
        publicKey: slug,
      };

      if (!nostr) {
        return error("Nostr not initialized");
      }
      // Use the POW creation hook to handle all the complexity
      const signedEvent = await createPowNote({
        senderPrivkey,
        recipient,
        message,
        difficulty: powDifficulty,
        extraTags: [["subject", "ping"]],
      });

      // Show stamp dialog with the event ID
      const StampDialog = buildGeneratedStampDialog(powDifficulty, signedEvent);

      const shouldSend = await custom(StampDialog, { maxWidth: "md" });
      if (!shouldSend) {
        return error("You cancelled the message");
      }

      const res = await nostr.publishEventToRelays(
        signedEvent,
        relayList.map((relay) => relay.url)
      );

      info("Sent Result", res.map((r) => r.relay + ": " + r.result + "\n").join(""));
      setMessage("");

      // Show key information to anonymous users
      if (!isSignedIn && anonymousUserPrivateKey) {
        const AnonymousKeyDialog = ({
          onResolve,
          onReject,
        }: CustomDialogProps<boolean>) => (
          <div className="p-6">
            <div className="space-y-4">
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Message Sent Successfully!
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Your message has been sent. To receive a reply, save this key:
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Your Anonymous Private Key:
                  </div>
                  <div className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                    {bytesToHex(anonymousUserPrivateKey)} <br />
                    <br />
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p>• Copy and save this key somewhere safe</p>
                  <p>
                    • Use this key to sign-in and setup account information and relays to receive replies.
                  </p>
                  <p>
                    • If you don't care about the replies(eg: maybe you told the recipient to reply to you via another channel), you can just ignore
                    this key
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => onResolve(true)}
                  className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  I've saved the key
                </button>
              </div>
            </div>
          </div>
        );

        await custom(AnonymousKeyDialog, { maxWidth: "md" });
      } else {
        success("Message sent successfully!");
      }
    } catch (err: any) {
      if (err.message === "cancelled") {
        return; // User cancelled, just exit silently
      }
      console.error(`Failed to send message: ${err.message}`);
      error(`Failed to send message: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={`Leaving a message to ${profileName} via his/her relays. A minimal stamp forged from Proof of Work(POW) is required.`}
        className="text-sm w-full h-32 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        rows={6}
      />

      <PowMiningIndicator
        isMining={isMining}
        powDifficulty={powDifficulty}
        onCancel={cancelMining}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex items-center gap-3">
          <PowAdjustment
            powDifficulty={powDifficulty}
            setPowDifficulty={setPowDifficulty}
            disabled={isSending || isMining}
          />

          <button
            onClick={handleSendMessage}
            disabled={
              isSending || isMining || !message.trim() || relayList.length === 0
            }
            className="px-6 py-3 bg-gray-900 dark:bg-gray-100 text-sm text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMining ? "Mining POW..." : isSending ? "Sending..." : "Send"}
          </button>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400 sm:text-right">
          {isSignedIn
            ? "Signed in as " +
              (signedInProfile?.name ??
                pubkey?.slice(0, 6) + "..." + pubkey?.slice(-4))
            : "Sending as anonymous"}
        </div>
      </div>
    </div>
  );
}
