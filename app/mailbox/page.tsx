"use client";

import { useAuth } from "app/contexts/auth";
import { useNostr } from "app/contexts/nostr";
import { useCallback, useEffect, useState } from "react";
import { Event } from "nostr-tools/core";
import { LetterCard } from "app/components/letter/letter-card";
import { CachedLetterCard } from "app/components/letter/cached-letter-card";
import { useUserRelayList } from "app/hooks/useUserRelayList";
import { withAuth } from "app/components/auth/with-auth";
import { Loader } from "app/components/gadget/loader";
import { getPow } from "nostr-tools/nip13";
import { StampWall } from "app/components/stamp/stamp-wall";
import { useDecryptedLettersCache } from "app/hooks/useDecryptedLettersCache";
import { RelayList } from "app/components/profile/relay-list";
import { useLocalStorage } from "app/hooks/useLocalStorage";
import { LocalStorageKeys, POW_CONFIG } from "app/lib/config";

type FilterType = "all" | "unread" | "read";

function MailBox() {
  const { isSignedIn, pubkey } = useAuth();
  const { nostr } = useNostr();
  const [giftWrappedNotes, setGiftWrappedNotes] = useState<Event[]>([]);
  const [currentFilter, setCurrentFilter] = useState<FilterType>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [powThreshold] = useLocalStorage<number>(
    LocalStorageKeys.powThresholdKey,
    POW_CONFIG.default_difficulty
  );
  const [showStampWall, setShowStampWall] = useState(false);
  const [showRelays, setShowRelays] = useState(false);
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
  const totalCount = lettersWithPow.length;

  // Get event IDs for stamp wall (only letters with POW > 0)
  const stampEventIds = sampleLetters
    .filter((letter) => letter.powDifficulty > 0)
    .map((letter) => letter.id);

  const getButtonClassName = (filterType: FilterType) => {
    const baseClasses =
      "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200";
    const activeClasses =
      "text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 shadow-sm";
    const inactiveClasses =
      "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800/50";

    // When stamp wall or relays are showing, no filter buttons should appear active
    const isActive =
      !showStampWall && !showRelays && currentFilter === filterType;
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-light tracking-tight text-neutral-900 dark:text-neutral-100">
          Mailbox
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {totalCount === 0
            ? "Your encrypted letters will appear here"
            : `${cacheCount} decrypted of ${totalCount} letters`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-center">
        <button
          className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200 shadow-lg hover:shadow-xl"
          onClick={() => {
            window.location.href = "/compose";
          }}
        >
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Compose Letter
        </button>
      </div>

      {/* Filters */}
      <div className="border-b border-neutral-200 dark:border-neutral-700 pb-6">
        <div className="flex flex-wrap justify-center gap-2">
          <button
            className={getButtonClassName("all")}
            onClick={() => {
              setCurrentFilter("all");
              setShowStampWall(false);
              setShowRelays(false);
            }}
          >
            All Letters ({totalCount})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              showRelays
                ? "text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            }`}
            onClick={() => {
              setShowRelays(!showRelays);
              setShowStampWall(false);
              setCurrentFilter("all");
            }}
          >
            Your Relays ({relayList.length})
          </button>
          {stampEventIds.length > 0 && (
            <button
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                showStampWall
                  ? "text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 shadow-sm"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              }`}
              onClick={() => {
                setShowStampWall(!showStampWall);
                setShowRelays(false);
                setCurrentFilter("all");
              }}
            >
              Stamp Collection ({stampEventIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Show loader while fetching relay list or notes */}
      {isLoading || isRelayListLoading ? (
        <Loader message="Loading your letters..." />
      ) : null}

      {/* Content - Relays, Letters, or Stamp Wall */}
      {showRelays ? (
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-light tracking-tight text-neutral-900 dark:text-neutral-100">
              Your Relays
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              {relayList.length} relays configured for receiving letters
            </p>
          </div>
          <RelayList
            relayList={relayList}
            title=""
            className="mt-0 mb-0 pt-0"
            enableConnectivityCheck={true}
            checkOnMount={true}
          />
        </div>
      ) : showStampWall ? (
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-light tracking-tight text-neutral-900 dark:text-neutral-100">
              Your POW Stamp Collection
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              {stampEventIds.length} unique stamps collected from your letters
            </p>
          </div>
          <StampWall
            eventIds={stampEventIds}
            columns={4}
            stampSize={{ width: 120, height: 150 }}
          />
        </div>
      ) : filteredLetters.length > 0 ? (
        <div className="space-y-6">
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
        <div className="text-center py-16 space-y-6">
          <div className="w-24 h-24 mx-auto bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-light text-neutral-900 dark:text-neutral-100">
              {currentFilter === "all"
                ? `No letters with POW ≥ ${powThreshold}`
                : currentFilter === "unread"
                ? "No unread letters"
                : "No read letters"}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-md mx-auto">
              {currentFilter === "all"
                ? `Letters with POW difficulty ${powThreshold} or higher will appear here. Try lowering the POW threshold to see more letters.`
                : currentFilter === "unread"
                ? "All your letters have been read! New encrypted letters will appear here."
                : "Letters you've read will appear here once you start decrypting them."}
            </p>
          </div>
          {currentFilter === "all" && (
            <button
              className="inline-block px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200 shadow-lg hover:shadow-xl"
              onClick={() => {
                window.location.href = "/p/" + pubkey;
              }}
            >
              Share your profile
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export default withAuth(MailBox, { showInlineAuth: true });
