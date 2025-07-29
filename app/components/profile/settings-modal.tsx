"use client";

import { useState, useEffect } from "react";
import { Profile, RelayListItem } from "app/lib/type";
import { CustomDialogProps } from "../gadget/dialog";
import { DEFAULT_BIG_RELAY_URLS } from "app/lib/config";
import { Avatar } from "./avatar";

interface SettingsModalProps extends CustomDialogProps {
  profile: Profile;
  relayList: RelayListItem[];
  publicKey: string; // Add publicKey as a prop
  onSaveProfile: (profile: Profile) => Promise<void>;
  onSaveRelays: (relayList: RelayListItem[]) => Promise<void>;
}

export function SettingsModal({
  profile,
  relayList,
  publicKey,
  onSaveProfile,
  onSaveRelays,
  onResolve,
  onReject,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "relays">("profile");
  const [editedProfile, setEditedProfile] = useState<Profile>(profile);
  const [editedRelayList, setEditedRelayList] =
    useState<RelayListItem[]>(relayList);
  const [newRelayUrl, setNewRelayUrl] = useState("");
  const [newRelayMarker, setNewRelayMarker] = useState<"r" | "w" | undefined>(
    undefined
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update state when props change
  useEffect(() => {
    setEditedProfile(profile);
  }, [profile]);

  useEffect(() => {
    setEditedRelayList(relayList);
  }, [relayList]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      if (activeTab === "profile") {
        await onSaveProfile(editedProfile);
      } else {
        await onSaveRelays(editedRelayList);
      }

      // Modal stays open after saving
    } catch (err) {
      setError("Failed to save changes");
      console.error("Error saving settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRelay = () => {
    if (!newRelayUrl.trim()) return;

    const newRelay: RelayListItem = {
      url: newRelayUrl.trim(),
      marker: newRelayMarker,
    };

    setEditedRelayList([...editedRelayList, newRelay]);
    setNewRelayUrl("");
    setNewRelayMarker(undefined);
  };

  const handleRemoveRelay = (index: number) => {
    setEditedRelayList(editedRelayList.filter((_, i) => i !== index));
  };

  const handleAddDefaultRelays = () => {
    const currentUrls = new Set(editedRelayList.map((relay) => relay.url));
    const newRelays = DEFAULT_BIG_RELAY_URLS.filter(
      (url) => !currentUrls.has(url)
    ).map((url) => ({ url, marker: undefined }));

    setEditedRelayList([...editedRelayList, ...newRelays]);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Edit Profile & Relays
        </h2>
        <button
          onClick={onReject}
          className="p-2 text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <svg
            width="16"
            height="16"
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
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 mb-6">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-3 font-medium text-sm transition-colors ${
            activeTab === "profile"
              ? "text-neutral-900 dark:text-neutral-100 border-b-2 border-neutral-900 dark:border-neutral-100"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab("relays")}
          className={`px-4 py-3 font-medium text-sm transition-colors ${
            activeTab === "relays"
              ? "text-neutral-900 dark:text-neutral-100 border-b-2 border-neutral-900 dark:border-neutral-100"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
          }`}
        >
          Relays
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Tab Content */}
      <div className="min-h-[420px] max-h-[500px] overflow-y-auto">
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Avatar Section */}
            <div>
              <div className="flex items-center gap-4">
                <Avatar
                  publicKey={publicKey}
                  pictureUrl={editedProfile.picture}
                  alt="Current profile"
                  size={80}
                />
                <div className="flex-1">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Avatar upload is coming soon! Your current avatar is
                    generated from your public key.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={editedProfile.name || ""}
                onChange={(e) =>
                  setEditedProfile({ ...editedProfile, name: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 focus:border-transparent bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 transition-all"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label
                htmlFor="about"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                About
              </label>
              <textarea
                id="about"
                value={editedProfile.about || ""}
                onChange={(e) =>
                  setEditedProfile({ ...editedProfile, about: e.target.value })
                }
                rows={12}
                className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 focus:border-transparent bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 transition-all resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        )}

        {activeTab === "relays" && (
          <div className="space-y-6">
            {/* Add Default Relays Button */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Relay List
              </h3>
              <button
                onClick={handleAddDefaultRelays}
                className="text-sm px-3 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-medium"
              >
                Add Default Relays
              </button>
            </div>

            {/* Current Relays */}
            <div className="space-y-3">
              {editedRelayList.map((relay, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800"
                >
                  <input
                    type="text"
                    value={relay.url}
                    onChange={(e) => {
                      const newList = [...editedRelayList];
                      newList[index].url = e.target.value;
                      setEditedRelayList(newList);
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 transition-all"
                  />
                  <select
                    value={relay.marker || ""}
                    onChange={(e) => {
                      const newList = [...editedRelayList];
                      newList[index].marker = e.target.value as
                        | "r"
                        | "w"
                        | undefined;
                      setEditedRelayList(newList);
                    }}
                    className="px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 transition-all"
                  >
                    <option value="">Both</option>
                    <option value="r">Read</option>
                    <option value="w">Write</option>
                  </select>
                  <button
                    onClick={() => handleRemoveRelay(index)}
                    className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Relay */}
            <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <input
                type="text"
                value={newRelayUrl}
                onChange={(e) => setNewRelayUrl(e.target.value)}
                placeholder="wss://relay.example.com"
                className="flex-1 px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddRelay();
                  }
                }}
              />
              <select
                value={newRelayMarker || ""}
                onChange={(e) =>
                  setNewRelayMarker(e.target.value as "r" | "w" | undefined)
                }
                className="px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 transition-all"
              >
                <option value="">Both</option>
                <option value="r">Read</option>
                <option value="w">Write</option>
              </select>
              <button
                onClick={handleAddRelay}
                className="px-4 py-2 text-sm bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors font-medium"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <button
          onClick={onReject}
          disabled={isSaving}
          className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 text-sm bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors disabled:opacity-50 font-medium"
        >
          {isSaving
            ? "Saving..."
            : activeTab === "profile"
            ? "Save Profile"
            : "Save Relays"}
        </button>
      </div>
    </div>
  );
}
