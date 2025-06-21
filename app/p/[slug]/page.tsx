"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useNostr } from "../../contexts/nostr";
import { useAuth } from "../../contexts/auth";
import { defaultProfile } from "app/lib/config";
import { Profile, RelayListItem } from "app/lib/type";
import { MessageSender } from "../../components/message-sender";
import { Loader } from "../../components/loader";
import { RichAbout } from "../../components/profile/rich-about";
import { ProfileActions } from "../../components/profile/profile-actions";
import { RelayList } from "../../components/profile/relay-list";
import { custom } from "../../components/dialog";
import { SettingsModal } from "../../components/profile/settings-modal";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function DynamicPage({ params }: PageProps) {
  const { nostr } = useNostr();
  const { isSignedIn, pubkey } = useAuth();
  const [slug, setSlug] = useState<string>("");
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [relayList, setRelayList] = useState<RelayListItem[]>([]);

  // Check if this is the current user's own profile
  const isOwnProfile = isSignedIn && pubkey === slug;

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

  const handleOpenSettingsModal = async () => {
    if (!nostr || !pubkey) return;

    const handleSave = async (
      updatedProfile: Profile,
      updatedRelayList: RelayListItem[]
    ) => {
      // Save profile
      const result = await nostr.publishProfile(updatedProfile);
      if (!result) {
        throw new Error("Failed to update profile");
      }

      // Save relay list
      const relayResult = await nostr.publishNip65RelayListEvent(
        updatedRelayList
      );
      if (!relayResult) {
        throw new Error("Failed to update relay list");
      }

      // Update local state
      setProfile(updatedProfile);
      setRelayList(updatedRelayList);
    };

    try {
      await custom(
        (props) => (
          <SettingsModal
            {...props}
            profile={profile}
            relayList={relayList}
            onSave={handleSave}
          />
        ),
        {
          maxWidth: "2xl",
          closeOnBackdrop: false,
        }
      );
    } catch (error) {
      // User closed the modal, no action needed
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
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
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
          </div>

          {/* Edit button for own profile */}
          {isOwnProfile && (
            <button
              onClick={handleOpenSettingsModal}
              className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg transition-colors"
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
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
              </svg>
              Edit Profile
            </button>
          )}
        </div>

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
