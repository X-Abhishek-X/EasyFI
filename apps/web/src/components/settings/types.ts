export type InviteCode = {
  code: string;
  /** Display name of who redeemed it, null if unused. */
  redeemedBy: string | null;
  createdAt: string;
};

export type ShareLink = {
  id: string;
  portfolioName: string;
  url: string;
  createdAt: string;
  expiresAt: string | null;
  views: number;
};

export type AlertPref = { key: string; label: string; description: string; enabled: boolean };

export type Goal = {
  id: string;
  label: string;
  /** Target in USD. */
  target: number;
  /** Current progress in USD; null if unknown. */
  current: number | null;
  targetDate: string | null;
};
