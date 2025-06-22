"use client";

import { formatDate } from "app/lib/util";
import { getPow } from "nostr-tools/nip13";
import { Stamp } from "../stamp/stamp";
import { DecryptedLetter } from "app/hooks/useDecryptedLettersCache";
import { Event } from "nostr-tools/core";
import { useState, useRef, useEffect } from "react";

interface CachedLetterCardProps {
  letter: {
    id: string;
    from: string;
    content: string;
    receivedAt: number;
    read: boolean;
    fullNote: Event;
  };
  cachedContent: DecryptedLetter;
  onInteraction?: () => void;
}

export function CachedLetterCard({
  letter,
  cachedContent,
  onInteraction,
}: CachedLetterCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      // Check if content is longer than 4 lines (approximately)
      const lineHeight = parseInt(
        getComputedStyle(contentRef.current).lineHeight
      );
      const maxHeight = lineHeight * 4; // 4 lines
      setShowExpandButton(contentRef.current.scrollHeight > maxHeight);
    }
  }, [cachedContent.content]);

  return (
    <div className="group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 sm:p-6 transition-all duration-200 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 overflow-hidden">
      {/* Floating Stamp in top-left corner */}
      <div className="absolute -top-2 -left-2 z-10">
        <Stamp hash={letter.fullNote.id} showArt={true} />
      </div>

      {/* Header with timestamp and POW info */}
      <div className="flex items-start justify-between mb-4 sm:mb-6 ml-6 sm:ml-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-medium">
              From {cachedContent.from.slice(0, 8)}...
              {cachedContent.from.slice(-4)}
            </span>
            <span>POW: {getPow(letter.fullNote.id)}</span>
          </div>
        </div>
        <time className="text-xs text-neutral-500 dark:text-neutral-400 font-mono tracking-wide whitespace-nowrap">
          {formatDate(letter.receivedAt, false)}
        </time>
      </div>

      {/* Letter content */}
      <div className="space-y-4">
        {/* Subject if available */}
        {cachedContent.subject && (
          <div className="ml-6 sm:ml-8">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2 break-words">
              Subject: {cachedContent.subject}
            </h3>
          </div>
        )}

        {/* Decrypted content */}
        <div className="ml-6 sm:ml-8 bg-neutral-50/50 dark:bg-neutral-800/20 rounded-lg p-3 sm:p-4 border border-neutral-100 dark:border-neutral-800/50 overflow-hidden">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p
              ref={contentRef}
              className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap text-sm break-words overflow-wrap-anywhere transition-all duration-300"
              style={{
                display:
                  !isExpanded && showExpandButton ? "-webkit-box" : "block",
                WebkitLineClamp: !isExpanded && showExpandButton ? 4 : "unset",
                WebkitBoxOrient:
                  !isExpanded && showExpandButton ? "vertical" : "unset",
                overflow:
                  !isExpanded && showExpandButton ? "hidden" : "visible",
              }}
            >
              {cachedContent.content}
            </p>
            {showExpandButton && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
              >
                {isExpanded ? "收起" : "展开"}
              </button>
            )}
          </div>
        </div>

        {/* Footer with metadata */}
        <div className="ml-6 sm:ml-8 pt-3">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <button
              onClick={() => {
                const replyUrl = `/compose?replyToPubkey=${cachedContent.from}&replyToEventId=${cachedContent.replyToEventId}`;
                window.location.href = replyUrl;
              }}
              className="cursor-pointer flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors font-medium"
              title="Copy reply link"
            >
              Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
