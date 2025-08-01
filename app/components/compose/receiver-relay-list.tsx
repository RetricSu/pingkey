"use client";

import { RelayListItem } from "app/lib/type";

interface ReceiverRelayListProps {
  isLoadingRecipient: boolean;
  recipientRelayList: RelayListItem[];
}

export function ReceiverRelayList({
  isLoadingRecipient,
  recipientRelayList,
}: ReceiverRelayListProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        Receiver's Relay List
      </label>
      <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3">
        {isLoadingRecipient ? (
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <div className="w-4 h-4 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-600 dark:border-t-neutral-300 rounded-full animate-spin"></div>
            Fetching relay list...
          </div>
        ) : recipientRelayList.length > 0 ? (
          <div className="space-y-1">
            <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
              Letter will be sent to {recipientRelayList.length} relay
              {recipientRelayList.length !== 1 ? "s" : ""}:
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {recipientRelayList.map((relay, index) => (
                <div
                  key={index}
                  className="text-xs font-mono text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-600"
                >
                  {relay.url}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            No relay list found. Can not send letter.
          </div>
        )}
      </div>
    </div>
  );
}
