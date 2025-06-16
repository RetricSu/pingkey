import { useCallback } from "react";
import { useNotification } from "app/contexts/notification";
import { POW_CONFIG } from "app/lib/config";

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

  const isUsingWebWorker = powDifficulty >= POW_CONFIG.difficulty_mode_level;

  return (
    <div className="p-3 bg-neutral-50 dark:bg-neutral-900/20 border border-neutral-200 dark:border-neutral-800 rounded text-sm text-neutral-700 dark:text-neutral-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-600 dark:border-t-neutral-300 rounded-full animate-spin"></div>
          <div>
            <div className="text-neutral-900 dark:text-neutral-100 font-medium">
              Mining Proof of Work... This may take a while depending on
              difficulty.
            </div>
            <div className="text-xs mt-1 opacity-75 text-neutral-600 dark:text-neutral-400">
              {isUsingWebWorker
                ? "🧵 Using Web Worker (non-blocking UI)"
                : "⚡ Using main thread (faster for low difficulty)"}
            </div>
          </div>
        </div>
        {isUsingWebWorker && (
          <button
            onClick={handleCancel}
            className="px-3 py-1 text-xs bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
} 
