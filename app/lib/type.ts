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
