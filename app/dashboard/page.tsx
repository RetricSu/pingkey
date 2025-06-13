"use client";

import { useAuth } from "app/contexts/auth-context";
import { unwrapEvent } from "nostr-tools/nip17";
import { useEffect, useState } from "react";
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
  const { nostr, isSignedIn, pubkey, exportPrivateKey } = useAuth();

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

export default function Dashboard() {
  const { nostr, isSignedIn, pubkey, exportPrivateKey } = useAuth();

  const [giftWrappedNotes, setGiftWrappedNotes] = useState<Event[]>([]);

  const fetchGiftWrappedNotes = async () => {
    if (isSignedIn && nostr) {
      const notes = await nostr.fetchGiftWrappedNotes(pubkey!);
      setGiftWrappedNotes(notes);
    }
  };

  useEffect(() => {
    fetchGiftWrappedNotes();
  }, [isSignedIn, nostr, pubkey]);

  const sampleLetters = giftWrappedNotes.map((note) => ({
    id: note.id,
    from: note.pubkey.slice(0, 6) + "...",
    subject: "...",
    content: note.content.slice(0, 20),
    receivedAt: note.created_at,
    read: false,
    fullNote: note,
  }));

  const unreadCount = sampleLetters.filter((letter) => !letter.read).length;
  const totalCount = sampleLetters.length;

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Your Letters
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            {totalCount === 0
              ? "No letters yet"
              : `${totalCount} total letters`}
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            Mark all read
          </button>
          <button className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
            Compose
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <button className="px-3 py-1.5 text-sm font-medium text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 rounded-md">
          All
        </button>
        <button className="px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
          Unread ({unreadCount})
        </button>
        <button className="px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
          Read
        </button>
      </div>

      {/* Letters */}
      {sampleLetters.length > 0 ? (
        <div className="grid gap-4">
          {sampleLetters
            .sort((a, b) => {
              // Sort unread first, then by date
              if (a.read !== b.read) {
                return a.read ? 1 : -1;
              }
              return (
                new Date(b.receivedAt).getTime() -
                new Date(a.receivedAt).getTime()
              );
            })
            .map((letter) => (
              <LetterCard key={letter.id} letter={letter} />
            ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            No letters yet
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">
            When people send you letters, they'll appear here.
          </p>
          <button className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
            Share your profile
          </button>
        </div>
      )}
    </section>
  );
}
