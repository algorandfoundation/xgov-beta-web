import { format } from "date-fns";
import { ACTIVE_PERIOD_BLOCKS } from "@/api/committee";

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

// Committees are consecutive, so the index can lay all of them on a single
// round axis: each committee counts blocks over [periodStart, periodEnd) and
// then votes over [periodEnd, periodEnd + 1M). Adjacent committees share two
// thirds of their production window, which is what the axis is there to show.
export interface CommitteeAxisTick {
  round: number;
  label: string;
}

export interface CommitteeAxis {
  // First and last round on the axis — the earliest counted block and the end
  // of the newest committee's voting period.
  min: number;
  max: number;
  // One tick per million rounds, labelled at its left edge.
  ticks: CommitteeAxisTick[];
  label: string;
}

export function buildCommitteeAxis(
  periods: { periodStart: number | null; periodEnd: number | null }[],
): CommitteeAxis | null {
  const isRound = (value: number | null): value is number => value !== null;

  const starts = periods.map((period) => period.periodStart).filter(isRound);
  const ends = periods.map((period) => period.periodEnd).filter(isRound);
  if (starts.length === 0 || ends.length === 0) return null;

  const min = Math.min(...starts);
  const max = Math.max(...ends) + ACTIVE_PERIOD_BLOCKS;
  if (max <= min) return null;

  const ticks: CommitteeAxisTick[] = [];
  for (let round = min; round < max; round += ACTIVE_PERIOD_BLOCKS) {
    ticks.push({ round, label: abbreviateRound(round) });
  }

  return {
    min,
    max,
    ticks,
    label: `${abbreviateRound(min)} – ${abbreviateRound(max)}`,
  };
}

// A round range as CSS offsets into the axis track. Clamped, so a committee file
// with an out-of-range period cannot push a bar outside its track.
export function axisSpan(
  axis: CommitteeAxis,
  from: number,
  to: number,
): { left: string; width: string } {
  const ratio = (round: number) =>
    Math.min(1, Math.max(0, (round - axis.min) / (axis.max - axis.min)));

  const left = ratio(from);
  const width = Math.max(0, ratio(to) - left);

  return {
    left: `${(left * 100).toFixed(3)}%`,
    width: `${(width * 100).toFixed(3)}%`,
  };
}

export function truncateCommitteeId(id: string): string {
  return id.length > 14 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

export function sharePercent(votes: number, totalVotes: number): string {
  return totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : "0.0";
}
