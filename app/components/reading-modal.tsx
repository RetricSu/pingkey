"use client";

import { useEffect, useRef } from "react";
import { formatDate } from "app/lib/util";
import { Stamp } from "./stamp";

interface ReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  letter: {
    from: string;
    subject: string;
    content: string;
    receivedAt: number;
  } | null;
}

export function ReadingModal({ isOpen, onClose, letter }: ReadingModalProps) {
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
          <Stamp />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          aria-label="Close modal"
        >
          <svg
            className="w-5 h-5 text-neutral-500 dark:text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="p-6 pl-12 pr-16 pt-8 overflow-y-auto max-h-[80vh]">
          {/* Header with timestamp - fixed layout */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 min-w-0">
              <span className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                From: {letter.from}
              </span>
            </div>
            <div className="flex-shrink-0 ml-4">
              <time className="text-xs text-neutral-500 dark:text-neutral-400 font-mono tracking-wide">
                {formatDate(letter.receivedAt, false)}
              </time>
            </div>
          </div>

          {/* Subject if available */}
          {letter.subject && (
            <div className="mb-6">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Subject: {letter.subject}
              </p>
            </div>
          )}

          {/* Letter content area - matching card style */}
          <div className="relative">
            <div className="bg-neutral-50/50 dark:bg-neutral-800/20 rounded-lg p-4 border border-neutral-100 dark:border-neutral-800/50">
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-sm font-medium whitespace-pre-wrap">
                {letter.content}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
