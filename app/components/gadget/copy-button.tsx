"use client";

import { useState } from "react";

interface CopyButtonProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function CopyButton({ value, children, className = "" }: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 transition-colors hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer ${className}`}
      title={`Click to copy: ${value}`}
    >
      {isCopied ? (
        <span className="text-green-600 dark:text-green-400">Copied!</span>
      ) : (
        children
      )}
      <svg
        className={`w-3 h-3 transition-colors ${
          isCopied ? "text-green-500" : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {isCopied ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        )}
      </svg>
    </button>
  );
} 
