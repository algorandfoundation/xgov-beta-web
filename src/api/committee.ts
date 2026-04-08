
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
  const url = `/committees/${safeCommitteeId}.json`;

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
    console.error('Error fetching committee', error)
    throw new Error(`Error loading committee data from API: ${error instanceof Error ? error.message : String(error)}`);
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
export async function getCommitteeData(committeeId: Buffer): Promise<CommitteeData | null> {
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


export interface CommitteeVotingPower {
  committeeId: string;
  userVotes: number;
  totalVotes: number;
  memberCount: number;
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

    votingPower.push({
      committeeId: safeId,
      userVotes: member.votes,
      totalVotes,
      memberCount: data.xGovs.length,
    });
  }

  return votingPower;
}

export async function getXGovCommitteeMap(committeeId: Buffer): Promise<Map<string, number>> {
  const committee = await getCommitteeData(committeeId)
  if (!committee) {
    throw new Error('Committee data not found')
  }

  const m = new Map<string, number>()
  committee.xGovs.forEach(xgov => m.set(xgov.address, xgov.votes))
  return m
}