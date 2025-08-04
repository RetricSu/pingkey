"use client";

import { useAuth } from "app/contexts/auth";
import { useNostr } from "app/contexts/nostr";
import { useNotification } from "app/contexts/notification";
import { usePowCreation } from "app/hooks/usePowCreation";
import { withAuth } from "app/components/auth/with-auth";
import { PowMiningIndicator } from "app/components/stamp/pow-mining-indicator";
import { custom } from "app/components/gadget/dialog";
import { hexToBytes } from "@noble/hashes/utils";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { prompt } from "app/components/gadget/dialog";
import { buildGeneratedStampDialog } from "app/components/stamp/mint-stamp";
import { PowAdjustment } from "app/components/stamp/pow-adjustment";
import { getSlugType } from "app/lib/util";
import { SlugType } from "app/lib/type";
import { useSlugMiddleware } from "app/hooks/useSlugMiddleware";
import { defaultProfile } from "app/lib/config";
import { Hex, useCcc } from "@ckb-ccc/connector-react";
import { CollectibleAttachmentSelector } from "app/components/collectible/selector";
import { ReceiverRelayList } from "app/components/compose/receiver-relay-list";
import { createLockScriptFrom, createOnChainLetter, attachLetterWithDOBAssets } from "app/lib/collectible";
import { Event } from "nostr-tools";

