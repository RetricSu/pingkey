"use client";

import { useEffect, useRef } from "react";
import { formatDate } from "app/lib/util";
import { Stamp } from "./stamp";
import { getPow } from "nostr-tools/nip13";

interface ReadingLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  letter: {
    from: string;
    subject?: string | null;
    content: string;
    receivedAt: number;
    eventId: string;
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <div
        ref={modalRef}
        className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] transition-all duration-200"
      >
        {/* Floating Stamp in top-left corner */}
        <div className="absolute -top-1 -left-1 z-10">
          <Stamp hash={letter.eventId} showArt={true} />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-6 h-6 flex items-center justify-center text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
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
        <div className="mt-8 p-8 pl-16 pr-12 pt-12 overflow-y-auto max-h-[80vh]">
          {/* Subtle eventid line */}
          <div className="pt-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500">
              <span className="font-mono">{letter.eventId}</span>
              <span>POW: {getPow(letter.eventId)}</span>
            </div>
          </div>

          {/* Letter Header - elegant and minimal */}
          <div className="mt-4 mb-6 text-left">
            <div>
              <time className="text-sm text-neutral-500 dark:text-neutral-400 font-serif italic">
                {formatDate(letter.receivedAt, false)}
              </time>
            </div>

            <div>
              <time className="text-sm text-neutral-500 dark:text-neutral-400 font-serif italic">
                From: {letter.from}
              </time>
            </div>

            <div>
              <time className="text-sm text-neutral-500 dark:text-neutral-400 font-serif italic">
                Subject: {letter.subject}
              </time>
            </div>
          </div>

          {/* Letter Body - clean and readable */}
          <div className="mb-12">
            <div className="text-neutral-800 dark:text-neutral-200 leading-loose font-serif whitespace-pre-wrap">
              {letter.content}
            </div>
          </div>

          {/* Reply Button */}
          <div className="flex justify-center w-full">
            <button
              onClick={() => {
                window.location.href = `/compose?replyToEventId=${letter.eventId}&replyToPubkey=${letter.from}`;
              }}
              className="w-full px-6 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-medium text-sm flex items-center gap-2 justify-center"
            >
              Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
