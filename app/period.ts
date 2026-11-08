/**
 * period.ts — small helpers for the workspace's selected month/year.
 *
 * A "period" is just { month: 0-11, year }. Kept framework-free so it can be
 * used by both the store layer and React components.
 */

export interface Period {
  /** 0 = January … 11 = December */
  month: number;
  year: number;
}

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** The current local month/year. */
export function currentPeriod(): Period {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
}

/** "November 2026" */
export function formatPeriodLong(p: Period): string {
  return `${MONTHS[p.month]} ${p.year}`;
}

/** "Nov 2026" */
export function formatPeriodShort(p: Period): string {
  return `${SHORT_MONTHS[p.month]} ${p.year}`;
}
