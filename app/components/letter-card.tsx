"use client";

import { useAuth } from "app/contexts/auth";
import { useNostr } from "app/contexts/nostr";
import { unwrapEvent } from "nostr-tools/nip17";
import { Event } from "nostr-tools/core";
import { formatDate } from "app/lib/util";
import { hexToBytes } from "@noble/hashes/utils";

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

  const decryptNote = async () => {
    if (isSignedIn && nostr) {
      const password = prompt("Enter your password");
      const privateKey = await exportPrivateKey(password!);
      const decryptedNote = await unwrapEvent(
        letter.fullNote,
        hexToBytes(privateKey)
      );
      console.log(decryptedNote);
    }
  };

  return (
    <div
      className={`group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 transition-all duration-200 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 ${
        !letter.read
          ? "ring-2 ring-blue-100 dark:ring-blue-900/20 bg-blue-50/30 dark:bg-blue-950/10"
          : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 rounded-full flex items-center justify-center text-sm font-medium text-neutral-600 dark:text-neutral-300">
              {letter.from
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                {letter.from}
              </h3>
            </div>
          </div>
          {!letter.read && (
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          )}
        </div>
        <time className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
          {formatDate(letter.receivedAt, false)}
        </time>
      </div>

      <h4 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-3 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors">
        {letter.subject}
      </h4>

      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6 line-clamp-3">
        {letter.content}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            onClick={decryptNote}
          >
            Decrypt
          </button>
          {!letter.read && (
            <button className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
              Mark as read
            </button>
          )}
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
