// Types
export interface CommitteeMember {
  address: string;
  votes: number;
}

export interface CommitteeData {
  xGovs: CommitteeMember[];
  [key: string]: any;
}

/**
 * Encodes a committee ID buffer to a base64url safe filename
 *
 * @param committeeId The committee ID as a Buffer
 * @returns A base64url encoded string safe for filenames
 */
export function committeeIdToSafeFileName(committeeId: Buffer): string {
  // Use base64url encoding (base64 without padding, using URL-safe characters)
  return committeeId
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Reverses `committeeIdToSafeFileName` — the committee ID as declared on the
 * Registry, i.e. the safe filename with its URL-safe characters and stripped
 * base64 padding put back.
 *
 * @param safeFileName The safe filename form of the committee ID
 * @returns The committee ID in its full, padded base64 form
 */
export function safeFileNameToCommitteeId(safeFileName: string): string {
  const base64 = safeFileName.replace(/-/g, "+").replace(/_/g, "/");
  return base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
}

/**
 * Attempts to load committee data from the external API
 *
 * @param safeCommitteeId The safe filename version of the committee ID
 * @param committeeIdStr String representation for logging
 * @param apiUrl Optional URL from the env
 * @returns Committee data if found, null otherwise
 */
export async function loadCommitteeFromAPI(
  safeCommitteeId: string,
  committeeIdStr: string,
): Promise<CommitteeData | null> {
  const url = `/api/committees/${safeCommitteeId}.json`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `API returned status ${response.status} for committee ID: ${committeeIdStr}`,
      );
    }

    const committeeData = await response.json();

    // Validate the API response has the expected structure
    if (
      !committeeData ||
      !committeeData.xGovs ||
      !Array.isArray(committeeData.xGovs)
    ) {
      throw new Error(
        `API returned invalid committee data format for committee ID: ${committeeIdStr}`,
      );
    }

    return committeeData as CommitteeData;
  } catch (error) {
    console.error("Error fetching committee", error);
    throw new Error(
      `Error loading committee data from API: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Retrieves committee data for a given committee ID
 *
 * This function attempts to load committee data from the external API.
 *
 * @param committeeId The committee ID as a Buffer
 * @returns Committee data if found, null otherwise
 */
export async function getCommitteeData(
  committeeId: Buffer,
): Promise<CommitteeData | null> {
  // For logging purposes - define outside try/catch to ensure it's available in the catch block
  const committeeIdStr = committeeId.toString("base64");

  try {
    // Convert committeeId to a base64url encoded filename
    const safeCommitteeId = committeeIdToSafeFileName(committeeId);

    // Try loading from API as a last resort
    const apiData = await loadCommitteeFromAPI(safeCommitteeId, committeeIdStr);

    if (apiData) {
      return apiData;
    }

    return null;
  } catch (error) {
    return null;
  }
}

// A committee is active for the 1M-block period that follows its block-production
// period, i.e. [periodEnd, periodEnd + ACTIVE_PERIOD_BLOCKS). Per the xGov spec.
export const ACTIVE_PERIOD_BLOCKS = 1_000_000;

// Unix seconds for the bounds of the two ranges a committee spans, or null where
// the round has no block yet and could not be projected.
export interface CommitteePeriodTimestamps {
  activeStart: number | null;
  activeEnd: number | null;
  prodStart: number | null;
  prodEnd: number | null;
}

/**
 * Resolves the two date ranges a committee spans, from real block timestamps:
 *  - the block-production period [periodStart, periodEnd) where votes are counted;
 *  - the active period [periodEnd, periodEnd + 1M) when the committee votes.
 *
 * Production bounds are always in the past (block production is retroactive). The
 * active period's end is in the future for the currently-running committee, so it
 * is projected from the observed production block rate.
 *
 * `getTimestamp` is injected so callers can supply the algod client appropriate to
 * their context (the browser's public client, or a server-side backend client).
 *
 * Only the currently-running committee should be missing its activeEnd block, so
 * callers that can tell an ended committee apart should pass
 * `projectActiveEnd: false` for those — otherwise a transient lookup failure is
 * indistinguishable from a block that doesn't exist yet, and gets projected.
 */
export async function resolveCommitteePeriod(
  periodStart: number,
  periodEnd: number,
  getTimestamp: (round: number) => Promise<number | null>,
  projectActiveEnd = true,
): Promise<CommitteePeriodTimestamps> {
  const [prodStart, prodEnd, activeEndTs] = await Promise.all([
    getTimestamp(periodStart),
    getTimestamp(periodEnd),
    getTimestamp(periodEnd + ACTIVE_PERIOD_BLOCKS),
  ]);

  // The active period is still running when its end block doesn't exist yet —
  // project it forward from the observed production block rate.
  let activeEnd = activeEndTs;
  if (
    activeEndTs === null &&
    projectActiveEnd &&
    prodStart !== null &&
    prodEnd !== null &&
    periodEnd > periodStart
  ) {
    const rate = (prodEnd - prodStart) / (periodEnd - periodStart);
    activeEnd = prodEnd + ACTIVE_PERIOD_BLOCKS * rate;
  }

  return { activeStart: prodEnd, activeEnd, prodStart, prodEnd };
}

/**
 * One committee as the index lists it: the figures printed on its row, plus the
 * two round ranges it spans already resolved to dates.
 *
 * Timestamps are unix seconds rather than `Date`s so the whole set survives the
 * trip from the server-rendered page into the client island unchanged.
 */
export interface CommitteeSummary {
  // Safe-filename form of the committee id — the `/committee/{id}` route param.
  id: string;
  // The same id in its full, padded base64 form, as declared on the Registry.
  // Null when the committee was only published under a round-keyed file name,
  // which does not carry an id.
  idBase64: string | null;
  // True only for the committee currently declared on the Registry.
  active: boolean;
  // Bounds of the block-production period, or null for legacy committee files
  // that predate the period fields.
  periodStart: number | null;
  periodEnd: number | null;
  members: number;
  votes: number;
  proposals: number;
  // Active period [periodEnd, periodEnd + 1M) — the headline range.
  activeStart: number | null;
  activeEnd: number | null;
  // Block-production period [periodStart, periodEnd) — "blocks counted".
  prodStart: number | null;
  prodEnd: number | null;
}

export interface CommitteeVotingPower {
  committeeId: string;
  userVotes: number;
  totalVotes: number;
  memberCount: number;
  // First block of the committee's governance period (inclusive). Undefined for
  // legacy committee files that predate the period fields.
  periodStart?: number;
  // Last block of the committee's governance period (exclusive).
  periodEnd?: number;
}

/**
 * Fetches voting power information for a given address across multiple committees
 *
 * @param address The wallet address to check
 * @param committeeIds Array of committee IDs as Uint8Arrays
 * @returns Array of CommitteeVotingPower for committees where the address is a member
 */
export async function getVotingPowerForAddress(
  address: string,
  committeeIds: Uint8Array[],
): Promise<CommitteeVotingPower[]> {
  // Deduplicate by base64 string and filter out empty IDs
  const seen = new Set<string>();
  const uniqueIds: { id: Uint8Array; key: string }[] = [];

  for (const id of committeeIds) {
    if (id.length === 0) continue;
    const key = Buffer.from(id).toString("base64");
    if (!seen.has(key)) {
      seen.add(key);
      uniqueIds.push({ id, key });
    }
  }

  const results = await Promise.allSettled(
    uniqueIds.map(({ id, key }) =>
      getCommitteeData(Buffer.from(id)).then((data) => ({
        data,
        key,
        safeId: committeeIdToSafeFileName(Buffer.from(id)),
      })),
    ),
  );

  const votingPower: CommitteeVotingPower[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled" || !result.value.data) continue;

    const { data, safeId } = result.value;
    const member = data.xGovs.find((m) => m.address === address);
    if (!member) continue;

    const totalVotes = data.xGovs.reduce((sum, m) => sum + m.votes, 0);

    const periodStart =
      typeof data.periodStart === "number" ? data.periodStart : undefined;
    const periodEnd =
      typeof data.periodEnd === "number" ? data.periodEnd : undefined;

    votingPower.push({
      committeeId: safeId,
      userVotes: member.votes,
      totalVotes,
      memberCount: data.xGovs.length,
      periodStart,
      periodEnd,
    });
  }

  // Newest committee first — governance periods are ordered by their start block.
  votingPower.sort((a, b) => (b.periodStart ?? 0) - (a.periodStart ?? 0));

  return votingPower;
}

export async function getXGovCommitteeMap(
  committeeId: Buffer,
): Promise<Map<string, number>> {
  const committee = await getCommitteeData(committeeId);
  if (!committee) {
    throw new Error("Committee data not found");
  }

  const m = new Map<string, number>();
  committee.xGovs.forEach((xgov) => m.set(xgov.address, xgov.votes));
  return m;
}
