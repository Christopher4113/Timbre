import { diffChars } from "diff";

/** Characters inserted plus characters removed to turn `from` into `to`. */
export function editDistance(from: string, to: string): number {
  return diffChars(from, to).reduce((n, part) => n + (part.added || part.removed ? part.value.length : 0), 0);
}

type Picked = { picked: "baseline" | "profile" | null; sendAsIs: boolean | null };

/** Share of decided comparisons where the profile output won. */
export function winRate(rows: Picked[]): number | null {
  const decided = rows.filter((r) => r.picked);
  return decided.length ? decided.filter((r) => r.picked === "profile").length / decided.length : null;
}

/** Share of picked outputs the user would send without changes. */
export function sendAsIsRate(rows: Picked[]): number | null {
  const answered = rows.filter((r) => r.picked && r.sendAsIs !== null);
  return answered.length ? answered.filter((r) => r.sendAsIs).length / answered.length : null;
}
