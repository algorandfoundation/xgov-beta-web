
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


export async function getXGovCommitteeMap(committeeId: Buffer): Promise<Map<string, number>> {
  const committee = await getCommitteeData(committeeId)
  if (!committee) {
    throw new Error('Committee data not found')
  }

  const m = new Map<string, number>()
  committee.xGovs.forEach(xgov => m.set(xgov.address, xgov.votes))
  return m
}