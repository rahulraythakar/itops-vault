// Shared threshold for the "documentation freshness" feature — the
// competitive differentiator against IT Glue/Hudu's stale-docs problem.
// A doc is "stale" if it's never been reviewed, or wasn't reviewed in the
// last 90 days.
const STALE_DAYS = 90;

export function isStale(lastReviewedAt: string | Date | null): boolean {
  if (!lastReviewedAt) return true;
  const reviewedDate = new Date(lastReviewedAt);
  const daysSince = (Date.now() - reviewedDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > STALE_DAYS;
}
