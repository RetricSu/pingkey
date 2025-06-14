import { useCallback } from "react";
import { useNotification } from "../contexts/notification";

interface PowMiningIndicatorProps {
  isMining: boolean;
  powDifficulty: number;
  onCancel: () => void;
}

export function PowMiningIndicator({
  isMining,
  powDifficulty,
  onCancel,
}: PowMiningIndicatorProps) {
  const { success } = useNotification();

  const handleCancel = useCallback(() => {
    onCancel();
    success("POW mining cancelled");
  }, [onCancel, success]);

  if (!isMining) return null;

  const isUsingWebWorker = powDifficulty >= 2;

  return (
    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-600 dark:text-blue-400">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
          <div>
            <div>
              Mining Proof of Work... This may take a while depending on
              difficulty.
            </div>
            <div className="text-xs mt-1 opacity-75">
              {isUsingWebWorker
                ? "🧵 Using Web Worker (non-blocking UI)"
                : "⚡ Using main thread (faster for low difficulty)"}
            </div>
          </div>
        </div>
        {isUsingWebWorker && (
          <button
            onClick={handleCancel}
            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
} 