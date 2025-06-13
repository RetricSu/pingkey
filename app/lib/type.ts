export interface Profile {
  name?: string;
  about?: string;
  picture?: string;
  nip05?: string;
  lud16?: string;
  website?: string;
}

export interface RelayListItem {
  url: string;
  marker?: "r" | "w";
}

export interface UserInfoCache {
  pubkey: string;
  profile?: Profile;
  relayList?: RelayListItem[];
  encryptedPrivateKey: string;
  updatedAt: number;
}

export interface Recipient {
  publicKey: string;
  relayUrl?: string;
}

export interface ReplyTo {
  eventId: string;
  relayUrl?: string;
}
