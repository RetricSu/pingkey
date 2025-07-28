export interface DIDDocument {
  verificationMethods: {
    nostr: string;
  };
  alsoKnownAs: string[];
  services: {
    nostr_relays: {
      type: "NostrRelays";
      endpoints: string;
    };
  };
}
