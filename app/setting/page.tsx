"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/auth";
import { useNostr } from "../contexts/nostr";
import { Profile } from "app/lib/type";
import { defaultProfile } from "app/lib/config";

export default function SettingPage() {
  const { pubkey } = useAuth();
  const { nostr } = useNostr();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [editedProfile, setEditedProfile] = useState<Profile>(profile);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!nostr || !pubkey) return;

      try {
        const nostrProfile = await nostr.fetchProfile(pubkey);
        if (nostrProfile) {
          setProfile({
            name: nostrProfile.name || defaultProfile.name,
            picture: nostrProfile.picture || defaultProfile.picture,
            about: nostrProfile.about || defaultProfile.about,
          });
          setEditedProfile({
            name: nostrProfile.name || defaultProfile.name,
            picture: nostrProfile.picture || defaultProfile.picture,
            about: nostrProfile.about || defaultProfile.about,
          });
        }
      } catch (err) {
        setError("Failed to fetch profile");
        console.error("Error fetching profile:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [nostr, pubkey]);

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
        setProfile(editedProfile);
        setIsEditing(false);
      } else {
        setError("Failed to update profile");
      }
    } catch (err) {
      setError("Failed to update profile");
      console.error("Error updating profile:", err);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neutral-200 dark:border-neutral-800 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin"></div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
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
                  src={profile.picture}
                  alt={profile.name}
                  className="w-24 h-24 rounded-full border border-neutral-200 dark:border-neutral-800 object-cover mb-2"
                />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 text-center sm:text-left">
                  {profile.name}
                </h3>
              </div>
              <div className="flex-1 w-full flex flex-col justify-center">
                <p className="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {profile.about}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
