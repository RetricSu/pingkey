import { useState, useEffect, useCallback } from "react";
import { useNostr } from "../contexts/nostr";
import { DIDSDK } from "../lib/did-sdk";
import { Profile, RelayListItem } from "../lib/type";
import { defaultProfile } from "../lib/config";
import { ccc } from "@ckb-ccc/connector-react";

export interface SlugMiddlewareData {
  profile: Profile;
  relayList: RelayListItem[];
  isLoading: boolean;
  error: string | null;
  slugType: "pubkey" | "web5-did";
  refresh: () => Promise<void>;
}

export function useSlugMiddleware(slug: string): SlugMiddlewareData {
  const { nostr } = useNostr();
  const { signerInfo } = ccc.useCcc();

  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [relayList, setRelayList] = useState<RelayListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log("slug", slug);
  // Determine slug type
  const slugType: "pubkey" | "web5-did" = slug.startsWith("did:web5:") || slug.startsWith("did%3Aweb5%3A")
    ? "web5-did"
    : "pubkey";

  // Fetch data for Web5 DID
  const fetchWeb5DIDData = useCallback(async () => {
    if (!signerInfo || slugType !== "web5-did") {
	console.log("no signerInfo or slugType is not web5-did");
	return;
    }

    try {
      const sdk = new DIDSDK(signerInfo.signer);
      const identifier = 'did:web5:' + slug.substring(slug.length - 32, slug.length);
      console.log("identifier", identifier);
      const didCell = await sdk.getDIDLiveCell(identifier);

      console.log("didCell", didCell);

      if (!didCell) {
        throw new Error("DID not found");
      }

      const { didWeb5Data } = sdk.parseDIDCell(didCell);

      // Extract profile data from DID document
      const didProfile: Profile = {
        name: didWeb5Data.verificationMethods?.nostr
          ? `DID User`
          : defaultProfile.name,
        about: `Web5 DID: ${slug}`,
        picture: null,
        nip05: undefined,
        lud16: undefined,
        website: undefined,
      };

      // Extract relay list from DID document
      const didRelayList: RelayListItem[] = [];
      if (didWeb5Data.services?.nostr_relays?.endpoints) {
        const relayUrl = didWeb5Data.services.nostr_relays.endpoints;
        didRelayList.push({
          url: relayUrl,
        });
      }

      // If we have a Nostr public key in the DID, fetch additional profile data
      if (didWeb5Data.verificationMethods?.nostr && nostr) {
        try {
          const nostrProfile = await nostr.fetchProfile(
            didWeb5Data.verificationMethods.nostr
          );
          if (nostrProfile) {
            didProfile.name = nostrProfile.name || didProfile.name;
            didProfile.about = nostrProfile.about || didProfile.about;
            didProfile.picture = nostrProfile.picture || didProfile.picture;
            didProfile.nip05 = nostrProfile.nip05;
            didProfile.lud16 = nostrProfile.lud16;
            didProfile.website = nostrProfile.website;
          }
        } catch (err) {
          console.warn("Failed to fetch Nostr profile for DID:", err);
        }
      }

      setProfile(didProfile);
      setRelayList(didRelayList);
    } catch (err) {
      console.error("Error fetching Web5 DID data:", err);
      setError(`Failed to fetch DID data: ${(err as Error).message}`);
    }
  }, [slug, slugType, signerInfo, nostr]);

  // Fetch data for Nostr public key
  const fetchNostrData = useCallback(async () => {
    if (!nostr || slugType !== "pubkey") return;

    try {
      const [nostrProfile, relays] = await Promise.all([
        nostr.fetchProfile(slug),
        nostr.fetchNip65RelayList([slug]),
      ]);

      if (nostrProfile) {
        const freshProfile: Profile = {
          name: nostrProfile.name || defaultProfile.name,
          picture: nostrProfile.picture || null,
          about: nostrProfile.about || defaultProfile.about,
          nip05: nostrProfile.nip05,
          lud16: nostrProfile.lud16,
          website: nostrProfile.website,
        };
        setProfile(freshProfile);
      }

      setRelayList(relays || []);
    } catch (err) {
      console.error("Error fetching Nostr data:", err);
      setError(`Failed to fetch profile data: ${(err as Error).message}`);
    }
  }, [slug, slugType, nostr]);

  // Main fetch function
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log("fetchData", slugType);
    try {
      if (slugType === "web5-did") {
	await fetchWeb5DIDData();
      }
      else{
	await fetchNostrData();
      }
    } catch (err) {
      console.error("Error in fetchData:", err);
      setError(`Failed to fetch data: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [slugType, fetchWeb5DIDData, fetchNostrData]);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (slugType === "web5-did" && !signerInfo) {
      // For Web5 DID, we need a signer to interact with the blockchain
      setError("Wallet connection required to fetch Web5 DID data");
      return;
    }

    if (slugType === "pubkey" && !nostr) {
      // For Nostr pubkey, we need the nostr client
      setError("Nostr client not available");
      return;
    }

    fetchData();
  }, [fetchData, slugType, signerInfo, nostr]);

  return {
    profile,
    relayList,
    isLoading,
    error,
    slugType,
    refresh,
  };
}
