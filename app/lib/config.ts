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
  pingkey: "https://pingkey.xyz/p/87b915fff950d6683f449edb8d283c04ac789c506daf49dbdbd97b344e5db383",
};

export const defaultProfile: Profile = {
  name: "Anonymous",
  picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anonymous",
  about:
    "No profile set yet. Click 'Edit Profile' to set up your Nostr profile.",
};

export const defaultRelays: string[] = [
  "wss://relay.pingkey.xyz",
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.nostr.band",
  "wss://purplepages.org",
];

export const LocalStorageKeys = {
  userInfoCacheKey: "PingKey.UserInfoCache",
  customDefaultRelaysKey: "PingKey.CustomDefaultRelays",
};

export const USER_INFO_CACHE_EXPIRED_MS = 10 * 60 * 1000; // 10 minutes

export const POW_CONFIG = {
  default_difficulty: 16, // 2 bytes = 16 bits
  difficulty_mode_level: 8,
  main_thread_mining_timeout_ms: 30000,
  web_worker_mining_timeout_ms: 60000,
}

/**
 * Get the effective default relays (custom from localStorage or built-in defaults)
 */
export function getEffectiveDefaultRelays(): string[] {
  // Always return built-in defaults during SSR or when window is not available
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return defaultRelays;
  }
  
  try {
    const customRelays = localStorage.getItem(LocalStorageKeys.customDefaultRelaysKey);
    if (customRelays) {
      const parsed = JSON.parse(customRelays);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(relay => typeof relay === 'string')) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Error reading custom default relays from localStorage:", error);
  }
  
  return defaultRelays;
}
