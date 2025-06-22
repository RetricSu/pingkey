"use client";

import { useAuth } from "app/contexts/auth";
import { useNostr } from "app/contexts/nostr";
import { useCallback, useEffect, useState } from "react";
import { Event } from "nostr-tools/core";
import { LetterCard } from "app/components/letter/letter-card";
import { CachedLetterCard } from "app/components/letter/cached-letter-card";
import { useUserRelayList } from "app/hooks/useUserRelayList";
import { withAuth } from "app/components/auth/with-auth";
import { Loader } from "app/components/loader";
import { getPow } from "nostr-tools/nip13";
import { StampWall } from "app/components/stamp/stamp-wall";
import { useDecryptedLettersCache } from "app/hooks/useDecryptedLettersCache";

type FilterType = "all" | "unread" | "read";

function MailBox() {
  const { isSignedIn, pubkey } = useAuth();
  const { nostr } = useNostr();
  const [giftWrappedNotes, setGiftWrappedNotes] = useState<Event[]>([]);
  const [currentFilter, setCurrentFilter] = useState<FilterType>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [powThreshold, setPowThreshold] = useState(16);
  const [showStampWall, setShowStampWall] = useState(false);
  const { relayList, isLoading: isRelayListLoading } = useUserRelayList();

  // Cache management
  const {
    isLetterCached,
    getCachedLetter,
    updateLastAccessed,
    reloadCache,
    cacheCount,
  } = useDecryptedLettersCache();

  // Force re-render when cache updates
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshMailbox = useCallback(() => {
    reloadCache(); // Force reload cache from localStorage
    setRefreshKey((prev) => prev + 1);
  }, [refreshKey, reloadCache]);

  const fetchGiftWrappedNotes = useCallback(async () => {
    if (!isSignedIn || !nostr || isRelayListLoading) return;

    setIsLoading(true);
    try {
      if (relayList.length > 0) {
        const notes = await nostr.fetchGiftWrappedNotes(
          pubkey!,
          relayList.map((relay) => relay.url)
        );
        setGiftWrappedNotes(notes);
      }
    } catch (error) {
      console.error("Error fetching gift wrapped notes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, nostr, pubkey, relayList, isRelayListLoading]);

  useEffect(() => {
    fetchGiftWrappedNotes();
  }, [fetchGiftWrappedNotes]);

  // Show loader while fetching relay list or notes
  if (isLoading || isRelayListLoading) {
    return <Loader message="Loading your letters..." />;
  }

  const sampleLetters = giftWrappedNotes.map((note) => ({
    id: note.id,
    from: note.pubkey,
    content: note.content,
    receivedAt: note.created_at * 1000,
    read: false,
    fullNote: note,
    powDifficulty: getPow(note.id),
  }));

  // Filter letters based on current filter
  const filteredLetters = sampleLetters.filter((letter) => {
    // Apply POW threshold to all filters
    const meetsPowRequirement = letter.powDifficulty >= powThreshold;

    switch (currentFilter) {
      case "unread":
        return !letter.read && meetsPowRequirement;
      case "read":
        return letter.read && meetsPowRequirement;
      case "all":
      default:
        return meetsPowRequirement;
    }
  });

  // Apply POW threshold to all counts
  const lettersWithPow = sampleLetters.filter(
    (letter) => letter.powDifficulty >= powThreshold
  );
  const unreadCount = lettersWithPow.filter((letter) => !letter.read).length;
  const totalCount = lettersWithPow.length;
  const readCount = totalCount - unreadCount;

  // Get event IDs for stamp wall (only letters with POW > 0)
  const stampEventIds = sampleLetters
    .filter((letter) => letter.powDifficulty > 0)
    .map((letter) => letter.id);

  const getButtonClassName = (filterType: FilterType) => {
    const baseClasses =
      "px-3 py-1.5 text-sm font-medium rounded-md transition-colors";
    const activeClasses =
      "text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800";
    const inactiveClasses =
      "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100";

    // When stamp wall is showing, no filter buttons should appear active
    const isActive = !showStampWall && currentFilter === filterType;
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
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
            {cacheCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                {cacheCount} decrypted
              </span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            className="cursor-pointer px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            onClick={() => {
              window.location.href = "/compose";
            }}
          >
            Compose
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            className={getButtonClassName("all")}
            onClick={() => {
              setCurrentFilter("all");
              setShowStampWall(false);
            }}
          >
            Received ({totalCount})
          </button>
          {stampEventIds.length > 0 && (
            <button
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                showStampWall
                  ? "text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
              onClick={() => setShowStampWall(!showStampWall)}
            >
              Collected Stamps ({stampEventIds.length})
            </button>
          )}
        </div>

        <div className="flex items-center justify-start sm:justify-end text-xs">
          <label
            htmlFor="powThreshold"
            className="mr-2 text-neutral-600 dark:text-neutral-400"
          >
            Filter POW {">= "}
          </label>
          <input
            id="powThreshold"
            type="number"
            min="1"
            max="64"
            value={powThreshold}
            onChange={(e) => setPowThreshold(parseInt(e.target.value) || 16)}
            className="w-16 px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500"
          />
        </div>
      </div>

      {/* Content - Letters or Stamp Wall */}
      {showStampWall ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              POW Stamp Collection
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {stampEventIds.length} stamps collected
            </p>
          </div>
          <StampWall
            eventIds={stampEventIds}
            columns={4}
            stampSize={{ width: 120, height: 150 }}
          />
        </div>
      ) : filteredLetters.length > 0 ? (
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
            .map((letter) => {
              const cachedContent = getCachedLetter(letter.id);
              const isCached = isLetterCached(letter.id);

              return isCached && cachedContent ? (
                <CachedLetterCard
                  key={`${letter.id}-${refreshKey}`}
                  letter={letter}
                  cachedContent={cachedContent}
                  onInteraction={() => updateLastAccessed(letter.id)}
                />
              ) : (
                <LetterCard
                  key={`${letter.id}-${refreshKey}`}
                  letter={letter}
                  onCacheUpdate={refreshMailbox}
                />
              );
            })}
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
            {currentFilter === "all"
              ? `No letters with POW ≥ ${powThreshold}`
              : currentFilter === "unread"
              ? "No unread letters"
              : "No read letters"}
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">
            {currentFilter === "all"
              ? `No letters found with POW difficulty ${powThreshold} or higher. Try lowering the POW threshold.`
              : currentFilter === "unread"
              ? "All your letters have been read!"
              : "No letters have been read yet."}
          </p>
          {currentFilter === "all" && (
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
