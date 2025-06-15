"use client";

import { useState } from "react";
import { useAuth } from "app/contexts/auth";
import { useNostr } from "app/contexts/nostr";
import { unwrapEvent } from "nostr-tools/nip17";
import { Event } from "nostr-tools/core";
import { formatDate } from "app/lib/util";
import { hexToBytes } from "@noble/hashes/utils";
import { Stamp } from "./stamp";
import { ReadingModal } from "./reading-modal";
import { getPow } from "nostr-tools/nip13";
import { prompt } from "./dialog";

export function LetterCard({
  letter,
}: {
  letter: {
    id: string;
    from: string;
    subject: string;
    content: string;
    receivedAt: number;
    read: boolean;
    fullNote: Event;
  };
}) {
  const { isSignedIn, exportPrivateKey } = useAuth();
  const { nostr } = useNostr();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [decryptedLetter, setDecryptedLetter] = useState<{
    from: string;
    subject: string;
    content: string;
    receivedAt: number;
    eventId: string;
  } | null>(null);

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

        // Set the decrypted content and open modal
        setDecryptedLetter({
          from: letter.from,
          subject: letter.subject,
          content: decryptedNote.content,
          receivedAt: letter.receivedAt,
          eventId: letter.fullNote.id,
        });
        setIsModalOpen(true);
      } catch (error) {
        console.error("Failed to decrypt letter:", error);
        alert("Failed to decrypt letter. Please check your password.");
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setDecryptedLetter(null);
  };

  return (
    <>
      <div
        className={`group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 transition-all duration-200 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 ${
          !letter.read
            ? "ring-2 ring-neutral-100 dark:ring-neutral-800/50 bg-neutral-50/30 dark:bg-neutral-800/10"
            : ""
        }`}
      >
        {/* Floating Stamp in top-left corner */}
        <div className="absolute -top-2 -left-2 z-10">
          <Stamp hash={letter.fullNote.id} showArt={true} />
        </div>

        {/* Header with unread indicator and timestamp */}
        <div className="flex items-start justify-between mb-6 ml-8">
          <div className="flex items-center gap-3">
            {!letter.read && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-neutral-600 dark:bg-neutral-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                  New
                </span>
              </div>
            )}
          </div>
          <time className="text-xs text-neutral-500 dark:text-neutral-400 font-mono tracking-wide">
            {formatDate(letter.receivedAt, false)}
          </time>
        </div>

        {/* Letter content area */}
        <div className="relative">
          {/* Letter body */}
          <div className="text-center bg-neutral-50/50 dark:bg-neutral-800/20 rounded-lg p-4 mb-6 border border-neutral-100 dark:border-neutral-800/50">
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-sm font-medium line-clamp-4 italic">
              POW Difficulty: {getPow(letter.fullNote.id)}
            </p>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-sm font-medium line-clamp-4 italic">
              {letter.fullNote.id}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center">
          <button
            className="cursor-pointer w-full px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors font-medium"
            onClick={decryptNote}
          >
            Decrypt Letter
          </button>
        </div>
      </div>

      <ReadingModal
        isOpen={isModalOpen}
        onClose={closeModal}
        letter={decryptedLetter}
      />
    </>
  );
}
