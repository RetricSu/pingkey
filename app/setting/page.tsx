"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/auth";
import { useNostr } from "../contexts/nostr";
import { useUserProfile } from "../hooks/useUserProfile";
import { useUserRelayList } from "../hooks/useUserRelayList";
import { Profile, RelayListItem } from "app/lib/type";
import {
  defaultProfile,
  defaultRelays,
  LocalStorageKeys,
} from "app/lib/config";
import { useLocalStorage } from "app/hooks/useLocalStorage";
import { withAuth } from "app/components/auth/with-auth";
import { Loader } from "app/components/loader";
import { alert } from "app/components/dialog";

function SettingPage() {
  const { pubkey } = useAuth();
  const { nostr } = useNostr();
  const {
    profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useUserProfile();

  const {
    relayList,
    isLoading: relayListLoading,
    error: relayListError,
    refetch: refetchRelayList,
  } = useUserRelayList();

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile>(
    profile || defaultProfile
  );
  const [error, setError] = useState<string | null>(null);
  const [editedRelayList, setEditedRelayList] = useState<RelayListItem[]>([]);
  const [isEditingRelays, setIsEditingRelays] = useState(false);
  const [newRelayUrl, setNewRelayUrl] = useState("");
  const [newRelayMarker, setNewRelayMarker] = useState<"r" | "w" | undefined>(
    undefined
  );

  // Custom default relays state
  const [
    customDefaultRelays,
    setCustomDefaultRelays,
    removeCustomDefaultRelays,
  ] = useLocalStorage<string[]>(LocalStorageKeys.customDefaultRelaysKey, []);
  const [isEditingDefaultRelays, setIsEditingDefaultRelays] = useState(false);
  const [editedDefaultRelays, setEditedDefaultRelays] = useState<string[]>([]);
  const [newDefaultRelay, setNewDefaultRelay] = useState("");

  // Update editedProfile when profile changes
  useEffect(() => {
    if (profile) {
      setEditedProfile(profile);
    }
  }, [profile]);

  // Update editedRelayList when relayList changes
  useEffect(() => {
    setEditedRelayList(relayList);
  }, [relayList]);

  // Update editedDefaultRelays when customDefaultRelays changes
  useEffect(() => {
    const effectiveDefaultRelays =
      customDefaultRelays.length > 0 ? customDefaultRelays : defaultRelays;
    setEditedDefaultRelays(effectiveDefaultRelays);
  }, [customDefaultRelays]);

  const handleSave = async () => {
    if (!nostr || !pubkey) return;

    try {
      const nostrProfile: Profile = {
        name: editedProfile.name,
        picture: editedProfile.picture,
        about: editedProfile.about,
      };

      const result = await nostr.setupProfile(nostrProfile);

      if (result) {
        // Refetch the profile to update cache and local state
        await refetchProfile();
        setIsEditing(false);
        setError(null);
      } else {
        setError("Failed to update profile");
      }
    } catch (err) {
      setError("Failed to update profile");
      console.error("Error updating profile:", err);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile || defaultProfile);
    setIsEditing(false);
  };

  const handleSaveRelays = async () => {
    if (!nostr || !pubkey) return;

    try {
      const result = await nostr.publishNip65RelayListEvent(editedRelayList);
      if (result) {
        // Refetch the relay list to update cache and local state
        await refetchRelayList();
        setIsEditingRelays(false);
        setError(null);
      } else {
        setError("Failed to update relay list");
      }
    } catch (err) {
      setError("Failed to update relay list");
      console.error("Error updating relay list:", err);
    }
  };

  const handleCancelRelays = () => {
    setEditedRelayList(relayList);
    setIsEditingRelays(false);
  };

  const handleAddRelay = () => {
    if (!newRelayUrl) return;

    const newRelay: RelayListItem = {
      url: newRelayUrl,
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
    const effectiveDefaultRelays =
      customDefaultRelays.length > 0 ? customDefaultRelays : defaultRelays;
    const newRelays = effectiveDefaultRelays
      .filter((url) => !currentUrls.has(url))
      .map((url) => ({ url, marker: undefined }));

    setEditedRelayList([...editedRelayList, ...newRelays]);
  };

  // Default relay management handlers
  const handleSaveDefaultRelays = () => {
    if (editedDefaultRelays.length === 0) {
      // If empty, remove custom relays (revert to built-in defaults)
      removeCustomDefaultRelays();
    } else {
      // Save custom default relays
      setCustomDefaultRelays(editedDefaultRelays);
    }
    setIsEditingDefaultRelays(false);
    setError(null);
  };

  const handleCancelDefaultRelays = () => {
    const effectiveDefaultRelays =
      customDefaultRelays.length > 0 ? customDefaultRelays : defaultRelays;
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
    setEditedDefaultRelays([...defaultRelays]);
  };

  if (profileLoading || relayListLoading) {
    return <Loader />;
  }

  if (profileError || relayListError || error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm text-red-600 dark:text-red-400">
          {profileError || relayListError || error}
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Profile Information
          </h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={editedProfile.name}
                onChange={(e) =>
                  setEditedProfile({ ...editedProfile, name: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div>
              <label
                htmlFor="avatarUrl"
                className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1"
              >
                Avatar URL
              </label>
              <input
                id="avatarUrl"
                type="text"
                value={editedProfile.picture}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    picture: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-sm bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div>
              <label
                htmlFor="introduction"
                className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1"
              >
                Introduction
              </label>
              <textarea
                id="introduction"
                value={editedProfile.about}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    about: e.target.value,
                  })
                }
                rows={6}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:space-x-8 space-y-4 sm:space-y-0">
              <div className="flex flex-col items-center sm:items-start w-full sm:w-auto min-w-[120px]">
                <img
                  src={profile?.picture}
                  alt={profile?.name}
                  className="w-24 h-24 rounded-full border border-neutral-200 dark:border-neutral-800 object-cover mb-2"
                />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 text-center sm:text-left">
                  {profile?.name}
                </h3>
              </div>
              <div className="flex-1 w-full flex flex-col justify-center">
                <p className="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {profile?.about}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Relay List (NIP-65)
          </h2>
          {!isEditingRelays && (
            <button
              onClick={() => setIsEditingRelays(true)}
              className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              Edit Relays
            </button>
          )}
        </div>

        {isEditingRelays ? (
          <div className="space-y-4">
            {/* Default Relays Section */}
            <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                  Default Relays
                </h3>
                <button
                  onClick={handleAddDefaultRelays}
                  className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                >
                  Add Missing Defaults
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(customDefaultRelays.length > 0
                  ? customDefaultRelays
                  : defaultRelays
                ).map((relayUrl, index) => {
                  const isAlreadyAdded = editedRelayList.some(
                    (relay) => relay.url === relayUrl
                  );
                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded text-xs ${
                        isAlreadyAdded
                          ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                          : "bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                      }`}
                    >
                      <span
                        className={`truncate ${
                          isAlreadyAdded
                            ? "text-green-700 dark:text-green-300"
                            : "text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {relayUrl}
                      </span>
                      {isAlreadyAdded ? (
                        <span className="text-green-600 dark:text-green-400 ml-2 flex-shrink-0">
                          ✓
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            const newRelay: RelayListItem = {
                              url: relayUrl,
                              marker: undefined,
                            };
                            setEditedRelayList([...editedRelayList, newRelay]);
                          }}
                          className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 ml-2 flex-shrink-0"
                        >
                          +
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              {editedRelayList.length > 0 && (
                <h3 className="text-xs font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                  Your Relays
                </h3>
              )}
              {editedRelayList.map((relay, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800"
                >
                  <input
                    type="text"
                    value={relay.url}
                    onChange={(e) => {
                      const newList = [...editedRelayList];
                      newList[index].url = e.target.value;
                      setEditedRelayList(newList);
                    }}
                    className="flex-1 px-3 py-3 text-sm bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                  <div className="flex gap-2">
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
                      className="flex-1 sm:w-auto px-3 py-3 text-sm bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-100"
                    >
                      <option value="">No marker</option>
                      <option value="r">Read</option>
                      <option value="w">Write</option>
                    </select>
                    <button
                      onClick={() => handleRemoveRelay(index)}
                      className="px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-white dark:bg-black border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors min-w-[80px] sm:w-auto"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <input
                type="text"
                value={newRelayUrl}
                onChange={(e) => setNewRelayUrl(e.target.value)}
                placeholder="New relay URL"
                className="flex-1 px-3 py-3 text-sm bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-100"
              />
              <div className="flex gap-2">
                <select
                  value={newRelayMarker || ""}
                  onChange={(e) =>
                    setNewRelayMarker(e.target.value as "r" | "w" | undefined)
                  }
                  className="flex-1 sm:w-auto px-3 py-3 text-sm bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-100"
                >
                  <option value="">No marker</option>
                  <option value="r">Read</option>
                  <option value="w">Write</option>
                </select>
                <button
                  onClick={handleAddRelay}
                  className="px-4 py-3 text-sm bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors min-w-[60px] sm:w-auto"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <button
                onClick={handleSaveRelays}
                className="px-4 py-3 text-sm bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancelRelays}
                className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors border border-neutral-200 dark:border-neutral-800 rounded hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {relayList.length === 0 ? (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                No relays configured. Click "Edit Relays" to add some.
              </p>
            ) : (
              <div className="space-y-2">
                {relayList.map((relay, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 bg-neutral-50 dark:bg-neutral-900 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-900 dark:text-neutral-100">
                        {relay.url}
                      </span>
                      {relay.marker && (
                        <span className="text-xs px-2 py-1 bg-neutral-200 dark:bg-neutral-800 rounded text-neutral-700 dark:text-neutral-300">
                          {relay.marker === "r" ? "Read" : "Write"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Default Relays Configuration Section */}
      <div className="mt-6 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center align-middle gap-2">
            <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              Boot Node Relay List Configuration
              <button
                onClick={() =>
                  alert(
                    "Boot Node Relay List",
                    "These are the default relays used for finding people's relay lists and general network connectivity."
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
                Save Changes
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
                : defaultRelays
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

export default withAuth(SettingPage, { showInlineAuth: true });
