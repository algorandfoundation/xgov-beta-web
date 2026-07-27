import {
  resolveCommitteePeriod,
  safeFileNameToCommitteeId,
  type CommitteeSummary,
} from "@/api/committee";
import {
  getCommitteeDataFromR2,
  listCommitteeFiles,
  type CommitteeData,
} from "@/server/committee-files";

export type { CommitteeSummary };

interface LoadCommitteeSummariesOptions {
  // Injected so the caller supplies the algod client for its context — the
  // backend one on the server, as the committee pages already do.
  getTimestamp: (round: number) => Promise<number | null>;
  // Safe-filename form of the committee currently declared on the Registry.
  activeCommitteeId?: string;
  // Proposals assigned to each committee, keyed by safe-filename id.
  proposalCounts?: Record<string, number>;
}

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

interface CommitteeFile {
  // File name without its `.json` suffix.
  name: string;
  data: CommitteeData;
}

/**
 * Whether a file name is one of the round-keyed convenience copies rather than
 * the canonical committee id.
 *
 * The generator publishes every committee three times — as `{committeeId}.json`,
 * `{periodStart}-{periodEnd}.json` and `{periodEnd}.json` — all with identical
 * contents. Only the first names the committee. The match is against the file's
 * own round bounds rather than a digits-shaped pattern, so a committee id can
 * never be mistaken for an alias.
 */
function isRoundAlias(file: CommitteeFile): boolean {
  const periodStart = asNumber(file.data.periodStart);
  const periodEnd = asNumber(file.data.periodEnd);
  if (periodEnd === undefined) return false;

  return (
    file.name === `${periodEnd}` ||
    (periodStart !== undefined && file.name === `${periodStart}-${periodEnd}`)
  );
}

/**
 * One file per committee: the copy named after the committee id, falling back to
 * a round-keyed alias only when the canonical copy is missing, so a published
 * period is never dropped from the index entirely.
 */
function pickCanonicalFiles(
  files: CommitteeFile[],
  activeCommitteeId?: string,
): CommitteeFile[] {
  const preferred = new Map<string, CommitteeFile>();

  for (const file of files) {
    const periodStart = asNumber(file.data.periodStart);
    const periodEnd = asNumber(file.data.periodEnd);

    // A file with no period cannot be an alias of anything — key it by its own
    // name so legacy committee files are never merged together.
    const key =
      periodEnd === undefined
        ? `name:${file.name}`
        : `period:${periodStart ?? ""}-${periodEnd}`;

    const current = preferred.get(key);
    if (!current || winsOver(file, current, activeCommitteeId)) {
      preferred.set(key, file);
    }
  }

  return [...preferred.values()];
}

function winsOver(
  candidate: CommitteeFile,
  current: CommitteeFile,
  activeCommitteeId?: string,
): boolean {
  const candidateNamesCommittee = !isRoundAlias(candidate);
  if (candidateNamesCommittee !== !isRoundAlias(current)) {
    return candidateNamesCommittee;
  }

  // Two distinct committee ids covering one period would mean the run was
  // regenerated; the one the Registry declares is the one that counts.
  if (activeCommitteeId) {
    if (candidate.name === activeCommitteeId) return true;
    if (current.name === activeCommitteeId) return false;
  }

  // Otherwise keep the first, so the index is stable across requests.
  return false;
}

/**
 * Every published committee, newest first, with the figures its index row shows
 * and both of its round ranges resolved to real block timestamps.
 *
 * The R2 bucket is the source of truth for which committees exist: a committee
 * is listed here whether or not any proposal was ever assigned to it. Files that
 * cannot be read or parsed are skipped rather than failing the whole index —
 * one bad file should not hide the rest.
 */
export async function loadCommitteeSummaries(
  locals: App.Locals,
  {
    getTimestamp,
    activeCommitteeId,
    proposalCounts = {},
  }: LoadCommitteeSummariesOptions,
): Promise<CommitteeSummary[]> {
  const files = await listCommitteeFiles(locals);

  const loaded = await Promise.all(
    files.map(async (file) => {
      try {
        const data = await getCommitteeDataFromR2(file.name, locals);
        return data ? { name: file.name.replace(/\.json$/, ""), data } : null;
      } catch (error) {
        console.error(`Failed to read committee file ${file.name}`, error);
        return null;
      }
    }),
  );

  const committees = pickCanonicalFiles(
    loaded.filter((entry): entry is CommitteeFile => entry !== null),
    activeCommitteeId,
  );

  // Only the committee currently on the Registry is still running, so it is the
  // only one whose active-end block may legitimately not exist yet. Without a
  // Registry read to go on, fall back to the newest period — otherwise a
  // transient block lookup failure would be projected into the future for every
  // ended committee.
  const newestPeriodStart = Math.max(
    -1,
    ...committees.map(({ data }) => asNumber(data.periodStart) ?? -1),
  );

  const summaries = await Promise.all(
    committees.map(async (file): Promise<CommitteeSummary> => {
      const { name: id, data } = file;
      const periodStart = asNumber(data.periodStart);
      const periodEnd = asNumber(data.periodEnd);
      const active = !!activeCommitteeId && activeCommitteeId === id;

      const period =
        periodStart !== undefined && periodEnd !== undefined
          ? await resolveCommitteePeriod(
              periodStart,
              periodEnd,
              getTimestamp,
              activeCommitteeId ? active : periodStart === newestPeriodStart,
            )
          : null;

      return {
        id,
        // Null when only a round-keyed copy of this committee was published —
        // that name is not an id, and printing it as one would be a lie.
        idBase64: isRoundAlias(file) ? null : safeFileNameToCommitteeId(id),
        active,
        periodStart: periodStart ?? null,
        periodEnd: periodEnd ?? null,
        members: asNumber(data.totalMembers) ?? data.xGovs.length,
        votes:
          asNumber(data.totalVotes) ??
          data.xGovs.reduce((sum, member) => sum + member.votes, 0),
        proposals: proposalCounts[id] ?? 0,
        activeStart: period?.activeStart ?? null,
        activeEnd: period?.activeEnd ?? null,
        prodStart: period?.prodStart ?? null,
        prodEnd: period?.prodEnd ?? null,
      };
    }),
  );

  // Newest committee first — governance periods are ordered by their start block.
  return summaries.sort((a, b) => (b.periodStart ?? 0) - (a.periodStart ?? 0));
}
