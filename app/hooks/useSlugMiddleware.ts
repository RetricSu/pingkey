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
  const { client, signerInfo } = ccc.useCcc();

  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [relayList, setRelayList] = useState<RelayListItem[]>(initialRelayList);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pubkey, setPubkey] = useState<string | null>(null);

  const slugType: SlugType = useMemo(() => getSlugType(slug), [slug]);

  const fetchWeb5DIDData = useCallback(async () => {
    if (!client || slugType !== "web5-did") {
      console.log("no signerInfo or slugType is not web5-did");
      return;
    }

    try {
      const sdk = new DIDSDK(client);
      // Use the slug as is if it's already a full Web5 DID, otherwise construct it
      const identifier = decodeURIComponent(slug);
      console.log("identifier", identifier);
      console.log("Fetching Web5 DID data for identifier:", identifier);

      const didCell = await sdk.getDIDLiveCell(identifier);

      if (!didCell) {
        console.log("DID cell not found for identifier:", identifier);
        throw new Error("DID not found");
      }

      console.log("Found DID cell, parsing data...");
      const { didWeb5Data } = sdk.parseDIDCell(didCell);
      console.log("Parsed DID document:", didWeb5Data);

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
        console.log("Found relay URL in DID document:", relayUrl);
        didRelayList.push({
          url: relayUrl,
        });
      } else {
        console.log(
          "No nostr_relays endpoints found in DID document:",
          didWeb5Data.services
        );
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
  }, [slug, slugType, client, nostr]);

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
    // Don't fetch data if slug is empty
    if (!slug.trim()) {
      setIsLoading(false);
      setError(null);
      setProfile(defaultProfile);
      setRelayList([]);
      setPubkey(null);
      return;
    }

    if (slugType === SlugType.Web5DID && !client) {
      setError("Wallet connection required to fetch Web5 DID data");
      return;
    }

    if (slugType === SlugType.Pubkey && !nostr) {
      setError("Nostr client not available");
      return;
    }

    fetchData();
  }, [fetchData, slugType, signerInfo, nostr, slug]);

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
