import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import { cn, sharePercent } from "@/functions";
import { UserPill } from "@/components/UserPill/UserPill";

export interface CommitteeMemberRow {
  address: string;
  votes: number;
}

export interface CommitteeMembersProps {
  members: CommitteeMemberRow[];
  totalVotes: number;
  className?: string;
}

type SortKey = "votes" | "least" | "addr";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "votes", label: "Most votes" },
  { key: "least", label: "Fewest" },
  { key: "addr", label: "A→Z" },
];

// A committee runs to a few hundred members; showing them all at once buries the
// search box, so the ledger opens on its head and expands on request.
const INITIAL_ROWS = 25;

function sortMembers(members: CommitteeMemberRow[], sort: SortKey) {
  const sorted = members.slice();
  if (sort === "addr") {
    return sorted.sort((a, b) => a.address.localeCompare(b.address));
  }
  if (sort === "least") return sorted.sort((a, b) => a.votes - b.votes);
  return sorted.sort((a, b) => b.votes - a.votes);
}

/**
 * The committee roll: every address and the voting power it earned by proposing
 * blocks, searchable by address and sortable.
 */
export function CommitteeMembers({
  members,
  totalVotes,
  className,
}: CommitteeMembersProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("votes");
  const [expanded, setExpanded] = useState(false);

  // Bar widths are relative to the largest holding, so the long tail stays
  // readable instead of collapsing into a hairline.
  const topVotes = useMemo(
    () => members.reduce((max, m) => Math.max(max, m.votes), 0),
    [members],
  );

  const matches = useMemo(() => {
    const needle = query.trim().toUpperCase();
    const filtered = needle
      ? members.filter((m) => m.address.includes(needle))
      : members;
    return sortMembers(filtered, sort);
  }, [members, query, sort]);

  const visible = expanded ? matches : matches.slice(0, INITIAL_ROWS);
  const hidden = matches.length - visible.length;

  const barWidth = (votes: number) =>
    `${topVotes > 0 ? Math.max(1.5, (votes / topVotes) * 100).toFixed(1) : 0}%`;

  return (
    <section
      className={cn(
        "rounded-2xl border border-black/[0.08] bg-white p-5 md:p-8 dark:border-white/10 dark:bg-algo-black-90",
        className,
      )}
    >
      <div className="mb-4 flex flex-col gap-4 md:mb-5 md:flex-row md:items-end md:justify-between md:gap-6">
        <div>
          <h2 className="text-xl font-bold text-algo-black md:text-[22px] dark:text-white">
            Members{" "}
            <span className="font-normal text-algo-black-50 dark:text-gray-500">
              ({members.length.toLocaleString()})
            </span>
          </h2>
          <div className="mt-1 text-sm tabular-nums text-algo-black-70 md:text-[15px] dark:text-gray-400">
            Showing {matches.length.toLocaleString()} of{" "}
            {members.length.toLocaleString()} · {totalVotes.toLocaleString()}{" "}
            votes total
          </div>
        </div>

        <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:gap-2.5">
          <label className="flex items-center gap-2.5 rounded-[10px] border border-black/[0.14] bg-algo-blue-10/40 px-3 py-2.5 md:w-[300px] dark:border-white/10 dark:bg-white/5">
            <SearchIcon
              className="size-[15px] shrink-0 text-algo-black-40 dark:text-gray-500"
              strokeWidth={2}
            />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search address"
              aria-label="Search committee members by address"
              className="w-full min-w-0 flex-1 border-none bg-transparent font-mono text-[13px] text-algo-black outline-none placeholder:text-algo-black-40 dark:text-white dark:placeholder:text-gray-500"
            />
          </label>

          <div
            className="flex gap-0.5 rounded-[10px] border border-black/[0.14] bg-algo-blue-10/40 p-[3px] dark:border-white/10 dark:bg-white/5"
            role="group"
            aria-label="Sort members"
          >
            {SORTS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSort(option.key)}
                aria-pressed={sort === option.key}
                className={cn(
                  "flex-1 whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[13px] font-semibold transition-colors",
                  sort === option.key
                    ? "bg-white text-algo-blue shadow-sm dark:bg-algo-black dark:text-algo-teal"
                    : "text-algo-black-70 hover:text-algo-black dark:text-gray-400 dark:hover:text-white",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop — full ledger with a share bar per member */}
      <div className="hidden md:block">
        <div className="grid grid-cols-[44px_minmax(0,1fr)_120px_90px_240px] gap-5 border-b border-black/[0.14] px-3.5 pb-2.5 text-xs uppercase tracking-[0.06em] text-algo-black-50 dark:border-white/15 dark:text-gray-500">
          <span>#</span>
          <span>Address</span>
          <span className="text-right">Votes</span>
          <span className="text-right">Share</span>
          <span>Blocks proposed in period</span>
        </div>
        {visible.map((member, index) => (
          <div
            key={member.address}
            className="grid grid-cols-[44px_minmax(0,1fr)_120px_90px_240px] items-center gap-5 border-b border-black/[0.08] px-3.5 py-2.5 dark:border-white/10"
          >
            <span className="text-[13px] tabular-nums text-algo-black-50 dark:text-gray-500">
              {index + 1}
            </span>
            <span className="w-fit max-w-full">
              <UserPill variant="secondary" address={member.address} />
            </span>
            <span className="text-right text-[15.5px] font-bold tabular-nums text-algo-black dark:text-white">
              {member.votes.toLocaleString()}
            </span>
            <span className="text-right text-sm tabular-nums text-algo-black-70 dark:text-gray-400">
              {sharePercent(member.votes, totalVotes)}%
            </span>
            <span className="h-1.5 overflow-hidden rounded-sm bg-algo-black-10 dark:bg-white/10">
              <span
                className="block h-full rounded-sm bg-algo-blue dark:bg-algo-teal"
                style={{ width: barWidth(member.votes) }}
              />
            </span>
          </div>
        ))}
      </div>

      {/* Mobile — rank, address, votes, share on a single line */}
      <div className="md:hidden">
        {visible.map((member, index) => (
          <div
            key={member.address}
            className="flex items-center gap-2 border-t border-black/[0.08] py-2.5 dark:border-white/10"
          >
            <span className="w-5 shrink-0 text-xs tabular-nums text-algo-black-50 dark:text-gray-500">
              {index + 1}
            </span>
            <span className="mr-auto w-fit max-w-full text-xs">
              <UserPill variant="secondary" address={member.address} />
            </span>
            <span className="shrink-0 text-sm font-bold tabular-nums text-algo-black dark:text-white">
              {member.votes.toLocaleString()}
            </span>
            <span className="w-11 shrink-0 text-right text-xs tabular-nums text-algo-black-50 dark:text-gray-500">
              {sharePercent(member.votes, totalVotes)}%
            </span>
          </div>
        ))}
      </div>

      {matches.length === 0 && (
        <p className="px-3.5 py-7 text-[14.5px] text-algo-black-50 dark:text-gray-400">
          No member matches that address.
        </p>
      )}

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-4 text-sm font-semibold text-algo-blue hover:underline dark:text-algo-teal"
        >
          See all {matches.length.toLocaleString()} members
        </button>
      )}
    </section>
  );
}
