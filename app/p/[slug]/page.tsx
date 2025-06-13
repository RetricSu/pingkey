"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "../../contexts/auth";
import { useNostr } from "../../contexts/nostr";
import { generateSecretKey } from "nostr-tools/pure";
import { hexToBytes } from "@noble/hashes/utils";
import { wrapEvent } from "nostr-tools/nip17";
import { defaultProfile } from "app/lib/config";
import { Profile, RelayListItem } from "app/lib/type";

interface PageProps {
  params: {
    slug: string;
  };
}

export default function DynamicPage({ params }: PageProps) {
  const { isSignedIn, pubkey, exportPrivateKey } = useAuth();
  const { nostr } = useNostr();
  const { slug } = params;
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [relayList, setRelayList] = useState<RelayListItem[]>([]);

  useEffect(() => {
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
        setError("Failed to fetch profile");
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

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    setSendError(null);

    try {
      let senderPrivkey: Uint8Array | null = null;

      // If not signed in, generate a temporary key pair
      if (!isSignedIn) {
        senderPrivkey = generateSecretKey();
      } else {
        const password = prompt(
          "Please enter your password to send the message"
        );
        if (!password) {
          throw new Error("Password required to send message");
        }
        senderPrivkey = hexToBytes(await exportPrivateKey(password));
      }

      const recipient = {
        publicKey: slug,
      };
      const signedEvent = wrapEvent(senderPrivkey, recipient, message);

      if (!nostr) {
        throw new Error("Nostr not initialized");
      }
      await nostr.publishEventToRelays(
        signedEvent,
        relayList.map((relay) => relay.url)
      );

      setMessage("");
      alert("Message sent successfully!");
    } catch (err) {
      console.error("Failed to send message:", err);
      setSendError(
        err instanceof Error ? err.message : "Failed to send message"
      );
    } finally {
      setIsSending(false);
    }
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
    <div>
      <section>
        <Image
          src={profile.picture || defaultProfile.picture || ""}
          alt={profile.name || "Profile photo"}
          className="rounded-full bg-gray-100 block lg:mt-5 mt-0 lg:mb-5 mb-10 mx-auto sm:float-right sm:ml-5 sm:mb-5 grayscale hover:grayscale-0"
          unoptimized
          width={160}
          height={160}
          priority
        />
        <h1 className="mb-8 text-2xl font-medium capitalize">
          {profile.name || slug}
        </h1>
        <div className="prose prose-neutral dark:prose-invert">
          <p>{profile.about}</p>
        </div>

        <div className="mt-8  pt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Feel free to reach me by leaving a letter to my relays.</p>
          <p>A minimal stamp forged from Proof of Work(POW) is required.</p>
        </div>

        <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-8">
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
          <div className="space-y-4">
            {sendError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
                {sendError}
              </div>
            )}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              className="w-full h-32 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              rows={6}
            />

            <div className="flex justify-between items-center">
              <button
                onClick={handleSendMessage}
                disabled={isSending || !message.trim()}
                className="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? "Sending..." : "Send Letter"}
              </button>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                {isSignedIn
                  ? "Signed in as " +
                    pubkey?.slice(0, 6) +
                    "..." +
                    pubkey?.slice(-4)
                  : "Sending as anonymous"}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
