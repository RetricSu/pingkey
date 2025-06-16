"use client";

import { useAuth } from "app/contexts/auth";
import { useNostr } from "app/contexts/nostr";
import { useNotification } from "app/contexts/notification";
import { usePowCreation } from "app/hooks/usePowCreation";
import { useUserRelayList } from "app/hooks/useUserRelayList";
import { withAuth } from "app/components/auth/with-auth";
import { PowMiningIndicator } from "app/components/stamp/pow-mining-indicator";
import { custom } from "app/components/dialog";
import { POW_CONFIG } from "app/lib/config";
import { hexToBytes } from "@noble/hashes/utils";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { prompt } from "app/components/dialog";
import { buildGeneratedStampDialog } from "app/components/stamp/mint-stamp";

function ComposePage() {
  const { exportPrivateKey } = useAuth();
  const { nostr } = useNostr();
  const { success, error } = useNotification();
  const { relayList } = useUserRelayList();
  const {
    createPowNote,
    isMining,
    cancelMining,
    powDifficulty,
    setPowDifficulty,
  } = usePowCreation();

  const searchParams = useSearchParams();
  const router = useRouter();

  const [recipientPubkey, setRecipientPubkey] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // URL parameter handling
  useEffect(() => {
    const replyToPubkey = searchParams.get("replyToPubkey");
    const replyToEventId = searchParams.get("replyToEventId");

    if (replyToPubkey) {
      setRecipientPubkey(replyToPubkey);
    }

    if (replyToEventId && replyToPubkey) {
      setSubject("Re: ");
      setContent("In reply to: " + replyToEventId + "\n\n");
    }
  }, [searchParams]);

  const handleSendLetter = async () => {
    if (!recipientPubkey.trim() || !content.trim()) {
      return error("Please fill in recipient and content");
    }

    setIsSending(true);
    setSendError(null);

    try {
      const password = await prompt(
        "Enter your password",
        "Please enter your password to send the letter:",
        "",
        {
          type: "password",
          placeholder: "Enter password",
          confirmLabel: "Send",
        }
      );
      if (!password) {
        throw new Error("Password required to send letter");
      }

      const senderPrivkey = hexToBytes(await exportPrivateKey(password));

      if (!nostr) {
        throw new Error("Nostr not initialized");
      }

      const recipient = {
        publicKey: recipientPubkey.trim(),
      };

      // Build the letter content with subject if provided
      const letterContent = content.trim();

      // Handle reply functionality
      const replyToEventId = searchParams.get("replyToEventId");
      const extraTags = replyToEventId ? [["e", replyToEventId]] : [];
      if (subject && subject.trim() !== "") {
        extraTags.push(["subject", subject]);
      }

      // Create the POW note with reply information
      const signedEvent = await createPowNote({
        senderPrivkey,
        recipient,
        message: letterContent,
        difficulty: powDifficulty,
        extraTags,
      });

      // Show stamp dialog with the event ID
      const StampDialog = buildGeneratedStampDialog(powDifficulty, signedEvent);

      const shouldSend = await custom(StampDialog, { maxWidth: "md" });
      if (!shouldSend) {
        return;
      }

      // Send to relays
      const relaysToUse =
        relayList.length > 0 ? relayList.map((relay) => relay.url) : undefined;

      if (relaysToUse) {
        await nostr.publishEventToRelays(signedEvent, relaysToUse);
      } else {
        await nostr.publishEvent(signedEvent);
      }

      // Clear form
      setRecipientPubkey("");
      setSubject("");
      setContent("");

      success("Letter sent successfully!");

      // Navigate back to mailbox
      router.push("/mailbox");
    } catch (err: any) {
      if (err.message === "cancelled") {
        return; // User cancelled, just exit silently
      }
      console.error("Failed to send letter:", err);
      setSendError(
        err instanceof Error ? err.message : "Failed to send letter"
      );
    } finally {
      setIsSending(false);
    }
  };

  const replyToEventId = searchParams.get("replyToEventId");
  const isReply = Boolean(replyToEventId);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {isReply ? "Reply to Letter" : "Compose Letter"}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            {isReply
              ? "Write your reply below"
              : "Write a new letter to someone"}
          </p>
        </div>

        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {sendError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            {sendError}
          </div>
        )}

        {/* Recipient */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            To (Public Key)
          </label>
          <input
            type="text"
            value={recipientPubkey}
            onChange={(e) => setRecipientPubkey(e.target.value)}
            placeholder="hex public key"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600 transition-all font-mono"
            disabled={isReply}
          />
          {isReply && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Replying to this letter
            </p>
          )}
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Subject (Optional)
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Letter subject..."
            className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600 transition-all"
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Letter Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your letter here..."
            className="w-full h-64 px-3 py-3 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 resize-none focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600 transition-all font-serif leading-relaxed"
            rows={12}
          />
        </div>

        <PowMiningIndicator
          isMining={isMining}
          powDifficulty={powDifficulty}
          onCancel={cancelMining}
        />

        {/* POW Settings and Send */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2 border border-neutral-200 dark:border-neutral-700">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mr-2">
                POW Difficulty
              </span>
              <input
                type="number"
                min="1"
                max="64"
                value={powDifficulty}
                onChange={(e) =>
                  setPowDifficulty(
                    parseInt(e.target.value) || POW_CONFIG.default_difficulty
                  )
                }
                className="w-12 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none text-center font-mono"
              />
            </div>
          </div>

          <button
            onClick={handleSendLetter}
            disabled={
              isSending ||
              isMining ||
              !recipientPubkey.trim() ||
              !content.trim()
            }
            className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMining
              ? "Creating Stamp..."
              : isSending
              ? "Sending..."
              : "Send Letter"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default withAuth(ComposePage, { showInlineAuth: true });
