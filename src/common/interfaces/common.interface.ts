export interface Twitter {
  id: string;
  name: string; // displayName
  username: string;
  image: string;
  description?: string;
  biography?: string;
  avatar?: string;
  banner?: string;
  verified?: boolean;
  followersCount?: number;
  followingCount?: number;
  friendsCount?: number;
  mediaCount?: number;
  // isPrivate?: boolean;
  // isVerified?: boolean;
  likesCount?: number;
  listedCount?: number;
  location?: string;
  tweetsCount?: number;
  url?: string;
  // isBlueVerified?: boolean;
  joined?: Date;
}

export interface Character {
  name: string;
  intro?: string;
  bio?: string;
  lore?: string;
  knowledge?: string;
  topics?: string;
  style?: string;
  chat?: string;
  posts?: string;
  adjectives?: string;
  language?: string; // en | cn
  rules?: string;
  withHashTags?: boolean;
}
