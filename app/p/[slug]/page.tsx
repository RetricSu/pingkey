import { getCachedNostrProfile, getCachedRelayList } from "../../lib/nostr-server";
import { defaultProfile } from "app/lib/config";
import { Profile, RelayListItem } from "app/lib/type";
import { ClientProfile } from "./client-profile";
import { Suspense } from "react";
import { Loader } from "../../components/loader";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// This is now a Server Component that pre-fetches data
export default async function ProfilePage({ params }: PageProps) {
  const { slug } = await params;

  // Pre-fetch data server-side for better initial load
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
    initialRelayList.status === "fulfilled" 
      ? initialRelayList.value 
      : [];

  const hasServerData = initialProfile.status === "fulfilled" && initialProfile.value !== null;

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

// Generate static params for known profiles if needed
export async function generateStaticParams() {
  // You could pre-generate for known popular profiles
  // For now, we'll let them be generated on-demand
  return [];
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 300; // Revalidate every 5 minutes
