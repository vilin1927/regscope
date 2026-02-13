import type { MatchedRegulation } from "./types";

export function calculateComplianceScore(
  matched: MatchedRegulation[]
): number {
  if (matched.length === 0) return 0;
  const fulfilled = matched.filter((r) => r.status === "erfuellt").length;
  return Math.round((fulfilled / matched.length) * 100);
}
