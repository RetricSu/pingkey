"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useNostr } from "../../contexts/nostr";
import { defaultProfile } from "app/lib/config";
import { Profile, RelayListItem } from "app/lib/type";
import { MessageSender } from "../../components/message-sender";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function DynamicPage({ params }: PageProps) {
  const { nostr } = useNostr();
  const [slug, setSlug] = useState<string>("");
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [relayList, setRelayList] = useState<RelayListItem[]>([]);

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

        <div className="mt-1 border-t border-gray-100 dark:border-gray-800">
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
