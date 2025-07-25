"use client";

import { useState, useEffect, useRef } from "react";
import { Tooltip } from "app/components/tooltip";

interface PowAdjustmentProps {
  powDifficulty: number;
  setPowDifficulty: (difficulty: number) => void;
  disabled?: boolean;
}

export function PowAdjustment({
  powDifficulty,
  setPowDifficulty,
  disabled = false,
}: PowAdjustmentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(powDifficulty.toString());

  // Sync tempValue when powDifficulty changes externally
  useEffect(() => {
    if (!isEditing) {
      setTempValue(powDifficulty.toString());
    }
  }, [powDifficulty, isEditing]);

  const handleDecrease = () => {
    const newValue = Math.max(1, powDifficulty - 1);
    setPowDifficulty(newValue);
  };

  const handleIncrease = () => {
    const newValue = Math.min(64, powDifficulty + 1);
    setPowDifficulty(newValue);
  };

  const handleInputChange = (value: string) => {
    setTempValue(value);
  };

  const handleInputSubmit = () => {
    const numValue = parseInt(tempValue);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 64) {
      setPowDifficulty(numValue);
    } else {
      setTempValue(powDifficulty.toString());
    }
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleInputSubmit();
    } else if (e.key === "Escape") {
      setTempValue(powDifficulty.toString());
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-visible relative">
      {/* POW Label */}
      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          POW
        </span>
      </div>

      {/* Decrease Button */}
      <button
        onClick={handleDecrease}
        disabled={disabled || powDifficulty <= 1}
        className="flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Decrease POW difficulty"
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
          <path d="M5 12h14" />
        </svg>
      </button>

      {/* Value Display/Input */}
      <div className="flex-1 flex items-center justify-center min-w-0">
        {isEditing ? (
          <input
            type="number"
            min="1"
            max="64"
            value={tempValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleInputSubmit}
            onKeyDown={handleInputKeyDown}
            className="w-full h-10 sm:h-8 bg-transparent text-sm text-gray-900 dark:text-gray-100 focus:outline-none text-center font-mono px-2"
            autoFocus
          />
        ) : (
          <button
            onClick={() => {
              setIsEditing(true);
              setTempValue(powDifficulty.toString());
            }}
            disabled={disabled}
            className="w-full h-10 sm:h-8 text-sm text-gray-900 dark:text-gray-100 font-mono hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:cursor-not-allowed"
          >
            {powDifficulty}
          </button>
        )}
      </div>

      {/* Increase Button */}
      <button
        onClick={handleIncrease}
        disabled={disabled || powDifficulty >= 64}
        className="flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Increase POW difficulty"
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
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      </button>

      {/* Difficulty Info */}
      <Tooltip
        content="POW is the difficulty of the proof of work required for your browser to send a message. It is used as a spam protection mechanism for relaying messages. Higher POW means more spam-proof, but consumes more CPU power."
        position="top"
      >
        <button
          className="flex items-center justify-center w-8 h-10 sm:h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="POW difficulty info"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        </button>
      </Tooltip>
    </div>
  );
} 
