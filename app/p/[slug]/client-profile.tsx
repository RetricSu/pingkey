"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useNostr } from "../../contexts/nostr";
import { useAuth } from "../../contexts/auth";
import { defaultProfile } from "app/lib/config";
import { Profile, RelayListItem } from "app/lib/type";
import { MessageSender } from "../../components/profile/message-sender";
import { RichAbout } from "../../components/profile/rich-about";
import { ProfileActions } from "../../components/profile/profile-actions";
import { RelayList } from "../../components/profile/relay-list";
import { custom } from "../../components/dialog";
import { SettingsModal } from "../../components/profile/settings-modal";
import { useNotification } from "app/contexts/notification";

interface ClientProfileProps {
  slug: string;
  initialProfile: Profile;
  initialRelayList: RelayListItem[];
  hasServerData: boolean;
}

export function ClientProfile({ 
  slug, 
  initialProfile, 
  initialRelayList, 
  hasServerData 
}: ClientProfileProps) {
  const { nostr } = useNostr();
  const { isSignedIn, pubkey } = useAuth();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [relayList, setRelayList] = useState<RelayListItem[]>(initialRelayList);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const { success } = useNotification();

  // Check if this is the current user's own profile
  const isOwnProfile = isSignedIn && pubkey === slug;

  // Refresh data from client if server data is stale or missing
  useEffect(() => {
    if (!nostr || hasServerData) return;

    async function refreshData() {
      setIsRefreshing(true);
      try {
        const [nostrProfile, relays] = await Promise.all([
          nostr?.fetchProfile(slug),
          nostr?.fetchNip65RelayList([slug])
        ]);

        if (nostrProfile) {
          setProfile({
            name: nostrProfile.name || defaultProfile.name,
            picture: nostrProfile.picture || defaultProfile.picture,
            about: nostrProfile.about || defaultProfile.about,
            nip05: nostrProfile.nip05,
            lud16: nostrProfile.lud16,
            website: nostrProfile.website,
          });
        }
        
        setRelayList(relays || []);
      } catch (err) {
        setProfileError("Failed to fetch profile");
        console.error("Error fetching profile:", err);
      } finally {
        setIsRefreshing(false);
      }
    }

    refreshData();
  }, [nostr, slug, hasServerData]);

  const handleOpenSettingsModal = async () => {
    if (!nostr || !pubkey) return;

    const handleSaveProfile = async (updatedProfile: Profile) => {
      const result = await nostr.publishProfile(updatedProfile);
      if (!result) {
        throw new Error("Failed to update profile");
      }
      success("Profile updated successfully");
      setProfile(updatedProfile);
    };

    const handleSaveRelays = async (updatedRelayList: RelayListItem[]) => {
      const result = await nostr.publishNip65RelayListEvent(updatedRelayList);
      if (!result) {
        throw new Error("Failed to update relay list");
      }
      success("Relays updated successfully");
      setRelayList(updatedRelayList);
    };

    try {
      await custom(
        (props) => (
          <SettingsModal
            {...props}
            profile={profile}
            relayList={relayList}
            onSaveProfile={handleSaveProfile}
            onSaveRelays={handleSaveRelays}
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
    <section>
      {/* Show refresh indicator if data is being refreshed */}
      {isRefreshing && (
        <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 dark:border-blue-400" />
            Refreshing profile data...
          </div>
        </div>
      )}

      <div className="mb-8">
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

      <div className="prose prose-neutral dark:prose-invert whitespace-pre-wrap leading-relaxed">
        <RichAbout text={profile.about || ""} className="" />
      </div>

      <ProfileActions
        slug={slug}
        profile={profile}
        relayList={relayList}
        isOwnProfile={isOwnProfile}
        onEditProfile={handleOpenSettingsModal}
      />

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
  );
} 
