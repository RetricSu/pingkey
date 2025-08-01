import {
  getCachedNostrProfile,
  getCachedRelayList,
} from "../../lib/nostr/nostr-server";
import { defaultProfile } from "app/lib/config";
import { Profile, RelayListItem, SlugType } from "app/lib/type";
import { ClientProfile } from "../../components/profile/client-profile";
import { Suspense } from "react";
import { Loader } from "../../components/gadget/loader";
import { getSlugType } from "app/lib/util";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Server Component that pre-fetches data
export default async function ProfilePage({ params }: PageProps) {
  const { slug } = await params;

  const slugType = getSlugType(slug);
  if (slugType === SlugType.Web5DID) {
    return (
      <div>
        <Suspense fallback={<Loader message="Loading profile..." />}>
          <ClientProfile
            slug={slug}
            initialProfile={defaultProfile}
            initialRelayList={[]}
            hasServerData={false}
          />
        </Suspense>
      </div>
    );
  }

  const [initialProfile, initialRelayList] = await Promise.allSettled([
    getCachedNostrProfile(slug),
    getCachedRelayList([slug]),
  ]);

  const serverProfile: Profile =
    initialProfile.status === "fulfilled" && initialProfile.value
      ? {
          name: initialProfile.value.name || defaultProfile.name,
          picture: initialProfile.value.picture || null,
          about: initialProfile.value.about || defaultProfile.about,
          nip05: initialProfile.value.nip05,
          lud16: initialProfile.value.lud16,
          website: initialProfile.value.website,
        }
      : defaultProfile;

  const serverRelayList: RelayListItem[] =
    initialRelayList.status === "fulfilled" ? initialRelayList.value : [];

  const hasServerData =
    initialProfile.status === "fulfilled" && initialProfile.value !== null;

  return (
    <div>
      <Suspense fallback={<Loader message="Loading profile..." />}>
        <ClientProfile
          slug={slug}
          initialProfile={serverProfile}
          initialRelayList={serverRelayList}
          hasServerData={hasServerData}
        />
      </Suspense>
    </div>
  );
}

// Generate static params for known popular profiles if needed
export async function generateStaticParams() {
  return [];
}

export const revalidate = 300; // Enable ISR (Incremental Static Regeneration), Revalidate every 5 minutes
