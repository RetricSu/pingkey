"use client";

import { useEffect, useRef } from "react";
import { formatDate } from "app/lib/util";
import { Stamp } from "../stamp/stamp";
import { getPow } from "nostr-tools/nip13";

interface ReadingLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  letter: {
    from: string;
    subject?: string | null;
    content: string;
    receivedAt: number;
    deliveryEventId: string;
    replyToEventId: string;
  } | null;
}

export function ReadingLetterModal({
  isOpen,
  onClose,
  letter,
}: ReadingLetterModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !letter) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-8">
      <div
        ref={modalRef}
        className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] sm:max-h-[80vh] transition-all duration-200 overflow-hidden"
      >
        {/* Floating Stamp in top-left corner */}
        <div className="absolute -top-1 -left-1 z-10">
          <Stamp hash={letter.deliveryEventId} showArt={true} />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 w-6 h-6 flex items-center justify-center text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
          aria-label="Close modal"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="mt-6 sm:mt-8 p-4 sm:p-8 pl-8 sm:pl-16 pr-8 sm:pr-12 pt-8 sm:pt-12 overflow-y-auto max-h-[90vh] sm:max-h-[80vh]">
          {/* Subtle eventid line */}
          <div className="pt-4 sm:pt-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-neutral-400 dark:text-neutral-500">
              <span className="font-mono break-all text-xs">{letter.deliveryEventId}</span>
              <span className="whitespace-nowrap">POW: {getPow(letter.deliveryEventId)}</span>
            </div>
          </div>

          {/* Letter Header - elegant and minimal */}
          <div className="mt-3 sm:mt-4 mb-4 sm:mb-6 text-left space-y-1 sm:space-y-0">
            <div>
              <time className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-serif italic">
                {formatDate(letter.receivedAt, false)}
              </time>
            </div>

            <div>
              <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-serif italic">
                From: <span className="font-mono break-all text-xs">{letter.from}</span>
              </span>
            </div>

            <div>
              <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-serif italic">
                Subject: {letter.subject}
              </span>
            </div>
          </div>

          {/* Letter Body - clean and readable */}
          <div className="mb-8 sm:mb-12 text-neutral-800 dark:text-neutral-200 font-serif whitespace-pre-wrap text-sm sm:text-base break-words">
            {letter.content}
          </div>

          {/* Reply Button */}
          <div className="flex justify-center w-full">
            <button
              onClick={() => {
                window.location.href = `/compose?replyToEventId=${letter.replyToEventId}&replyToPubkey=${letter.from}`;
              }}
              className="w-full px-4 sm:px-6 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-medium text-xs sm:text-sm flex items-center gap-2 justify-center"
            >
              Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