function ComposePage() {
  const { exportPrivateKey } = useAuth();
  const { nostr } = useNostr();
  const { success, error, info } = useNotification();
  const {
    createPowNote,
    isMining,
    cancelMining,
    powDifficulty,
    setPowDifficulty,
  } = usePowCreation();

  const router = useRouter();
  const { signerInfo } = useCcc();

  const searchParams = useSearchParams();
  const replyToEventId = searchParams.get("replyToEventId");
  const replyToSlug = searchParams.get("replyToSlug") || "";
  const isReply = Boolean(replyToEventId);

  const [recipientSlug, setRecipientSlug] = useState(replyToSlug);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedDOBId, setSelectedDOBId] = useState<Hex | undefined>();

  // Slug middleware for resolving recipient
  const slugType = getSlugType(recipientSlug);
  const {
    profile: recipientProfile,
    relayList: recipientRelayList,
    isLoading: isLoadingRecipient,
    pubkey: recipientPubkey,
  } = useSlugMiddleware({
    slug: recipientSlug,
    initialProfile: defaultProfile,
    initialRelayList: [],
    hasServerData: false,
  });

  useEffect(() => {
    if (replyToEventId) {
      setSubject("Re: ");
      setContent("In reply to: " + replyToEventId + "\n\n");
    }
  }, [replyToEventId]);

  const handleSendLetter = async () => {
    if (!recipientSlug.trim() || !content.trim()) {
      return error("Please fill in recipient and content");
    }
    if (!recipientPubkey) {
      return error(
        "Unable to resolve recipient - please check the slug/pubkey"
      );
    }
    if (!nostr) {
      return error("Nostr not initialized");
    }

    setIsSending(true);
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
        return error("Password required to send letter");
      }

      const senderPrivkey = hexToBytes(await exportPrivateKey(password));
      const recipient = {
        publicKey: recipientPubkey,
      };

      // Build the letter content with subject if provided
      const letterContent = content.trim();

      // Handle reply functionality
      const extraTags = replyToEventId ? [["e", replyToEventId]] : [];
      if (subject && subject.trim() !== "") {
        extraTags.push(["subject", subject]);
      }

      // if selectedDOBId is provided
      if (selectedDOBId) {
        if(!signerInfo?.signer) {
          return error("No ckb signer found");
        };

        const receiverLock = createLockScriptFrom(`0x${recipientPubkey}`);
        // Create a mock letter event function
        const createLetterEvent = (powWrapEventExtraTags: string[][]): Promise<Event> => {
          return createPowNote({
            senderPrivkey,
            recipient,
            message: letterContent,
            difficulty: powDifficulty,
            extraTags,
            powWrapEventExtraTags,
          });
        };

        const {signedEvent, tx: onChainLetterTx, letterTypeHash} = await createOnChainLetter(
          receiverLock,
          signerInfo.signer,
          createLetterEvent
        );
        console.log("onChainLetterTx", onChainLetterTx, signedEvent);

        // TODO: send the letter tx and the DOB stamp tx in one transaction
        // Send the on-chain letter tx
        const onChainLetterTxHash = await signerInfo.signer.sendTransaction(onChainLetterTx);

        // seal the letter with the DOB stamp
        const sealedLetterTx = await attachLetterWithDOBAssets(
          letterTypeHash,
          selectedDOBId,
          signerInfo.signer
        );
        const sealedLetterTxHash = await signerInfo.signer.sendTransaction(sealedLetterTx);

        success(`
          on-chain letter tx hash: ${onChainLetterTxHash}
          sealed letter tx hash: ${sealedLetterTxHash}
          Sealed letter successfully! The receiver will receive two on-chain assets, first is the letter, second is the DOB stamp.
          `);

         // Show stamp dialog with the event ID
         const StampDialog = buildGeneratedStampDialog(
          powDifficulty,
          signedEvent
        );
        const shouldSend = await custom(StampDialog, { maxWidth: "md" });
        if (!shouldSend) {
          return error("Cancelled");
        }

        // Send to relays
        if (recipientRelayList.length > 0) {
          const res = await nostr.publishEventToRelays(
            signedEvent,
            recipientRelayList.map((relay) => relay.url)
          );
          info("Result", res.map((r) => `${r.relay}: ${r.result}`).join("\n"));
        } else {
          return error("No receiver's relay list found, can not send letter.");
        }

        // Clear form
        setRecipientSlug("");
        setSubject("");
        setContent("");

        success("Letter sent successfully!");

        return;
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
        return error("Cancelled");
      }

      // Send to relays
      if (recipientRelayList.length > 0) {
        const res = await nostr.publishEventToRelays(
          signedEvent,
          recipientRelayList.map((relay) => relay.url)
        );
        info("Result", res.map((r) => `${r.relay}: ${r.result}`).join("\n"));
      } else {
        return error("No receiver's relay list found, can not send letter.");
      }

      // Clear form
      setRecipientSlug("");
      setSubject("");
      setContent("");

      success("Letter sent successfully!");

      // Navigate back to mailbox
      router.push("/mailbox");
    } catch (err: any) {
      error(err instanceof Error ? err.message : "Failed to send letter");
    } finally {
      setIsSending(false);
    }
  };

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
        {/* Recipient */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            To (Public Key or Web5 DID)
          </label>
          <input
            type="text"
            value={recipientSlug}
            onChange={(e) => setRecipientSlug(e.target.value)}
            placeholder="hex public key or did:web5:..."
            className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600 transition-all font-mono"
            disabled={isReply}
          />
          {isReply && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Replying to this letter
            </p>
          )}
          {recipientSlug.trim() && (
            <div className="flex gap-2 text-xs text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <span>Type:</span>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    slugType === SlugType.Web5DID
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                  }`}
                >
                  {slugType === SlugType.Web5DID ? "Web5 DID" : "Public Key"}
                </span>
              </div>
              {recipientProfile && recipientProfile.name && (
                <div className="mt-1">
                  <span>{recipientProfile.name}</span>
                </div>
              )}
              {recipientPubkey && slugType === SlugType.Web5DID && (
                <div className="mt-1">
                  <span>Resolved to: {recipientPubkey.slice(0, 16)}...</span>
                </div>
              )}
            </div>
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

        {signerInfo?.signer && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              On-chain Stamp
            </label>
            <CollectibleAttachmentSelector
              onSelect={setSelectedDOBId}
              selectedId={selectedDOBId}
            />
          </div>
        )}

        {/* Content */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your letter here..."
            className="w-full h-64 px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 resize-none focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600 transition-all font-serif leading-relaxed"
            rows={12}
          />
        </div>

        <PowMiningIndicator
          isMining={isMining}
          powDifficulty={powDifficulty}
          onCancel={cancelMining}
        />

        <ReceiverRelayList
          isLoadingRecipient={isLoadingRecipient}
          recipientRelayList={recipientRelayList}
        />

        {/* POW Settings and Send */}
        <div className="flex justify-between items-center pt-2">
          <PowAdjustment
            powDifficulty={powDifficulty}
            setPowDifficulty={setPowDifficulty}
            disabled={isSending || isMining}
          />

          <button
            onClick={handleSendLetter}
            disabled={
              isSending ||
              isMining ||
              !recipientSlug.trim() ||
              !content.trim() ||
              !recipientPubkey ||
              recipientRelayList.length === 0
            }
            className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMining ? "Creating Stamp..." : isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default withAuth(ComposePage, { showInlineAuth: true });
