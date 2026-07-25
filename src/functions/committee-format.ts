import { format } from "date-fns";

// Governance-period bounds are multiples of 1,000,000 rounds, e.g. 52M.
export function abbreviateRound(round: number): string {
  const millions = round / 1_000_000;
  return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`;
}

export function formatRoundsRange(start?: number, end?: number): string | null {
  if (start === undefined || end === undefined) return null;
  return `${abbreviateRound(start)} – ${abbreviateRound(end)}`;
}

// "Jan 19 – Apr 20, 2025" within a year; "Oct 17, 2025 – Jan 15, 2026" across one.
export function formatDateRange(
  start: Date | null,
  end: Date | null,
): string | null {
  if (!start && !end) return null;
  if (start && end) {
    return start.getFullYear() === end.getFullYear()
      ? `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`
      : `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
  }
  return format((start ?? end) as Date, "MMM d, yyyy");
}

export function truncateCommitteeId(id: string): string {
  return id.length > 14 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

export function sharePercent(votes: number, totalVotes: number): string {
  return totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : "0.0";
}
