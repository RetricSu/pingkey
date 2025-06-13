"use client";

import React, { useState, useEffect } from "react";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  type?: "prompt" | "confirm";
  inputType?: "text" | "password";
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: (value?: string) => void;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  message,
  type = "confirm",
  inputType = "password",
  placeholder,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
}: DialogProps) {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (isOpen) {
      setInputValue("");
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(type === "prompt" ? inputValue : undefined);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Dialog */}
      <div
        className="relative bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 w-full max-w-sm shadow-lg"
        onKeyDown={handleKeyDown}
      >
        <div className="mb-4">
          <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            {title}
          </h2>
          {message && (
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {message}
            </p>
          )}
        </div>

        {type === "prompt" && (
          <div className="mb-4">
            <input
              type={inputType}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={placeholder}
              autoFocus
              className="w-full px-3 py-2 text-xs bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-100"
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleConfirm}
            disabled={type === "prompt" && !inputValue.trim()}
            className="flex-1 px-3 py-2 text-xs bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded hover:bg-neutral-700 dark:hover:bg-neutral-300 disabled:opacity-50 transition-colors"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-50 transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
