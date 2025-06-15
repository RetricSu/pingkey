"use client";

import { useAuth } from "app/contexts/auth";
import { useNostr } from "app/contexts/nostr";
import { useCallback, useEffect, useState } from "react";
import { Event } from "nostr-tools/core";
import { LetterCard } from "app/components/letter-card";
import { useUserRelayList } from "app/hooks/useUserRelayList";
import { withAuth } from "app/components/auth/with-auth";

type FilterType = 'all' | 'unread' | 'read';

function MailBox() {
  const { isSignedIn, pubkey } = useAuth();
  const { nostr } = useNostr();
  const [giftWrappedNotes, setGiftWrappedNotes] = useState<Event[]>([]);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const { relayList, refetch: refetchRelayList } = useUserRelayList();

  const fetchGiftWrappedNotes = useCallback(async () => {
    if (relayList.length === 0) {
      await refetchRelayList();
    }

    if (isSignedIn && nostr) {
      if (relayList.length > 0) {
        const notes = await nostr.fetchGiftWrappedNotes(
          pubkey!,
          relayList.map((relay) => relay.url)
        );
        setGiftWrappedNotes(notes);
      } else {
        const notes = await nostr.fetchGiftWrappedNotes(pubkey!);
        setGiftWrappedNotes(notes);
      }
    }
  }, [isSignedIn, nostr, pubkey, relayList]);

  useEffect(() => {
    fetchGiftWrappedNotes();
  }, [isSignedIn, nostr, pubkey]);

  const sampleLetters = giftWrappedNotes.map((note) => ({
    id: note.id,
    from: note.pubkey.slice(0, 6) + "...",
    subject: "...",
    content: note.content.slice(0, 20),
    receivedAt: note.created_at * 1000,
    read: false,
    fullNote: note,
  }));

  // Filter letters based on current filter
  const filteredLetters = sampleLetters.filter((letter) => {
    switch (currentFilter) {
      case 'unread':
        return !letter.read;
      case 'read':
        return letter.read;
      case 'all':
      default:
        return true;
    }
  });

  const unreadCount = sampleLetters.filter((letter) => !letter.read).length;
  const totalCount = sampleLetters.length;
  const readCount = totalCount - unreadCount;

  const getButtonClassName = (filterType: FilterType) => {
    const baseClasses = "px-3 py-1.5 text-sm font-medium rounded-md transition-colors";
    const activeClasses = "text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800";
    const inactiveClasses = "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100";
    
    return `${baseClasses} ${currentFilter === filterType ? activeClasses : inactiveClasses}`;
  };

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Mailbox
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
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
          <button className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
            Compose
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <button 
          className={getButtonClassName('all')}
          onClick={() => setCurrentFilter('all')}
        >
          All
        </button>
        <button 
          className={getButtonClassName('unread')}
          onClick={() => setCurrentFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
        <button 
          className={getButtonClassName('read')}
          onClick={() => setCurrentFilter('read')}
        >
          Read ({readCount})
        </button>
      </div>

      {/* Letters */}
      {filteredLetters.length > 0 ? (
        <div className="grid gap-4">
          {filteredLetters
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
            {currentFilter === 'all' ? 'No letters yet' : 
             currentFilter === 'unread' ? 'No unread letters' : 
             'No read letters'}
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">
            {currentFilter === 'all' ? 'When people send you letters, they\'ll appear here.' :
             currentFilter === 'unread' ? 'All your letters have been read!' :
             'No letters have been read yet.'}
          </p>
          {currentFilter === 'all' && (
            <button className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
              Share your profile
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export default withAuth(MailBox, { showInlineAuth: true });
