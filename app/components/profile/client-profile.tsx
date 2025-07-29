"use client";

import { useState, useEffect } from "react";
import { useNostr } from "../../contexts/nostr";
import { useAuth } from "../../contexts/auth";
import { Profile, RelayListItem } from "app/lib/type";
import { MessageSender } from "./message-sender";
import { RichAbout } from "./rich-about";
import { ProfileActions } from "./profile-actions";
import { RelayList } from "./relay-list";
import { custom } from "../gadget/dialog";
import { SettingsModal } from "./settings-modal";
import { useNotification } from "app/contexts/notification";
import { Avatar } from "./avatar";
import { useSlugMiddleware } from "../../hooks/useSlugMiddleware";

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
  hasServerData,
}: ClientProfileProps) {
  const { nostr } = useNostr();
  const { isSignedIn, pubkey } = useAuth();
  const { success } = useNotification();

  const {
    profile: middlewareProfile,
    relayList: middlewareRelayList,
    isLoading: middlewareLoading,
    error: middlewareError,
    slugType,
    pubkey: middlewarePubkey,
  } = useSlugMiddleware({
    slug,
    initialProfile,
    initialRelayList,
    hasServerData,
  });

  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [relayList, setRelayList] = useState<RelayListItem[]>(initialRelayList);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingFresh, setIsFetchingFresh] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Check if this is the current user's own profile
  const isOwnProfile =
    isSignedIn && pubkey === middlewarePubkey && middlewarePubkey !== null;

  // Update local state when middleware data changes
  useEffect(() => {
    if (middlewareError) {
      setProfileError(middlewareError);
      return;
    }

    // For Web5 DID, use middleware data directly
    if (slugType === "web5-did") {
      setProfile(middlewareProfile);
      setRelayList(middlewareRelayList);
      setProfileError(null);
      return;
    }

    // For pubkey, prefer server data initially but update with fresh client data
    if (slugType === "pubkey") {
      // Only update if we have fresh data from middleware that's different
      if (
        middlewareProfile &&
        JSON.stringify(middlewareProfile) !== JSON.stringify(profile)
      ) {
        console.log("🔄 Updated profile with fresh data from middleware");
        setProfile(middlewareProfile);
      }

      if (
        middlewareRelayList &&
        JSON.stringify(middlewareRelayList) !== JSON.stringify(relayList)
      ) {
        console.log("🔄 Updated relay list with fresh data from middleware");
        setRelayList(middlewareRelayList);
      }

      setProfileError(null);
    }
  }, [
    middlewareProfile,
    middlewareRelayList,
    middlewareError,
    slugType,
    profile,
    relayList,
  ]);

  // Handle loading states
  useEffect(() => {
    if (slugType === "web5-did") {
      setIsRefreshing(middlewareLoading);
    } else {
      // For pubkey, show subtle loading indicator when fetching fresh data
      setIsFetchingFresh(middlewareLoading && hasServerData);
      setIsRefreshing(middlewareLoading && !hasServerData);
    }
  }, [middlewareLoading, slugType, hasServerData]);

  const handleOpenSettingsModal = async () => {
    // Only allow profile editing for pubkey type profiles
    if (slugType !== "pubkey" || !nostr || !pubkey) return;

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
            publicKey={middlewarePubkey || slug}
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
            {slugType === "web5-did"
              ? "Loading DID data..."
              : "Refreshing profile data..."}
          </div>
        </div>
      )}

      {/* Subtle indicator when fetching fresh data in background */}
      {isFetchingFresh && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 shadow-lg">
          <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
            <div className="animate-pulse rounded-full h-2 w-2 bg-green-500" />
            Checking for updates...
          </div>
        </div>
      )}

      <div className="mb-8">
        <Avatar
          publicKey={middlewarePubkey || slug}
          pictureUrl={profile.picture}
          alt={profile.name || "Profile photo"}
          size={160}
          className="bg-gray-100 block lg:mt-5 mt-0 lg:mb-5 mb-10 mx-auto sm:float-right sm:ml-5 sm:mb-5"
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
        slugType={slugType}
        pubkey={middlewarePubkey}
        profile={profile}
        relayList={relayList}
        isOwnProfile={isOwnProfile}
        onEditProfile={
          slugType === "pubkey" ? handleOpenSettingsModal : undefined
        }
      />

      <div className="mt-16">
        <RelayList
          relayList={relayList}
          title={`${profile.name || slug}'s Relays`}
          enableConnectivityCheck={true}
          checkOnMount={true}
        />
        <MessageSender
          slug={middlewarePubkey || slug}
          profileName={profile.name}
          relayList={relayList}
        />
      </div>
    </section>
  );
}
