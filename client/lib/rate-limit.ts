// Per-user limits for anything that spends model credits. Tune here.
export const LIMITS = {
  generate: { max: 30, windowSec: 60 * 60 },     // playground comparisons per hour
  profileBuild: { max: 5, windowSec: 24 * 60 * 60 }, // profile builds per day
  signedUrl: { max: 5, windowSec: 24 * 60 * 60 },    // voice interviews per day
} as const;

export type LimitBucket = keyof typeof LIMITS;
