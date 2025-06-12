"use client";

import { useState } from "react";

interface Profile {
  name: string;
  avatarUrl: string;
  introduction: string;
}

export default function SettingPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    name: "John Doe",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    introduction:
      "Hello! I'm a Nostr user who loves building decentralized applications. I'm passionate about creating tools that empower users and promote privacy. With a background in software development and a keen interest in blockchain technology, I'm always exploring new ways to contribute to the decentralized web ecosystem. I believe in the power of open protocols and user-centric design.",
  });

  const [editedProfile, setEditedProfile] = useState<Profile>(profile);

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

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
                value={editedProfile.avatarUrl}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    avatarUrl: e.target.value,
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
                value={editedProfile.introduction}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    introduction: e.target.value,
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
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-24 h-24 rounded-full border border-neutral-200 dark:border-neutral-800 object-cover mb-2"
                />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 text-center sm:text-left">
                  {profile.name}
                </h3>
              </div>
              <div className="flex-1 w-full flex flex-col justify-center">
                <p className="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {profile.introduction}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
