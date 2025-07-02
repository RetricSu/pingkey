export interface Profile {
  name?: string;
  about?: string;
  picture?: string | null;
  nip05?: string;
  lud16?: string;
  website?: string;
}

export interface RelayListItem {
  url: string;
  marker?: "r" | "w";
  isConnected?: boolean;
  isChecking?: boolean;
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
