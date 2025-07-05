import { Profile } from "./type";

export const metaData = {
  baseUrl: "https://pingkey.xyz/",
  title: "PingKey",
  name: "PingKey",
  ogImage: "/opengraph-image.png",
  description:
    "PingKey — Not a chat. Just a worry-free way to let people reach you.",
};

export const socialLinks = {
  github: "https://github.com/retricsu/pingkey",
  pingkey:
    "https://pingkey.xyz/p/87b915fff950d6683f449edb8d283c04ac789c506daf49dbdbd97b344e5db383",
};

export const defaultProfile: Profile = {
  name: "Anonymous",
  picture: null, // Uses identicon generated from public key instead of external URLs
  about: "No profile set yet.",
};

export const DEFAULT_BIG_RELAY_URLS: string[] = [
  "wss://relay.pingkey.xyz",
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.nostr.band",
  "wss://nostr.mom",
  "wss://purplepages.org",
];

export const LocalStorageKeys = {
  userInfoCacheKey: "PingKey.UserInfoCache",
  customDefaultRelaysKey: "PingKey.CustomDefaultRelays",
  decryptedLettersKey: "PingKey.DecryptedLetters",
  powThresholdKey: "PingKey.PowThreshold",
};

export const USER_INFO_CACHE_EXPIRED_MS = 10 * 60 * 1000; // 10 minutes

export const POW_CONFIG = {
  default_difficulty: 16, // 2 bytes = 16 bits
  difficulty_mode_level: 8,
  main_thread_mining_timeout_ms: 30000,
  web_worker_mining_timeout_ms: 60000,
};

export const DID_SCRIPT = {
  testnet: {
    code_hash:
      "0x510150477b10d6ab551a509b71265f3164e9fd4137fcb5a4322f49f03092c7c5",
    hash_type: "type",
    cellDeps: [
      {
        cellDep: {
          outPoint: {
            txHash:
              "0x1ecbf88d692a14d7cbc0bfd1a3d5019e4b613247ae438bad52f94148c6009559",
            index: 0,
          },
          depType: "code",
        },
      },
    ],
  },
};
