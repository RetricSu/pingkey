import { Profile } from "./type";

export const metaData = {
  baseUrl: "https://nextfolio-template.vercel.app/",
  title: "ReachMe",
  name: "ReachMe",
  ogImage: "/opengraph-image.png",
  description:
    "A clean, fast, and lightweight portfolio template built with Next.js, Vercel, and Tailwind CSS for optimal performance.",
};

export const socialLinks = {
  twitter: "https://x.com/1tssirius",
  github: "https://github.com/1msirius/Nextfolio",
  instagram: "https://www.instagram.com/",
  linkedin: "https://www.linkedin.com/",
  email: "mailto:example@gmail.com",
};

export const defaultProfile: Profile = {
  name: "Anonymous",
  picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anonymous",
  about:
    "No profile set yet. Click 'Edit Profile' to set up your Nostr profile.",
};

export const defaultRelays: string[] = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.nostr.band",
  "wss://nostr.wine",
];

export const LocalStorageKeys = {
  userInfoCacheKey: "ReachMe.UserInfoCache",
};

export const USER_INFO_CACHE_EXPIRED_MS = 10 * 60 * 1000; // 10 minutes

export const POW_CONFIG = {
  default_difficulty: 16, // 2 bytes = 16 bits
  difficulty_mode_level: 16,
  main_thread_mining_timeout_ms: 30000,
  web_worker_mining_timeout_ms: 60000,
}