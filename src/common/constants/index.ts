export const USER_FIELDS = ['uid', 'username', 'displayName', 'avatar'];
export const IMAGE_FIELDS = ['name', 'url', 'contentType', 'size'];

export enum ChainType {
  // ETH = 'ethereum',
  SOL = 'solana',
  BASE = 'base',
  NIL = '',
}

export enum SubscriptionPlanType {
  TRIAL = 'trial',
  MONTHLY = 'monthly',
}

export enum EntryType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export enum EntryStatusType {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DELETED = 'deleted',
  SETTLED = 'settled',
  FINALIZED = 'finalized',
  CLAIMED = 'claimed',
}

export type SocialProfile = {
  url: string;
  username: string;
};

export type SocialProfiles = {
  twitter: SocialProfile;
  telegram: SocialProfile;
  discord: SocialProfile;
  website: SocialProfile;
};

export enum ConfigKey {
  SOL_MARKET_PRICE = 'SOL_MARKET_PRICE',
  SOL_TPS = 'SOL_TPS',
  USER_COUNT = 'USER_COUNT',
  API_VERSION = 'API_VERSION',
  FRONTEND_VERSION = 'FRONTEND_VERSION',
}

export const DEFAULT_USER_PROFILE_PIC = Array.from({ length: 7 }).map(
  (_, index) => `/assets/images/avatar${index}.png`,
);

export const RULES_GENERATE_TWEETS =
  '1. No hashtags\n 2. No blank fields \n 3. Tweet lengths: 2 tweets should have about 5 words, 5 tweets should have about 10-15 words, and 3 tweets should have >50 words';

// status of post tweet
export enum PostTweetStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  TOKEN_EXPIRED = 'token_expired',
  REFRESH_TOKEN_SUCCESS = 'refresh_token_success',
  REFRESH_TOKEN_FAILED = 'refresh_token_failed',
}
