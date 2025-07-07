"use client";

import { useState } from "react";
import { nip19 } from "nostr-tools";
import QRCode from "react-qr-code";
import { Profile, RelayListItem } from "app/lib/type";
import { useNotification } from "../../contexts/notification";

interface ProfileActionsProps {
  slug: string;
  pubkey: string | null; // The actual Nostr public key
  profile: Profile;
  relayList: RelayListItem[];
  isOwnProfile?: boolean;
  onEditProfile?: () => void;
}

export function ProfileActions({
  slug,
  pubkey,
  profile,
  relayList,
  isOwnProfile,
  onEditProfile,
}: ProfileActionsProps) {
  const { success, error } = useNotification();
  const [showQR, setShowQR] = useState(false);

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/p/${slug}`;

    if (navigator.share && navigator.canShare?.({ url: profileUrl })) {
      try {
        await navigator.share({
          title: `${profile.name || slug}'s Profile`,
          text: `Check out ${profile.name || slug} on PingKey`,
          url: profileUrl,
        });
        success("Profile shared successfully!");
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          copyToClipboard(profileUrl, "Profile URL copied to clipboard!");
        }
      }
    } else {
      copyToClipboard(profileUrl, "Profile URL copied to clipboard!");
    }
  };

  const handleCopyNprofile = async () => {
    if (!pubkey) {
      error("No Nostr public key available");
      return;
    }
    try {
      const relayUrls = relayList.map((r) => r.url);
      const nprofile = nip19.nprofileEncode({
        pubkey: pubkey,
        relays: relayUrls.slice(0, 5), // Limit to 5 relays to avoid overly long URLs
      });
      copyToClipboard(nprofile, "Nostr profile identifier copied!");
    } catch (err) {
      error("Failed to generate nprofile");
    }
  };

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      success(successMessage);
    } catch (err) {
      error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="mt-8 mb-8">
      <div className="flex justify-start items-center gap-6">
        {/* Edit Profile Button - Only for own profile */}
        {isOwnProfile && onEditProfile && (
          <button
            onClick={onEditProfile}
            className="inline-flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Edit Profile"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
            </svg>
          </button>
        )}

        {/* QR Code Button */}
        <button
          onClick={() => setShowQR(!showQR)}
          className="inline-flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Show QR Code"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
        </button>

        {/* Share Profile Button */}
        <button
          onClick={handleShareProfile}
          className="inline-flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Share Profile"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
            />
          </svg>
        </button>

        {/* Copy Public Key Button */}
        <button
          onClick={() => pubkey ? copyToClipboard(pubkey, "Public key copied!") : copyToClipboard(slug, "Profile identifier copied!")}
          className="inline-flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title={pubkey ? "Copy Public Key" : "Copy Profile Identifier"}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        </button>

        {/* Copy Nprofile Button */}
        <button
          onClick={handleCopyNprofile}
          disabled={!pubkey}
          className="inline-flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={pubkey ? "Copy Nostr Profile ID" : "No Nostr public key available"}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>

      {/* QR Code Display */}
      {showQR && (
        <div className="flex justify-center mt-6">
          <div className="flex flex-col items-center space-y-3 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
            <div className="bg-white p-4 rounded-lg">
              <QRCode
                value={`${pubkey || slug}`}
                size={180}
                style={{
                  height: "auto",
                  maxWidth: "100%",
                  width: "100%",
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Scan to message {profile.name || slug}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {pubkey ? `Public Key: ${pubkey}` : `Profile: ${slug}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
