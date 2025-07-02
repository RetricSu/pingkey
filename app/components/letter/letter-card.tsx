"use client";

import { useState } from "react";
import { useAuth } from "app/contexts/auth";
import { useNostr } from "app/contexts/nostr";
import { unwrapEvent } from "nostr-tools/nip17";
import { Event } from "nostr-tools/core";
import { formatDate } from "app/lib/util";
import { hexToBytes } from "@noble/hashes/utils";
import { Stamp } from "../stamp/stamp";
import { ReadingLetterModal } from "./reading-letter";
import { getPow } from "nostr-tools/nip13";
import { prompt } from "../dialog";
import { getSubjectTitleFromEvent } from "app/lib/nostr";
import {
  useDecryptedLettersCache,
  DecryptedLetter,
} from "app/hooks/useDecryptedLettersCache";

export function LetterCard({
  letter,
  onCacheUpdate,
}: {
  letter: {
    id: string;
    from: string;
    content: string;
    receivedAt: number;
    read: boolean;
    fullNote: Event;
  };
  onCacheUpdate?: () => void;
}) {
  const { isSignedIn, exportPrivateKey } = useAuth();
  const { nostr } = useNostr();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [decryptedLetter, setDecryptedLetter] =
    useState<DecryptedLetter | null>(null);

  // Cache management
  const { isLetterCached, getCachedLetter, cacheDecryptedLetter } =
    useDecryptedLettersCache();
  const isCached = isLetterCached(letter.id);

  const decryptNote = async () => {
    if (isSignedIn && nostr) {
      const password = await prompt(
        "Enter your password",
        "Please enter your password to decrypt the letter:",
        "",
        {
          type: "password",
          placeholder: "Enter password",
          confirmLabel: "Decrypt",
        }
      );
      if (!password) return;

      try {
        const privateKey = await exportPrivateKey(password);
        const decryptedNote = await unwrapEvent(
          letter.fullNote,
          hexToBytes(privateKey)
        );

        // Create decrypted letter object
        const decryptedLetterContent: DecryptedLetter = {
          from: decryptedNote.pubkey,
          subject: getSubjectTitleFromEvent(decryptedNote as Event),
          content: decryptedNote.content,
          receivedAt: letter.receivedAt,
          deliveryEventId: letter.fullNote.id,
          replyToEventId: decryptedNote.id,
        };

        // Cache the decrypted letter
        cacheDecryptedLetter(letter.id, decryptedLetterContent);

        // Set the decrypted content and open modal
        setDecryptedLetter(decryptedLetterContent);
        setIsModalOpen(true);
      } catch (error) {
        console.error("Failed to decrypt letter:", error);
        alert("Failed to decrypt letter. Please check your password.");
      }
    }
  };

  const readCachedLetter = () => {
    const cachedContent = getCachedLetter(letter.id);
    if (cachedContent) {
      setDecryptedLetter(cachedContent);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setDecryptedLetter(null);

    // Notify parent that cache was updated (only after modal closes)
    if (decryptedLetter) {
      onCacheUpdate?.();
    }
  };

  return (
    <>
      <div
        className={`group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 sm:p-6 transition-all duration-200 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 ${
          !letter.read
            ? "ring-2 ring-neutral-100 dark:ring-neutral-800/50 bg-neutral-50/30 dark:bg-neutral-800/10"
            : ""
        }`}
      >
        {/* Floating Stamp in top-left corner */}
        <div className="absolute -top-2 -left-2 z-10">
          <Stamp
            hash={letter.fullNote.id}
            showArt={true}
            showPostmark={true}
            postmarkText="PINGKEY POW MAIL OFFICE"
            showDate={true}
            date={new Date(letter.receivedAt)}
            postmarkPosition="top-right"
          />
        </div>

        {/* Header with unread indicator and timestamp */}
        <div className="flex items-start justify-between mb-4 sm:mb-6 ml-6 sm:ml-8">
          <div className="flex items-center gap-2 sm:gap-3">
            {!letter.read && (
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-2 h-2 bg-neutral-600 dark:bg-neutral-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                  New
                </span>
              </div>
            )}
          </div>
          <time className="text-xs text-neutral-500 dark:text-neutral-400 font-mono tracking-wide whitespace-nowrap">
            {formatDate(letter.receivedAt, false)}
          </time>
        </div>

        {/* Letter content area */}
        <div className="relative">
          {/* Letter body */}
          <div className="text-center bg-neutral-50/50 dark:bg-neutral-800/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-neutral-100 dark:border-neutral-800/50">
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-xs sm:text-sm font-medium line-clamp-2 sm:line-clamp-4 italic mb-2">
              POW Difficulty: {getPow(letter.fullNote.id)}
            </p>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-xs sm:text-sm font-medium line-clamp-2 sm:line-clamp-4 italic font-mono break-all">
              {letter.fullNote.id}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-2">
          <button
            className="cursor-pointer flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors font-medium"
            onClick={isCached ? readCachedLetter : decryptNote}
          >
            {isCached ? "Read Letter" : "Decrypt Letter"}
          </button>
          {isCached && (
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full">
              <svg
                className="w-4 h-4 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      <ReadingLetterModal
        isOpen={isModalOpen}
        onClose={closeModal}
        letter={decryptedLetter}
      />
    </>
  );
}
