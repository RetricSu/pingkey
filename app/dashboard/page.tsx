"use client";

import { useAuth } from "app/contexts/auth";
import { useNostr } from "app/contexts/nostr";
import { useEffect, useState } from "react";
import { Event } from "nostr-tools/core";
import { LetterCard } from "app/components/letter-card";

export default function Dashboard() {
  const { isSignedIn, pubkey } = useAuth();
  const { nostr } = useNostr();
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
