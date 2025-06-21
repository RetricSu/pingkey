"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useNostr } from "../../contexts/nostr";
import { defaultProfile } from "app/lib/config";
import { Profile, RelayListItem } from "app/lib/type";
import { MessageSender } from "../../components/message-sender";
import { Loader } from "../../components/loader";
import { RichAbout } from "../../components/profile/rich-about";
import { ProfileActions } from "../../components/profile/profile-actions";
import { RelayList } from "../../components/relay-list";

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

        <ProfileActions slug={slug} profile={profile} relayList={relayList} />

        <div className="mt-16">
          <RelayList 
            relayList={relayList} 
            title={`${profile.name || slug}'s Relays`} 
          />
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
