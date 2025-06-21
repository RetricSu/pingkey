"use client";

import { useState, useEffect } from "react";
import { DEFAULT_BIG_RELAY_URLS, LocalStorageKeys } from "app/lib/config";
import { useLocalStorage } from "app/hooks/useLocalStorage";
import { alert } from "app/components/dialog";

function SettingPage() {
  const [
    customDefaultRelays,
    setCustomDefaultRelays,
    removeCustomDefaultRelays,
  ] = useLocalStorage<string[]>(LocalStorageKeys.customDefaultRelaysKey, []);

  const [isEditingDefaultRelays, setIsEditingDefaultRelays] = useState(false);
  const [editedDefaultRelays, setEditedDefaultRelays] = useState<string[]>([]);
  const [newDefaultRelay, setNewDefaultRelay] = useState("");

  useEffect(() => {
    const effectiveDefaultRelays =
      customDefaultRelays.length > 0
        ? customDefaultRelays
        : DEFAULT_BIG_RELAY_URLS;
    setEditedDefaultRelays(effectiveDefaultRelays);
  }, [customDefaultRelays]);

  const handleSaveDefaultRelays = () => {
    if (editedDefaultRelays.length === 0) {
      removeCustomDefaultRelays();
    } else {
      setCustomDefaultRelays(editedDefaultRelays);
    }
    setIsEditingDefaultRelays(false);
  };

  const handleCancelDefaultRelays = () => {
    const effectiveDefaultRelays =
      customDefaultRelays.length > 0
        ? customDefaultRelays
        : DEFAULT_BIG_RELAY_URLS;
    setEditedDefaultRelays(effectiveDefaultRelays);
    setIsEditingDefaultRelays(false);
  };

  const handleAddDefaultRelay = () => {
    if (!newDefaultRelay.trim()) return;

    if (!editedDefaultRelays.includes(newDefaultRelay.trim())) {
      setEditedDefaultRelays([...editedDefaultRelays, newDefaultRelay.trim()]);
    }
    setNewDefaultRelay("");
  };

  const handleRemoveDefaultRelay = (index: number) => {
    setEditedDefaultRelays(editedDefaultRelays.filter((_, i) => i !== index));
  };

  const handleResetToBuiltInDefaults = () => {
    setEditedDefaultRelays([...DEFAULT_BIG_RELAY_URLS]);
  };

  return (
    <div className="">
      <div className="mt-6 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center align-middle gap-2">
            <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              Big Relays Configuration
              <button
                onClick={() =>
                  alert(
                    "Big Relay List",
                    "These are the default relays used for finding people's profile and relay lists and general network connectivity."
                  )
                }
                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                title="More information"
              >
                <svg
                  width="10"
                  height="10"
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
            </h2>
          </div>
          {!isEditingDefaultRelays && (
            <button
              onClick={() => setIsEditingDefaultRelays(true)}
              className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {isEditingDefaultRelays ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h3 className="text-xs font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  Configure Default Relays
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {customDefaultRelays.length > 0
                    ? "You are using custom default relays."
                    : "You are using the built-in default relays."}
                </p>
              </div>
              <button
                onClick={handleResetToBuiltInDefaults}
                className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                Reset to Built-in
              </button>
            </div>

            <div className="space-y-2">
              {editedDefaultRelays.length > 0 && (
                <h3 className="text-xs font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                  Default Relays
                </h3>
              )}
              {editedDefaultRelays.map((relayUrl, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800"
                >
                  <input
                    type="text"
                    value={relayUrl}
                    onChange={(e) => {
                      const newList = [...editedDefaultRelays];
                      newList[index] = e.target.value;
                      setEditedDefaultRelays(newList);
                    }}
                    className="flex-1 px-3 py-3 text-sm bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                  <button
                    onClick={() => handleRemoveDefaultRelay(index)}
                    className="px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-white dark:bg-black border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors min-w-[80px] sm:w-auto"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <input
                type="text"
                value={newDefaultRelay}
                onChange={(e) => setNewDefaultRelay(e.target.value)}
                placeholder="New default relay URL"
                className="flex-1 px-3 py-3 text-sm bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-100"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddDefaultRelay();
                  }
                }}
              />
              <button
                onClick={handleAddDefaultRelay}
                className="px-4 py-3 text-sm bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors min-w-[60px] sm:w-auto"
              >
                Add
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <button
                onClick={handleSaveDefaultRelays}
                className="px-4 py-3 text-sm bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
              >
                Save Local Changes
              </button>
              <button
                onClick={handleCancelDefaultRelays}
                className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors border border-neutral-200 dark:border-neutral-800 rounded hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {(customDefaultRelays.length > 0
                ? customDefaultRelays
                : DEFAULT_BIG_RELAY_URLS
              ).map((relayUrl, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 bg-neutral-50 dark:bg-neutral-900 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-900 dark:text-neutral-100">
                      {relayUrl}
                    </span>
                    {customDefaultRelays.length > 0 && (
                      <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-blue-700 dark:text-blue-300">
                        Custom
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {customDefaultRelays.length === 0 && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Using built-in default relays. Click "Edit Defaults" to
                customize.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingPage;
