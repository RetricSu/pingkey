import { useState, useEffect, useCallback, useMemo } from "react";
import { useNostr } from "../contexts/nostr";
import { DIDSDK } from "../lib/web5/did";
import { Profile, RelayListItem, SlugType } from "../lib/type";
import { defaultProfile } from "../lib/config";
import { ccc } from "@ckb-ccc/connector-react";
import { getSlugType } from "app/lib/util";

export interface SlugMiddlewareProps {
  slug: string;
  initialProfile: Profile;
  initialRelayList: RelayListItem[];
  hasServerData: boolean;
}

export interface SlugMiddlewareData {
  pubkey: string | null;
  profile: Profile;
  relayList: RelayListItem[];
  isLoading: boolean;
  error: string | null;
  slugType: SlugType;
  refresh: () => Promise<void>;
}

export function useSlugMiddleware({
  slug,
  initialProfile,
  initialRelayList,
  hasServerData,
}: SlugMiddlewareProps): SlugMiddlewareData {
  const { nostr } = useNostr();
  const { signerInfo } = ccc.useCcc();

  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [relayList, setRelayList] = useState<RelayListItem[]>(initialRelayList);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pubkey, setPubkey] = useState<string | null>(null);

  const slugType: SlugType = useMemo(() => getSlugType(slug), [slug]);

  const fetchWeb5DIDData = useCallback(async () => {
    if (!signerInfo || slugType !== "web5-did") {
      console.log("no signerInfo or slugType is not web5-did");
      return;
    }

    try {
      const sdk = new DIDSDK(signerInfo.signer);
      const identifier =
        "did:web5:" + slug.substring(slug.length - 32, slug.length);
      const didCell = await sdk.getDIDLiveCell(identifier);

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

      // Set the pubkey from DID verification methods
      const nostrPubkey = didWeb5Data.verificationMethods?.nostr || null;
      setPubkey(nostrPubkey);

      // If we have a Nostr public key in the DID, fetch additional profile data
      if (nostrPubkey && nostr) {
        try {
          const nostrProfile = await nostr.fetchProfile(nostrPubkey);
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

  const fetchNostrData = useCallback(async () => {
    if (!nostr || slugType !== "pubkey") return;

    try {
      const [nostrProfile, relays] = await Promise.all([
        nostr.fetchProfile(slug),
        nostr.fetchNip65RelayList([slug]),
      ]);

      // For pubkey type, the slug IS the pubkey
      setPubkey(slug);

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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (slugType === "web5-did") {
        await fetchWeb5DIDData();
      } else {
        await fetchNostrData();
      }
    } catch (err) {
      console.error("Error in fetchData:", err);
      setError(`Failed to fetch data: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [slugType, fetchWeb5DIDData, fetchNostrData]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (slugType === SlugType.Web5DID && !signerInfo) {
      setError("Wallet connection required to fetch Web5 DID data");
      return;
    }

    if (slugType === SlugType.Pubkey && !nostr) {
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
    pubkey,
    refresh,
  };
}
