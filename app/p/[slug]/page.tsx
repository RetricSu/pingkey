"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useNostr } from "../../contexts/nostr";
import { useNotification } from "../../contexts/notification";
import { defaultProfile } from "app/lib/config";
import { Profile, RelayListItem } from "app/lib/type";
import { MessageSender } from "../../components/message-sender";
import { Loader } from "../../components/loader";
import { RichAbout } from "../../components/rich-about";
import { nip19 } from "nostr-tools";
import QRCode from "react-qr-code";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function DynamicPage({ params }: PageProps) {
  const { nostr } = useNostr();
  const { success, error } = useNotification();
  const [slug, setSlug] = useState<string>("");
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [relayList, setRelayList] = useState<RelayListItem[]>([]);
  const [showQR, setShowQR] = useState(false);

  // Resolve async params
  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);
    }
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!slug) return; // Don't run until slug is resolved

    async function fetchProfile() {
      if (!nostr) return;

      try {
        const nostrProfile = await nostr.fetchProfile(slug);
        if (nostrProfile) {
          setProfile({
            name: nostrProfile.name || defaultProfile.name,
            picture: nostrProfile.picture || defaultProfile.picture,
            about: nostrProfile.about || defaultProfile.about,
          });
        }
      } catch (err) {
        setProfileError("Failed to fetch profile");
        console.error("Error fetching profile:", err);
      } finally {
        setIsLoading(false);
      }
    }
    async function fetchRelayList() {
      if (!nostr) return;

      try {
        const relays = await nostr.fetchNip65RelayList([slug]);
        setRelayList(relays);
      } catch (err) {
        console.error("Error fetching relay list:", err);
      }
    }

    fetchProfile();
    fetchRelayList();
  }, [nostr, slug]);

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
    try {
      const relayUrls = relayList.map((r) => r.url);
      const nprofile = nip19.nprofileEncode({
        pubkey: slug,
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

  if (isLoading) {
    return <Loader message="Loading profile..." />;
  }

  if (profileError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm text-red-600 dark:text-red-400">
          {profileError}
        </div>
      </div>
    );
  }

  return (
    <div>
      <section>
        <Image
          src={profile.picture || defaultProfile.picture || ""}
          alt={profile.name || "Profile photo"}
          className="rounded-full bg-gray-100 block lg:mt-5 mt-0 lg:mb-5 mb-10 mx-auto sm:float-right sm:ml-5 sm:mb-5"
          unoptimized
          width={160}
          height={160}
          priority
        />
        <h1 className="mb-8 text-2xl font-medium capitalize md:text-left text-center">
          {profile.name || slug}
        </h1>
        <div className="prose prose-neutral dark:prose-invert whitespace-pre-wrap leading-relaxed">
          <RichAbout text={profile.about || ""} className="" />
        </div>

        {/* Action Buttons Section */}
        <div className="mt-8 mb-8">
          <div className="flex justify-start items-center gap-6">
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
              onClick={() => copyToClipboard(slug, "Public key copied!")}
              className="inline-flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Copy Public Key"
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
              className="inline-flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Copy Nostr Profile ID"
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
                    value={`${slug}`}
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
                    {window.location.origin}/p/{slug}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-16">
          <div className="mt-4 mb-6 pt-4">
            <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              {profile.name || slug}'s Relays
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400">
              {relayList.map((relay, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{relay.url}</span>
                </div>
              ))}
            </div>
          </div>
          <MessageSender
            slug={slug}
            profileName={profile.name}
            relayList={relayList}
          />
        </div>
      </section>
    </div>
  );
}
