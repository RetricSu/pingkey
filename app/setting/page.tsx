"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/auth";
import { useNostr } from "../contexts/nostr";
import { useUserProfile } from "../hooks/useUserProfile";
import { useUserRelayList } from "../hooks/useUserRelayList";
import { Profile, RelayListItem } from "app/lib/type";
import { defaultProfile } from "app/lib/config";

export default function SettingPage() {
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

  if (profileLoading || relayListLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neutral-200 dark:border-neutral-800 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin"></div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Loading...
          </div>
        </div>
      </div>
    );
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
            <div className="space-y-2">
              {editedRelayList.map((relay, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={relay.url}
                    onChange={(e) => {
                      const newList = [...editedRelayList];
                      newList[index].url = e.target.value;
                      setEditedRelayList(newList);
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-100"
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
                    className="px-3 py-2 text-sm bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="">No marker</option>
                    <option value="r">Read</option>
                    <option value="w">Write</option>
                  </select>
                  <button
                    onClick={() => handleRemoveRelay(index)}
                    className="px-2 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-4">
              <input
                type="text"
                value={newRelayUrl}
                onChange={(e) => setNewRelayUrl(e.target.value)}
                placeholder="New relay URL"
                className="flex-1 px-3 py-2 text-sm bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-100"
              />
              <select
                value={newRelayMarker || ""}
                onChange={(e) =>
                  setNewRelayMarker(e.target.value as "r" | "w" | undefined)
                }
                className="px-3 py-2 text-sm bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 text-neutral-900 dark:text-neutral-100"
              >
                <option value="">No marker</option>
                <option value="r">Read</option>
                <option value="w">Write</option>
              </select>
              <button
                onClick={handleAddRelay}
                className="px-4 py-2 text-sm bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSaveRelays}
                className="px-4 py-2 text-sm bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancelRelays}
                className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
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
    </div>
  );
}
